import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import nodemailer from "nodemailer";
import { parseEmail } from "./parser.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =========================
   FIREBASE INIT
========================= */
admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_KEY)
  )
});

const db = admin.firestore();

/* =========================
   EMAIL TRANSPORT (M365)
========================= */
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/* =========================
   ROUTING LOGIC
========================= */
function getRecipient(depot, shift) {
  if (depot === "FedEx" && shift === "Morning")
    return process.env.FEDEX_MORNING;

  if (depot === "FedEx" && shift === "Night")
    return process.env.FEDEX_NIGHT;

  if (depot === "Brima")
    return process.env.BRIMA;

  return process.env.DEFAULT;
}

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("Pakisa Booking System Running");
});

/* =========================
   ADD DRIVER (SETUP PAGE)
========================= */
app.post("/api/add-driver", async (req, res) => {
  try {
    const { name, surname, idNumber } = req.body;

    const docId = `${name}_${surname}_${Date.now()}`;

    await db.collection("drivers").doc(docId).set({
      name,
      surname,
      idNumber,
      createdAt: Date.now()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   ADD VEHICLE (SETUP PAGE)
========================= */
app.post("/api/add-vehicle", async (req, res) => {
  try {
    const { registration } = req.body;

    await db.collection("vehicles").doc(registration).set({
      registration,
      createdAt: Date.now()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   INIT SYSTEM (ONE TIME)
========================= */
app.post("/api/setup", async (req, res) => {
  try {
    await db.collection("drivers").doc("_init").set({ created: Date.now() });
    await db.collection("vehicles").doc("_init").set({ created: Date.now() });
    await db.collection("bookings").doc("_init").set({ created: Date.now() });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   MAIN BOOKING ENDPOINT
========================= */
app.post("/api/send-booking", async (req, res) => {
  try {
    const { rawText, depot, shift } = req.body;

    /* -------------------------
       1. PARSE EMAIL TEXT
    --------------------------*/
    const parsed = parseEmail(rawText);

    const recipient = getRecipient(depot, shift);

    /* -------------------------
       2. BUILD EMAIL BODY
    --------------------------*/
    const driverText = parsed.drivers
      .map(
        (d) =>
          `Driver: ${d.name} ${d.surname}\nID: ${d.idNumber}`
      )
      .join("\n\n");

    const emailBody = `
DEPOT ACCESS REQUEST

${driverText}

Vehicle: ${parsed.vehicle}
Depot: ${depot}
Shift: ${shift}

Kind Regards
Pakisa Access
    `;

    /* -------------------------
       3. SEND EMAIL
    --------------------------*/
    await transporter.sendMail({
      from: `"Pakisa Access" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: "Pakisa Access",
      text: emailBody
    });

    /* -------------------------
       4. SAVE TO FIREBASE
    --------------------------*/
    await db.collection("bookings").add({
      drivers: parsed.drivers,
      vehicle: parsed.vehicle,
      depot,
      shift,
      recipient,
      createdAt: Date.now(),
      status: "sent"
    });

    res.json({
      success: true,
      message: "Booking sent successfully"
    });

  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({
      error: "Failed to process booking"
    });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Pakisa System running on port ${PORT}`);
});

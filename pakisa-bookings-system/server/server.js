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
   FIREBASE INIT (SAFE)
========================= */
let serviceAccount;

try {
  if (!process.env.FIREBASE_KEY) {
    throw new Error("FIREBASE_KEY missing");
  }

  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  console.log("Firebase key parsed OK");

} catch (err) {
  console.error("Firebase init error:", err.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* =========================
   STARTUP FIRESTORE TEST
========================= */
(async () => {
  try {
    await db.collection("system").doc("status").set({
      status: "online",
      timestamp: Date.now()
    });

    console.log("Firestore OK");
  } catch (err) {
    console.error("Firestore FAILED:", err.message);
  }
})();

/* =========================
   EMAIL (M365)
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
   ROUTING
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
  res.send("Pakisa System Running");
});

/* =========================
   DEBUG FIRESTORE (REAL TEST)
========================= */
app.get("/api/debug-firebase", async (req, res) => {
  try {
    const ref = await db.collection("debug").add({
      test: true,
      createdAt: Date.now()
    });

    res.json({
      success: true,
      id: ref.id,
      project: serviceAccount.project_id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   ADD DRIVER
========================= */
app.post("/api/add-driver", async (req, res) => {
  try {
    const { name, surname, idNumber } = req.body;

    const ref = await db.collection("drivers").add({
      name,
      surname,
      idNumber,
      createdAt: Date.now()
    });

    res.json({ success: true, id: ref.id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   ADD VEHICLE
========================= */
app.post("/api/add-vehicle", async (req, res) => {
  try {
    const { registration } = req.body;

    const ref = await db.collection("vehicles").add({
      registration,
      createdAt: Date.now()
    });

    res.json({ success: true, id: ref.id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   SETUP SYSTEM
========================= */
app.post("/api/setup", async (req, res) => {
  try {
    await db.collection("system").doc("setup").set({
      initialized: true,
      timestamp: Date.now()
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   BOOKING (OPTIONAL SAFE PLACEHOLDER)
========================= */
app.post("/api/book", async (req, res) => {
  try {
    const booking = req.body;

    const ref = await db.collection("bookings").add({
      ...booking,
      createdAt: Date.now()
    });

    res.json({ success: true, id: ref.id });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET BOOKINGS (ADMIN PAGE)
========================= */
app.get("/api/bookings", async (req, res) => {
  try {
    const snap = await db.collection("bookings").get();

    const data = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(data);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

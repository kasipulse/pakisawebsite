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
  serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  console.log("Firebase key parsed successfully");
} catch (err) {
  console.error("FIREBASE_KEY ERROR:", err.message);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* =========================
   VERIFY FIRESTORE ON START
========================= */
db.collection("system").doc("status").set({
  status: "online",
  timestamp: Date.now()
})
.then(() => console.log("Firestore write OK"))
.catch(err => console.error("Firestore WRITE FAILED:", err));

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
   DEBUG FIRESTORE TEST
========================= */
app.get("/api/test-firestore", async (req, res) => {
  try {
    const ref = await db.collection("drivers").add({
      test: true,
      createdAt: Date.now()
    });

    res.json({
      success: true,
      id: ref.id
    });

  } catch (err) {
    console.error("Firestore test error:", err);
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
    console.error("Add driver error:", err);
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
    console.error("Add vehicle error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   SETUP
========================= */
app.post("/api/setup", async (req, res) => {
  try {
    await db.collection("system").doc("setup").set({
      initialized: true,
      timestamp: Date.now()
    });

    res.json({ success: true });

  } catch (err) {
    console.error("Setup error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Pakisa System running on port ${PORT}`);
});

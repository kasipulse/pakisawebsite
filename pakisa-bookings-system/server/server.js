import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { Resend } from "resend";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/* =========================
   FIREBASE INIT (WITH SAFETY WRAPPER)
========================= */
let db;
try {
  if (!process.env.FIREBASE_KEY) {
    throw new Error("FIREBASE_KEY is missing from environment variables!");
  }
  const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  db = admin.firestore();
  console.log("Firebase initialized successfully");
} catch (err) {
  console.error("FATAL ERROR: Firebase failed to initialize:", err.message);
}

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => res.send("Pakisa Logistics Backend is Online 🚀"));

// Add Driver Route
app.post("/api/add-driver", async (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const ref = await db.collection("drivers").add(req.body);
    res.json({ success: true, id: ref.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add Vehicle Route
app.post("/api/add-vehicle", async (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const ref = await db.collection("vehicles").add(req.body);
    res.json({ success: true, id: ref.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bootstrap Dropdown Data
app.get("/api/bootstrap", async (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const driversSnap = await db.collection("drivers").get();
    const vehiclesSnap = await db.collection("vehicles").get();
    const drivers = driversSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const vehicles = vehiclesSnap.docs.map(v => ({ id: v.id, ...v.data() }));
    res.json({ drivers, vehicles });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bookings Route
app.post("/api/book", async (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    const { depot, shift, vehicle, drivers } = req.body;
    
    const driverList = drivers
      .map(d => `Name: ${d.name} ${d.surname}\nID: ${d.idNumber}`)
      .join("\n\n");

    let toList = [];
    const ccList = ['tebogo@pakisalogistics.co.za', 'ops1@pakisalogistics.co.za'];

    if (depot === 'FedEx') {
      toList = shift === 'Night' 
        ? ["stanleym@pakisalogistics.co.za", "ambani.muilambudzi@fedex.com", "lucky.mokoena@fedex.com", "SSASecurityControlRoom@corp.ds.fedex.com"]
        : ["SSASecurityControlRoom@corp.ds.fedex.com", "petrus.mphutlane@fedex.com", "moeketsi.malema@fedex.com"];
    } else if (depot === 'Brima') {
      toList = ["richard.mohlala@brima.com", "gauteng.collections@brima.com", "rebecca.ndhlovu@brima.com"];
    }

    const emailBody = `${driverList}\n\nVehicle Reg: ${vehicle}\nShift: ${shift}\n\n---\nSystem Generated Message: This is an automated notification for site access verification.`;

    const { data, error } = await resend.emails.send({
      from: 'Pakisa <driver1@pakisalogistics.co.za>',
      to: toList,
      cc: ccList,
      reply_to: 'ops1@pakisalogistics.co.za',
      subject: 'Pakisa Access',
      text: emailBody,
    });

    if (error) throw new Error(error.message);

    await db.collection("bookings").add(req.body);
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("Server running on port", PORT));

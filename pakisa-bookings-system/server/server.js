import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =========================
   FIREBASE INIT (CLEAN)
========================= */
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* =========================
   ROOT ROUTE
========================= */
app.get("/", (req, res) => {
  res.send("Pakisa Logistics Backend is Online 🚀");
});

/* =========================
   TEST ROUTE (MUST WORK)
========================= */
app.get("/api/test", async (req, res) => {
  try {
    const ref = await db.collection("test").add({
      message: "firestore working",
      createdAt: Date.now()
    });

    res.json({ success: true, id: ref.id });
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
    const ref = await db.collection("drivers").add(req.body);
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
    const ref = await db.collection("vehicles").add(req.body);
    res.json({ success: true, id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET DROPDOWNS DATA
========================= */
app.get("/api/bootstrap", async (req, res) => {
  try {
    const driversSnap = await db.collection("drivers").get();
    const vehiclesSnap = await db.collection("vehicles").get();

    const drivers = driversSnap.docs.map(d => d.data());
    const vehicles = vehiclesSnap.docs.map(v => v.data());

    res.json({ drivers, vehicles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   BOOKINGS (STORE + FETCH)
========================= */
app.post("/api/book", async (req, res) => {
  try {
    const ref = await db.collection("bookings").add(req.body);
    res.json({ success: true, id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/bookings", async (req, res) => {
  try {
    const snap = await db.collection("bookings").get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));

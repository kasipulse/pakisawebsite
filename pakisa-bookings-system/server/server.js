import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import sgMail from "@sendgrid/mail";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

/* =========================
   FIREBASE INIT
========================= */
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

/* =========================
   ROUTES
========================= */
app.get("/", (req, res) => res.send("Pakisa Logistics Backend is Online 🚀"));

app.post("/api/add-driver", async (req, res) => {
  try {
    const ref = await db.collection("drivers").add(req.body);
    res.json({ success: true, id: ref.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/add-vehicle", async (req, res) => {
  try {
    const ref = await db.collection("vehicles").add(req.body);
    res.json({ success: true, id: ref.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/bootstrap", async (req, res) => {
  try {
    const driversSnap = await db.collection("drivers").get();
    const vehiclesSnap = await db.collection("vehicles").get();
    const drivers = driversSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const vehicles = vehiclesSnap.docs.map(v => ({ id: v.id, ...v.data() }));
    res.json({ drivers, vehicles });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/book", async (req, res) => {
  try {
    const { depot, shift, vehicle, drivers } = req.body;
    const driverList = drivers
      .map(d => `Name: ${d.name} ${d.surname}\nID: ${d.idNumber}`)
      .join("\n\n");

    const emailBody = `Hi Team,\n\nBooking Details:\n\n${driverList}\n\nVehicle: ${vehicle}\nShift: ${shift}`;

    const msg = {
      to: 'mahlabampho01@gmail.com',
      cc: 'tebogo@pakisalogistics.co.za',
      from: 'bookings@pakisalogistics.co.za', 
      subject: 'PAKISA ACCESS TO DEPOT',
      text: emailBody,
    };

    await sgMail.send(msg);
    await db.collection("bookings").add(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));

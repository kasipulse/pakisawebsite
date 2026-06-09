import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { Resend } from "resend";

dotenv.config();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

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

// Add Driver Route
app.post("/api/add-driver", async (req, res) => {
  try {
    const ref = await db.collection("drivers").add(req.body);
    res.json({ success: true, id: ref.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Add Vehicle Route
app.post("/api/add-vehicle", async (req, res) => {
  try {
    const ref = await db.collection("vehicles").add(req.body);
    res.json({ success: true, id: ref.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bootstrap Dropdown Data
app.get("/api/bootstrap", async (req, res) => {
  try {
    const driversSnap = await db.collection("drivers").get();
    const vehiclesSnap = await db.collection("vehicles").get();
    const drivers = driversSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const vehicles = vehiclesSnap.docs.map(v => ({ id: v.id, ...v.data() }));
    res.json({ drivers, vehicles });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bookings Route (Store + Email via Resend API)
app.post("/api/book", async (req, res) => {
  try {
    const { depot, shift, vehicle, drivers } = req.body;
    
    // 1. Format the driver list string
    const driverList = drivers
      .map(d => `Name: ${d.name} ${d.surname}\nID: ${d.idNumber}`)
      .join("\n\n");

    // 2. Determine Recipients based on Depot and Shift
    let toList = [];
    const ccList = ['tebogo@pakisalogistics.co.za', 'ops1@pakisalogistics.co.za'];

    if (depot === 'FedEx') {
      if (shift === 'Night') {
        toList = ["stanleym@pakisalogistics.co.za", "ambani.muilambudzi@fedex.com", "lucky.mokoena@fedex.com", "SSASecurityControlRoom@corp.ds.fedex.com"];
      } else {
        toList = ["SSASecurityControlRoom@corp.ds.fedex.com", "petrus.mphutlane@fedex.com", "moeketsi.malema@fedex.com"];
      }
    } else if (depot === 'Brima') {
      toList = ["richard.mohlala@brima.com", "gauteng.collections@brima.com", "rebecca.ndhlovu@brima.com"];
    }

    // 3. Construct Email Body with footer message
    const emailBody = `${driverList}\n\nVehicle Reg: ${vehicle}\nShift: ${shift}\n\n---\nSystem Generated Message: This is an automated notification for site access verification.`;

    // 4. Send email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Pakisa <driver1@pakisalogistics.co.za>',
      to: toList,
      cc: ccList,
      reply_to: 'ops1@pakisalogistics.co.za',
      subject: 'Pakisa Access',
      text: emailBody,
    });

    if (error) {
      console.error("Resend Error:", error);
      return res.status(500).json({ error: error.message });
    }

    // 5. Save the booking to Firestore
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
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));

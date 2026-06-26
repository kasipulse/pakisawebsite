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
   FIREBASE INIT
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
   ROUTES WITH DEBUGGING
========================= */
app.get("/", (req, res) => res.send("Pakisa Logistics Backend is Online 🚀"));

// Add Driver Route
app.post("/api/add-driver", async (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    console.log("Adding driver...");
    const ref = await db.collection("drivers").add(req.body);
    res.json({ success: true, id: ref.id });
  } catch (err) { 
    console.error("ADD DRIVER ERROR:", err.message);
    res.status(500).json({ error: err.message }); 
  }
});

// Bootstrap Dropdown Data
app.get("/api/bootstrap", async (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    
    console.log("Attempting to fetch drivers...");
    const driversSnap = await db.collection("drivers").get();
    
    console.log("Attempting to fetch vehicles...");
    const vehiclesSnap = await db.collection("vehicles").get();
    
    const drivers = driversSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const vehicles = vehiclesSnap.docs.map(v => ({ id: v.id, ...v.data() }));
    
    console.log(`Bootstrap fetch successful: ${drivers.length} drivers, ${vehicles.length} vehicles.`);
    res.json({ drivers, vehicles });
  } catch (err) { 
    console.error("BOOTSTRAP ROUTE ERROR:", err); // Logs the full stack trace
    res.status(500).json({ error: err.message }); 
  }
});

// Bookings Route
app.post("/api/book", async (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    console.log("Processing booking request...");
    
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

    console.log("Sending email via Resend...");
    const { data, error } = await resend.emails.send({
      from: 'Pakisa <driver1@pakisalogistics.co.za>',
      to: toList,
      cc: ccList,
      reply_to: 'ops1@pakisalogistics.co.za',
      subject: 'Pakisa Access',
      text: emailBody,
    });

    if (error) throw new Error(error.message);

    console.log("Saving booking to Firestore...");
    await db.collection("bookings").add(req.body);
    
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error("BOOKING ROUTE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error("GLOBAL UNHANDLED ERROR:", err.stack);
  res.status(500).send({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("Server running on port", PORT));

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/* =========================
   FIREBASE INIT (FILE-BASED)
========================= */
let db;
try {
  // Read the key from the serviceAccountKey.json file in your project folder
  const keyPath = path.join(__dirname, 'serviceAccountKey.json');
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  db = admin.firestore();
  console.log("Firebase initialized successfully from local file");
} catch (err) {
  console.error("FATAL ERROR: Could not load serviceAccountKey.json:", err.message);
  process.exit(1); 
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
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

app.get("/api/bootstrap", async (req, res) => {
  try {
    if (!db) throw new Error("Database not initialized");
    
    console.log("Fetching drivers...");
    const driversSnap = await db.collection("drivers").get();
    console.log(`Found ${driversSnap.size} driver docs`);

    console.log("Fetching vehicles...");
    const vehiclesSnap = await db.collection("vehicles").get();
    console.log(`Found ${vehiclesSnap.size} vehicle docs`);
    
    // Debug: Check the first document structure
    if (!driversSnap.empty) {
        console.log("Sample driver doc:", driversSnap.docs[0].data());
    }
    if (!vehiclesSnap.empty) {
        console.log("Sample vehicle doc:", vehiclesSnap.docs[0].data());
    }
    
    const drivers = driversSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const vehicles = vehiclesSnap.docs.map(v => ({ id: v.id, ...v.data() }));
    
    res.json({ drivers, vehicles });
  } catch (err) { 
    console.error("BOOTSTRAP ROUTE ERROR:", err);
    res.status(500).json({ error: err.message }); 
  }
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
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log("Server running on port", PORT));

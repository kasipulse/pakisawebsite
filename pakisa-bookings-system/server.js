import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { Resend } from "resend";
import fs from "fs"; // Required for reading the service key
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Enable CORS for your specific frontend domain
app.use(cors({
    origin: ['https://www.pakisalogistics.co.za', 'https://pakisalogistics.co.za'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
}));

app.use(express.json());

const resend = new Resend(process.env.RESEND_API_KEY);

/* ======================================
   FIREBASE INITIALIZATION
====================================== */
let db;
try {
    // Looks for serviceAccountKey.json in the same 'server/' folder
    const keyPath = path.join(__dirname, "serviceAccountKey.json");
    const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();
    console.log("✅ Firebase initialized successfully");
} catch (err) {
    console.error("❌ FIREBASE INITIALIZATION FAILED:", err);
    process.exit(1);
}

/* ======================================
   API ROUTES
====================================== */
app.get("/api/bootstrap", async (req, res) => {
    try {
        const driversSnap = await db.collection("drivers").get();
        const vehiclesSnap = await db.collection("vehicles").get();
        
        const drivers = driversSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const vehicles = vehiclesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({ success: true, drivers, vehicles });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

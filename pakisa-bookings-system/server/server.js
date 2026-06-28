import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { Resend } from "resend";
import fs from "fs"; // <--- THIS IS WHAT WAS MISSING
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// 1. IMPROVED CORS: Explicitly allow your domain
app.use(cors({
    origin: ['https://www.pakisalogistics.co.za', 'https://pakisalogistics.co.za'],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());
app.use(express.static("public"));

const resend = new Resend(process.env.RESEND_API_KEY);

/* ======================================
   FIREBASE INITIALIZATION
====================================== */
let db;
try {
    // SECURITY FIX: If SERVICE_ACCOUNT_JSON is in environment variables, use it.
    // Otherwise, fallback to the local file (for local development).
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
        : JSON.parse(fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8"));

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
   ROUTES
====================================== */
app.get("/api/bootstrap", async (req, res) => {
    try {
        const [driversSnap, vehiclesSnap] = await Promise.all([
            db.collection("drivers").get(),
            db.collection("vehicles").get()
        ]);

        const drivers = driversSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const vehicles = vehiclesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json({ success: true, drivers, vehicles });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post("/api/book", async (req, res) => {
    try {
        const { depot, shift, vehicle, drivers = [] } = req.body;
        
        // ... (Keep your existing Resend and DB booking logic here) ...
        
        const booking = await db.collection("bookings").add(req.body);
        res.json({ success: true, bookingId: booking.id });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

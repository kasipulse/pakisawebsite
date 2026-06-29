import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { Resend } from "resend";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// 1. CORS DISABLED: Allow all origins and disable credential requirements
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

// Explicitly handle preflight for all routes
app.options('*', cors()); 

app.use(express.json());
app.use(express.static("public"));

// 2. Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// 3. FIREBASE INITIALIZATION
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("✅ Firebase initialized successfully");
} catch (err) {
    console.error("❌ FIREBASE INITIALIZATION FAILED:", err);
    process.exit(1);
}

const db = admin.firestore();

// 4. BOOTSTRAP ROUTE
app.get("/api/bootstrap", async (req, res) => {
    try {
        const [driversSnap, vehiclesSnap] = await Promise.all([
            db.collection("drivers").get(),
            db.collection("vehicles").get()
        ]);
        
        const drivers = driversSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const vehicles = vehiclesSnap.docs.map(v => ({ id: v.id, ...v.data() }));
        
        res.json({ success: true, drivers, vehicles });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 5. BOOKING ROUTE
app.post("/api/book", async (req, res) => {
    try {
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

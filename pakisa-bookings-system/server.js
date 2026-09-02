import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { Resend } from "resend";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// 🚀 PLACE PING ROUTE ABSOLUTELY FIRST (Bypasses middleware & DB connection delays)
app.get("/api/ping", (req, res) => res.status(200).send("OK"));
app.head("/api/ping", (req, res) => res.status(200).send());

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS', 'HEAD'] }));
app.use(express.json());
app.use(express.static("public"));

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Initialize Firebase
try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log("✅ Firebase initialized");
} catch (err) {
    console.error("❌ FIREBASE INIT FAILED:", err);
    process.exit(1);
}

const db = admin.firestore();

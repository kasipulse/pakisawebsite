import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: '*' })); // Allow all origins for the rebuild
app.use(express.json());

// Firebase Init
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// API Routes
app.get("/api/bootstrap", async (req, res) => {
    try {
        const drivers = (await db.collection("drivers").get()).docs.map(d => ({id: d.id, ...d.data()}));
        const vehicles = (await db.collection("vehicles").get()).docs.map(v => ({id: v.id, ...v.data()}));
        res.json({ success: true, drivers, vehicles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(process.env.PORT || 10000, () => console.log("🚀 Server Ready"));

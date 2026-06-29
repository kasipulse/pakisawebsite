import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors()); // Simplest setup to start
app.use(express.json());
app.use(express.static("public")); // Now correctly points to /public

// Firebase Init
const serviceAccount = JSON.parse(fs.readFileSync(path.join(__dirname, "serviceAccountKey.json"), "utf8"));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Bootstrap Route
app.get("/api/bootstrap", async (req, res) => {
    try {
        const drivers = (await db.collection("drivers").get()).docs.map(d => ({id: d.id, ...d.data()}));
        const vehicles = (await db.collection("vehicles").get()).docs.map(v => ({id: v.id, ...v.data()}));
        res.json({ drivers, vehicles });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

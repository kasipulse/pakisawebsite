import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { Resend } from "resend";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
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

// 1. BOOTSTRAP ROUTE
app.get("/api/bootstrap", async (req, res) => {
    try {
        const [driversSnap, vehiclesSnap] = await Promise.all([
            db.collection("drivers").get(),
            db.collection("vehicles").get()
        ]);
        res.json({ 
            drivers: driversSnap.docs.map(d => ({ id: d.id, ...d.data() })), 
            vehicles: vehiclesSnap.docs.map(v => ({ id: v.id, ...v.data() })) 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. BOOKING ROUTE (With Dynamic Email Routing)
app.post("/api/book", async (req, res) => {
    try {
        const { depot, shift, vehicle, drivers } = req.body;

        // Routing Logic
        let toRecipients = [];
        if (depot === "FedEx") {
            toRecipients = (shift === "Morning") 
                ? ["SSASOC@fedex.com", "moeketsi.malema@fedex.com", "petrus.mphutlane@fedex.com", "SSASecurityControlRoom@corp.ds.fedex.com", "moeketsi.ncongwane@fedex.com"]
                : ["SSASOC@fedex.com", "lucky.mokoena@fedex.com", "ntomibikayise.mntande.osv@fedex.com", "SSASecurityControlRoom@corp.ds.fedex.com", "ambani.muilambudzi@fedex.com", "stshabalala@fedex.com", "sipho.manaka@fedex.com", "selby.mufamadi@fedex.com", "valdemiro.macome@fedex.com"];
        } else if (depot === "Brima") {
            toRecipients = ["rebecca.ndhlovu@brima.com", "gauteng.collections@brima.com", "richard.mohlala@brima.com"];
        }

        // Exact Formatting
        const driverDetails = drivers.map(d => `Name: ${d.name} ${d.surname}\nID: ${d.idNumber}`).join("\n\n");
        const emailBody = `${driverDetails}\n\nVehicle Reg: ${vehicle}\nShift: ${shift}\n\n---\nSystem Generated Message: This is an automated notification for site access verification.`;

        // Send Email
        await resend.emails.send({
            from: 'Pakisa Logistics <bookings@pakisalogistics.co.za>',
            to: toRecipients,
            cc: ['tebogo@pakisalogistics.co.za', 'ops1@pakisalogistics.co.za'],
            subject: 'Pakisa Access',
            text: emailBody
        });

        // Save to Firestore
        await db.collection("bookings").add({ ...req.body, timestamp: admin.firestore.FieldValue.serverTimestamp() });
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));

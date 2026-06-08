import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { Resend } from "resend"; // Import Resend

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Initialize Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

/* =========================
   BOOKINGS (STORE + EMAIL)
========================= */
app.post("/api/book", async (req, res) => {
  try {
    const { depot, shift, vehicle, drivers } = req.body;

    const driverList = drivers
      .map(d => `Name: ${d.name} ${d.surname}\nID: ${d.idNumber}`)
      .join("\n\n");

    const emailBody = `Hi Team,\n\nA new booking has been created for the depot.\n\n${driverList}\n\nVehicle Reg: ${vehicle}\nShift: ${shift}`;

    // Send Email via API (No firewall blocks!)
    await resend.emails.send({
      from: 'Pakisa Logistics <bookings@pakisalogistics.co.za>',
      to: 'mahlabampho01@gmail.com',
      cc: 'tebogo@pakisalogistics.co.za', // Added requested CC
      replyTo: 'ops1@pakisalogistics.co.za',
      subject: 'PAKISA ACCESS TO DEPOT',
      text: emailBody
    });

    // Save to Firestore
    await db.collection("bookings").add(req.body);
    res.json({ success: true });
  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { Resend } from "resend";

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.get("/", (req, res) => res.send("Pakisa Logistics Backend is Online 🚀"));

app.post("/api/add-driver", async (req, res) => {
  try {
    const ref = await db.collection("drivers").add(req.body);
    res.json({ success: true, id: ref.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/add-vehicle", async (req, res) => {
  try {
    const ref = await db.collection("vehicles").add(req.body);
    res.json({ success: true, id: ref.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get("/api/bootstrap", async (req, res) => {
  try {
    const driversSnap = await db.collection("drivers").get();
    const vehiclesSnap = await db.collection("vehicles").get();
    const drivers = driversSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const vehicles = vehiclesSnap.docs.map(v => ({ id: v.id, ...v.data() }));
    res.json({ drivers, vehicles });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/book", async (req, res) => {
  try {
    const { depot, shift, vehicle, drivers } = req.body;
    
    const driverList = drivers
      .map(d => `Name: ${d.name} ${d.surname}\nID: ${d.idNumber}`)
      .join("\n\n");

    let toList = [];
    const ccList = ['tebogo@pakisalogistics.co.za', 'ops1@pakisalogistics.co.za'];

    if (depot === 'FedEx') {
      if (shift === 'Night') {
        toList = ["stanleym@pakisalogistics.co.za", "ambani.muilambudzi@fedex.com", "lucky.mokoena@fedex.com", "SSASecurityControlRoom@corp.ds.fedex.com"];
      } else {
        toList = ["SSASecurityControlRoom@corp.ds.fedex.com", "petrus.mphutlane@fedex.com", "moeketsi.malema@fedex.com"];
      }
    } else {
      // Brima
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

    if (error) throw error;

    await db.collection("bookings").add(req.body);
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running on", PORT));

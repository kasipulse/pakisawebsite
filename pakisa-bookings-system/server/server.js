import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const resend = new Resend(process.env.RESEND_API_KEY);

/* ======================================
   FIREBASE INITIALIZATION
====================================== */

let db;

try {
    const keyPath = path.join(__dirname, "serviceAccountKey.json");

    console.log("Loading Firebase key from:", keyPath);

    const serviceAccount = JSON.parse(
        fs.readFileSync(keyPath, "utf8")
    );

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });

    db = admin.firestore();

    console.log("✅ Firebase initialized successfully");

} catch (err) {

    console.error("❌ FIREBASE INITIALIZATION FAILED");
    console.error(err);
    process.exit(1);

}

/* ======================================
   ROUTES
====================================== */

app.get("/api/version", (req, res) => {
    res.json({
        version: "debug-2026-06-26",
        server: "pakisa-bookings-system",
        node: process.version,
        cwd: process.cwd(),
        dirname: __dirname,
        routes: [
            "/",
            "/health",
            "/api/version",
            "/api/bootstrap",
            "/api/add-driver",
            "/api/book"
        ]
    });
});

/* ======================================
   ADD DRIVER
====================================== */

app.post("/api/add-driver", async (req, res) => {

    try {

        const ref = await db.collection("drivers").add(req.body);

        res.json({
            success: true,
            id: ref.id
        });

    } catch (err) {

        console.error("ADD DRIVER ERROR");
        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

/* ======================================
   BOOTSTRAP
====================================== */

app.get("/api/bootstrap", async (req, res) => {

    try {

        console.log("========== BOOTSTRAP ==========");

        if (!db)
            throw new Error("Firestore not initialized");

        console.log("Loading collections...");

        const [
            driversSnap,
            vehiclesSnap
        ] = await Promise.all([
            db.collection("drivers").get(),
            db.collection("vehicles").get()
        ]);

        console.log(`Drivers: ${driversSnap.size}`);
        console.log(`Vehicles: ${vehiclesSnap.size}`);

        const drivers = [];
        const vehicles = [];

        driversSnap.forEach(doc => {

            try {

                drivers.push({
                    id: doc.id,
                    ...doc.data()
                });

            } catch (e) {

                console.error("Bad driver document:", doc.id);
                console.error(e);

            }

        });

        vehiclesSnap.forEach(doc => {

            try {

                vehicles.push({
                    id: doc.id,
                    ...doc.data()
                });

            } catch (e) {

                console.error("Bad vehicle document:", doc.id);
                console.error(e);

            }

        });

        console.log("Sending bootstrap response");

        res.json({
            success: true,
            drivers,
            vehicles
        });

    } catch (err) {

        console.error("========== BOOTSTRAP FAILED ==========");
        console.error(err);
        console.error(err.stack);

        res.status(500).json({
            success: false,
            error: err.message,
            stack:
                process.env.NODE_ENV === "development"
                    ? err.stack
                    : undefined
        });

    }

});

/* ======================================
   BOOKINGS
====================================== */

app.post("/api/book", async (req, res) => {

    try {

        const {
            depot,
            shift,
            vehicle,
            drivers = []
        } = req.body;

        if (!drivers.length)
            throw new Error("No drivers supplied.");

        const driverList = drivers
            .map(d =>
                `Name: ${d.name} ${d.surname}\nID: ${d.idNumber}`
            )
            .join("\n\n");

        let toList = [];

        const ccList = [
            "tebogo@pakisalogistics.co.za",
            "ops1@pakisalogistics.co.za"
        ];

        if (depot === "FedEx") {

            toList =
                shift === "Night"
                    ? [
                          "stanleym@pakisalogistics.co.za",
                          "ambani.muilambudzi@fedex.com",
                          "lucky.mokoena@fedex.com",
                          "SSASecurityControlRoom@corp.ds.fedex.com"
                      ]
                    : [
                          "SSASecurityControlRoom@corp.ds.fedex.com",
                          "petrus.mphutlane@fedex.com",
                          "moeketsi.malema@fedex.com"
                      ];

        } else if (depot === "Brima") {

            toList = [
                "richard.mohlala@brima.com",
                "gauteng.collections@brima.com",
                "rebecca.ndhlovu@brima.com"
            ];

        }

        const emailBody = `${driverList}

Vehicle Reg: ${vehicle}
Shift: ${shift}

---
System Generated Message: This is an automated notification for site access verification.`;

        const { data, error } = await resend.emails.send({

            from: "Pakisa <driver1@pakisalogistics.co.za>",
            to: toList,
            cc: ccList,
            reply_to: "ops1@pakisalogistics.co.za",
            subject: "Pakisa Access",
            text: emailBody

        });

        if (error)
            throw new Error(error.message);

        const booking = await db.collection("bookings").add(req.body);

        res.json({

            success: true,
            bookingId: booking.id,
            emailId: data?.id

        });

    } catch (err) {

        console.error("BOOKING ERROR");
        console.error(err);

        res.status(500).json({

            success: false,
            error: err.message

        });

    }

});

/* ======================================
   SERVER
====================================== */

const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {

    console.log(`🚀 Server running on port ${PORT}`);

});

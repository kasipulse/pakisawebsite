import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-tNc4sqO0gAstGxRXAkx4CR1xG2e831o",
  authDomain: "fuel-management-system-7784c.firebaseapp.com",
  projectId: "fuel-management-system-7784c",
  storageBucket: "fuel-management-system-7784c.firebasestorage.app",
  messagingSenderId: "718691738844",
  appId: "1:718691738844:web:a590ae6d2c734ffa1f4019"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

window.login = async function () {

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);

    window.location.href = "dashboard.html";

  } catch (err) {
    alert(err.message);
  }
};

window.logout = async function () {
  await signOut(auth);
  window.location.href = "index.html";
};

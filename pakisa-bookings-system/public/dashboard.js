// 1. ADD YOUR CONFIGURATION HERE (MUST BE AT THE TOP)
const firebaseConfig = {
  apiKey: "AIzaSyDlRegs0tOy3YENNf7A12Gnxb_Plvyvi7E",
  authDomain: "pakisa-bookings.firebaseapp.com",
  projectId: "pakisa-bookings",
  storageBucket: "pakisa-bookings.firebasestorage.app",
  messagingSenderId: "65720853256",
  appId: "1:65720853256:web:1f3497edd91a38eb1ac2bd",
  measurementId: "G-13TQ98XXTS"
};

// 2. Initialize Firebase (This fixes the 'no app' error)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// 3. Now define auth
const auth = firebase.auth();

// Redirect if not logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        document.getElementById('user-display').innerText = "Logged in as: " + user.email;
    } else {
        window.location.href = "/"; // Back to login
    }
});

// Logout functionality
document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = "/";
    });
});

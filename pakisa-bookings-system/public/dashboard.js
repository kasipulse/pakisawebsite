const firebaseConfig = {
  apiKey: "AIzaSyDlRegs0tOy3YENNf7A12Gnxb_Plvyvi7E",
  authDomain: "pakisa-bookings.firebaseapp.com",
  projectId: "pakisa-bookings",
  storageBucket: "pakisa-bookings.firebasestorage.app",
  messagingSenderId: "65720853256",
  appId: "1:65720853256:web:1f3497edd91a38eb1ac2bd",
  measurementId: "G-13TQ98XXTS"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    // Select both the login UI and the dashboard UI
    const loginArea = document.getElementById('login-area'); // Add this to your HTML
    const dashboardArea = document.getElementById('booking-area');
    
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Logged in: Show dashboard, hide login
            if (loginArea) loginArea.style.display = 'none';
            if (dashboardArea) dashboardArea.style.display = 'block';
            document.getElementById('user-display').innerText = "Logged in as: " + user.email;
        } else {
            // Not logged in: Show login, hide dashboard
            if (loginArea) loginArea.style.display = 'block';
            if (dashboardArea) dashboardArea.style.display = 'none';
        }
    });
});

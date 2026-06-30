// 1. Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlRegs0tOy3YENNf7A12Gnxb_Plvyvi7E",
  authDomain: "pakisa-bookings.firebaseapp.com",
  projectId: "pakisa-bookings",
  storageBucket: "pakisa-bookings.firebasestorage.app",
  messagingSenderId: "65720853256",
  appId: "1:65720853256:web:1f3497edd91a38eb1ac2bd",
  measurementId: "G-13TQ98XXTS"
};

// 2. Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();

// 3. Handle Auth State with a Delay Guard
document.addEventListener('DOMContentLoaded', () => {
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');

    auth.onAuthStateChanged((user) => {
        if (user) {
            // User is signed in
            if (userDisplay) {
                userDisplay.innerText = "Logged in as: " + user.email;
            }
        } else {
            // Wait 1 second before forcing a redirect to avoid false negatives
            setTimeout(() => {
                if (!auth.currentUser && window.location.pathname !== "/") {
                    window.location.href = "/";
                }
            }, 1000); 
        }
    });

    // 4. Logout functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = "/";
            });
        });
    }
});

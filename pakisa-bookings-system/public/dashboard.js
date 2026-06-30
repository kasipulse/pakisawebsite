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

// 3. Force Local Persistence
// This is critical: it ensures the session is saved across the redirect
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        // Now wait for the auth state to load
        handleAuthState();
    })
    .catch((error) => {
        console.error("Persistence error:", error);
        handleAuthState(); // Proceed anyway
    });

function handleAuthState() {
    document.addEventListener('DOMContentLoaded', () => {
        const userDisplay = document.getElementById('user-display');
        const logoutBtn = document.getElementById('logout-btn');

        // Check if we already have a user
        auth.onAuthStateChanged((user) => {
            if (user) {
                // SUCCESS: User found
                if (userDisplay) {
                    userDisplay.innerText = "Logged in as: " + user.email;
                }
            } else {
                // FAILURE: Wait to ensure it's not a temporary loading state
                setTimeout(() => {
                    if (!auth.currentUser && window.location.pathname !== "/") {
                        console.log("No user session found, redirecting to login.");
                        window.location.href = "/";
                    }
                }, 1500); // Increased to 1.5s to be safe
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
}

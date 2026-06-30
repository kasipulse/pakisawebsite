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

// Immediately hide content to prevent flicker
document.documentElement.style.visibility = 'hidden';

// AUTH STATE OBSERVER
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is logged in!
        document.getElementById('user-display').innerText = "Logged in as: " + user.email;
        document.documentElement.style.visibility = 'visible';
    } else {
        // Not logged in. 
        // Force-wait 2 seconds to see if a session appears late (due to redirect delay)
        setTimeout(() => {
            if (!auth.currentUser) {
                console.log("No auth detected, forcing redirect to index.");
                window.location.replace("/");
            } else {
                document.documentElement.style.visibility = 'visible';
            }
        }, 2000);
    }
});

document.getElementById('logout-btn')?.addEventListener('click', () => {
    auth.signOut().then(() => window.location.replace("/"));
});

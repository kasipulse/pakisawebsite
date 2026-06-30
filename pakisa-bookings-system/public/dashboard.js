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

// Force the dashboard to be invisible until we know the user is logged in
document.documentElement.style.visibility = 'hidden';

auth.onAuthStateChanged((user) => {
    if (user) {
        // User IS logged in, show the content
        document.getElementById('user-display').innerText = "Logged in as: " + user.email;
        document.documentElement.style.visibility = 'visible';
    } else {
        // User IS NOT logged in, perform the forced redirect
        window.location.replace("/"); 
    }
});

document.getElementById('logout-btn')?.addEventListener('click', () => {
    auth.signOut().then(() => window.location.replace("/"));
});

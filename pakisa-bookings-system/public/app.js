// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlRegs0tOy3YENNf7A12Gnxb_Plvyvi7E",
  authDomain: "pakisa-bookings.firebaseapp.com",
  projectId: "pakisa-bookings",
  storageBucket: "pakisa-bookings.firebasestorage.app",
  messagingSenderId: "65720853256",
  appId: "1:65720853256:web:1f3497edd91a38eb1ac2bd",
  measurementId: "G-13TQ98XXTS"
};

// Initialize Firebase (Compat version)
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

document.addEventListener('DOMContentLoaded', () => {
    const googleLoginBtn = document.getElementById('google-login-btn');
    const emailLoginBtn = document.getElementById('email-login');

   // Change your Google Login button logic to this:
document.getElementById('google-login-btn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    // This avoids the "popup" security blocks entirely
    auth.signInWithRedirect(provider);
});

// Add this to handle the result when the user returns
auth.getRedirectResult()
    .then((result) => {
        if (result.user) {
            console.log("Logged in via redirect:", result.user.email);
            window.location.assign("/dashboard.html");
        }
    })
    .catch((error) => {
        console.error("Redirect Error:", error.message);
    });

    // Email Login Logic
    emailLoginBtn.addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        auth.signInWithEmailAndPassword(email, password)
            .catch((error) => alert("Login Error: " + error.message));
    });
});

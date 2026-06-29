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

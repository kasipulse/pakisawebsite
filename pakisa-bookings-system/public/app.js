document.addEventListener('DOMContentLoaded', () => {
    console.log("App initialized");

    const emailLoginBtn = document.getElementById('email-login');
    const googleLoginBtn = document.getElementById('google-login-btn');

    emailLoginBtn.addEventListener('click', () => {
        alert("Email login logic goes here");
    });

    googleLoginBtn.addEventListener('click', () => {
        alert("Google login logic goes here");
    });
});

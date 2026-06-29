document.addEventListener('DOMContentLoaded', () => {
    console.log("App script loaded successfully");

    const emailLoginBtn = document.getElementById('email-login');
    const googleLoginBtn = document.getElementById('google-login-btn');

    if (!emailLoginBtn || !googleLoginBtn) {
        console.error("CRITICAL: Login buttons not found in the HTML!");
        return;
    }

    emailLoginBtn.addEventListener('click', () => {
        console.log("Email login clicked");
    });

    googleLoginBtn.addEventListener('click', () => {
        console.log("Google login clicked");
    });
});

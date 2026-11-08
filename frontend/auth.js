// ==========================================
// CINEVAULT - AUTHENTICATION
// ==========================================

const API_BASE_URL = "http://localhost:5000/api/auth";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const showRegisterButton = document.getElementById("showRegister");
const showLoginButton = document.getElementById("showLogin");


// ==========================================
// 1. FORM SWITCHING
// ==========================================

function showRegistration() {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    clearMessages();
}

function showLogin() {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    clearMessages();
}

showRegisterButton.addEventListener("click", showRegistration);
showLoginButton.addEventListener("click", showLogin);


// ==========================================
// 2. MESSAGE HANDLING
// ==========================================

function clearMessages() {
    document.querySelectorAll(".form-message").forEach(message => {
        message.textContent = "";
        message.className = "form-message";
    });
}

function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `form-message ${type}`;
}


// ==========================================
// 3. PASSWORD VISIBILITY
// ==========================================

document.querySelectorAll(".toggle-password").forEach(button => {

    button.addEventListener("click", () => {

        const input = document.getElementById(button.dataset.target);

        const visible = input.type === "password";

        input.type = visible ? "text" : "password";
        button.textContent = visible ? "Hide" : "Show";

        button.setAttribute(
            "aria-label",
            visible ? "Hide password" : "Show password"
        );
    });

});


// ==========================================
// 4. REGISTRATION API
// ==========================================

const registerFormElement = document.getElementById("registerFormElement");

const registerButton = document.getElementById("registerButton");

registerFormElement.addEventListener("submit", async event => {

    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    const message = document.getElementById("registerMessage");

    if (password.length < 8) {
        showMessage(message, "Password must contain at least 8 characters.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showMessage(message, "Passwords do not match.", "error");
        return;
    }

    registerButton.disabled = true;
    registerButton.textContent = "Creating Account...";

    try {

        const response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Registration failed.");
        }

        showMessage(
            message,
            "Account created successfully! Please sign in.",
            "success"
        );

        registerFormElement.reset();

        // Move to login after successful registration.
        document.getElementById("loginEmail").value = email;

        setTimeout(() => {
            showLogin();
        }, 1500);

    } catch (error) {

        showMessage(message, error.message, "error");

        console.error("Registration error:", error);

    } finally {

        registerButton.disabled = false;
        registerButton.textContent = "Create Account";

    }

});


// ==========================================
// 5. LOGIN API
// ==========================================

const loginFormElement = document.getElementById("loginFormElement");

const loginButton = document.getElementById("loginButton");

loginFormElement.addEventListener("submit", async event => {

    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const message = document.getElementById("loginMessage");

    loginButton.disabled = true;
    loginButton.textContent = "Signing In...";

    try {

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || "Login failed.");
        }

        // Store JWT for the current browser session.
        sessionStorage.setItem("cinevault-token", data.token);

        // Store basic user information.
        sessionStorage.setItem(
            "cinevault-user",
            JSON.stringify(data.user)
        );

        showMessage(
            message,
            "Login successful! Redirecting...",
            "success"
        );

        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);

    } catch (error) {

        showMessage(message, error.message, "error");

        console.error("Login error:", error);

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Sign In";

    }

});


// ==========================================
// 6. FORGOT PASSWORD
// ==========================================

document.getElementById("forgotPassword").addEventListener("click", event => {

    event.preventDefault();

    alert("Password recovery will be available in a future update.");

});


console.log("CineVault authentication initialized!");

let role = "user";
let isRegister = false;

const userTab = document.getElementById("userTab");
const adminTab = document.getElementById("adminTab");
const heading = document.getElementById("heading");
const nameField = document.getElementById("nameField");
const toggle = document.getElementById("toggle");
const form = document.getElementById("authForm");
const message = document.getElementById("message");

userTab.onclick = () => {
  role = "user";
  isRegister = false;
  updatePage();
};

adminTab.onclick = () => {
  role = "admin";
  isRegister = false;
  updatePage();
};

toggle.onclick = () => {
  if (role === "admin") return;
  isRegister = !isRegister;
  updatePage();
};

function updatePage() {
  userTab.classList.toggle("active", role === "user");
  adminTab.classList.toggle("active", role === "admin");

  nameField.style.display =
    role === "user" && isRegister ? "block" : "none";

  heading.textContent =
    role === "admin" ? "Admin Login" :
    isRegister ? "User Registration" : "User Login";

  document.getElementById("submitBtn").textContent =
    isRegister ? "Register" : "Login";

  toggle.style.display = role === "admin" ? "none" : "block";
  toggle.textContent = isRegister
    ? "Already registered? Login here"
    : "New user? Register here";

  message.textContent = "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "Please wait...";

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const payload = {
    email,
    password,
    role
  };

  let endpoint = "/api/login";

  if (isRegister) {
    payload.name = document.getElementById("name").value;
    endpoint = "/api/register";
    delete payload.role;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    if (isRegister) {
      isRegister = false;
      updatePage();
      message.textContent = "Registration successful! Please login.";
      return;
    }

    window.location.href = "/dashboard";
  } catch (error) {
    message.textContent = error.message;
  }
});

updatePage();

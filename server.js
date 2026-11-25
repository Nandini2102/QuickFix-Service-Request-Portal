
const express = require("express");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");

const app = express();
const PORT = 5000;

const DATA_DIR = path.join(__dirname, "data");
const REQUESTS_FILE = path.join(DATA_DIR, "requests.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || "quickfix-demo-secret-change-this",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 2
  }
}));

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readFile(file) {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, "[]");
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function saveFile(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: "Please login first." });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

// Admin login credentials
const ADMIN_EMAIL = "admin@quickfix.com";
const ADMIN_PASSWORD = "Admin@123";

// Check current login
app.get("/api/me", (req, res) => {
  res.json({ user: req.session.user || null });
});

// User registration
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({
        message: "Enter name, email and password (minimum 6 characters)."
      });
    }

    const users = readFile(USERS_FILE);
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === ADMIN_EMAIL ||
        users.some(u => u.email === normalizedEmail)) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    users.push({
      id: Date.now().toString(),
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user"
    });

    saveFile(USERS_FILE, users);

    res.status(201).json({ message: "Registration successful. Please login." });
  } catch (error) {
    res.status(500).json({ message: "Registration failed." });
  }
});

// Login for both User and Admin
app.post("/api/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (role === "admin") {
      if (normalizedEmail !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ message: "Invalid admin credentials." });
      }

      req.session.user = {
        name: "Administrator",
        email: ADMIN_EMAIL,
        role: "admin"
      };

      return res.json({ message: "Admin login successful.", role: "admin" });
    }

    if (role !== "user") {
      return res.status(400).json({ message: "Select a valid login type." });
    }

    const users = readFile(USERS_FILE);
    const user = users.find(u => u.email === normalizedEmail);

    if (!user || !(await bcrypt.compare(password || "", user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    req.session.user = {
      name: user.name,
      email: user.email,
      role: "user"
    };

    res.json({ message: "Login successful.", role: "user" });
  } catch (error) {
    res.status(500).json({ message: "Login failed." });
  }
});

// Logout
app.post("/api/logout", requireLogin, (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: "Logout failed." });
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out successfully." });
  });
});

// Get requests: admin sees all; user sees own
app.get("/api/requests", requireLogin, (req, res) => {
  let requests = readFile(REQUESTS_FILE);

  if (req.session.user.role === "user") {
    requests = requests.filter(
      r => r.email.toLowerCase() === req.session.user.email
    );
  }

  requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(requests);
});

// Create request: logged-in users only
app.post("/api/requests", requireLogin, (req, res) => {
  if (req.session.user.role !== "user") {
    return res.status(403).json({ message: "Only users can submit requests." });
  }

  const { name, email, phone, category, priority, location, description } = req.body;

  if (![name, email, category, location, description].every(
    v => typeof v === "string" && v.trim()
  )) {
    return res.status(400).json({ message: "Please fill all required fields." });
  }

  if (email.trim().toLowerCase() !== req.session.user.email) {
    return res.status(403).json({ message: "Use your registered email." });
  }

  const request = {
    id: "SR-" + Date.now().toString().slice(-7),
    name: name.trim(),
    email: req.session.user.email,
    phone: (phone || "").trim(),
    category,
    priority: priority || "Normal",
    location: location.trim(),
    description: description.trim(),
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  const requests = readFile(REQUESTS_FILE);
  requests.push(request);
  saveFile(REQUESTS_FILE, requests);

  res.status(201).json(request);
});

// Admin-only status update
app.patch("/api/requests/:id", requireAdmin, (req, res) => {
  const allowed = ["Pending", "In Progress", "Resolved", "Rejected"];
  const { status } = req.body;

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  const requests = readFile(REQUESTS_FILE);
  const index = requests.findIndex(r => r.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Request not found." });
  }

  requests[index].status = status;
  requests[index].updatedAt = new Date().toISOString();
  saveFile(REQUESTS_FILE, requests);

  res.json(requests[index]);
});

// Admin-only delete
app.delete("/api/requests/:id", requireAdmin, (req, res) => {
  const requests = readFile(REQUESTS_FILE);
  const next = requests.filter(r => r.id !== req.params.id);

  if (next.length === requests.length) {
    return res.status(404).json({ message: "Request not found." });
  }

  saveFile(REQUESTS_FILE, next);
  res.json({ message: "Request deleted." });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});
app.get("/dashboard", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`QuickFix running at http://localhost:${PORT}`);
});

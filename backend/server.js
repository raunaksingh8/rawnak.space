const express = require("express");
const app = express();
app.set('trust proxy', 1);
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
// const morgan = require("morgan");
const ratelimit = require("express-rate-limit");

require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`
});

//Rate Limits
const globallimiter = ratelimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({ message: "Too many requests from this IP, Please slow down" });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authlimiter = ratelimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).json({ message: "Too many attempts, try again after 10 minutes" });
  },
  standardHeaders: true,
  legacyHeaders: false,
})

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// app.use(morgan("dev"));
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ist = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.log(`[${ist}] logs - ${req.method} ${req.url} ${res.statusCode} - ${Date.now() - start}ms - IP:${req.ip}`);
  });
  next();
});


app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:3000'
  ]
}));
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/health", (req, res) => {
  console.log("Health Check Ping");
  res.send("Ok");
})

app.post("/api/auth/signup", authlimiter, async (req, res) => {
  console.time("signup");
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    // check if user already exists
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Email already registered" });
    }
    // hash password
    const hashedPassword = await bcrypt.hash(password, 8);
    // save user
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name, email, hashedPassword]
    );
    // create token
    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    console.timeEnd("signup");
    res.json({ token, user: result.rows[0] });
  } catch (err) {
    console.timeEnd("signup");
    console.error(err);
    res.status(500).json({ message: "Signup Failed" })
  }
})

app.post("/api/auth/login", authlimiter, async (req, res) => {
  console.time("login");
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "No credentials entered" });
  }
  try {
    const result = await pool.query("Select * from users where email = $1", [email])
    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid Email id or password" });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalide email id or password" });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    console.timeEnd("login");
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error(err);
    console.timeEnd("login");
    res.status(500).json({ message: "Login Failed" });
  }
})

// ─── JWT Auth Middleware ───
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ─── Since When Endpoints ───

app.get("/api/since-when", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM since_when ORDER BY timestamp ASC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch since_when:", err);
    res.status(500).json({ message: "Failed to fetch events" });
  }
});

// PUT update timestamp for a since_when event (protected)
app.put("/api/since-when/:id", authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { timestamp } = req.body;

  if (!timestamp) {
    return res.status(400).json({ message: "Timestamp is required" });
  }

  try {
    const result = await pool.query(
      "UPDATE since_when SET timestamp = $1 WHERE id = $2 RETURNING *",
      [timestamp, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Failed to update since_when:", err);
    res.status(500).json({ message: "Failed to update event" });
  }
});

// how many today API

app.get("/api/howmanytoday", async (req, res) => {
  try {
    const result = await pool.query(
      "select slug,value,unit FROM  how_many_today order by id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Failed to fetch howmanytoday:", err);
    res.status(500).json({ message: "Failed to fetch stats" })
  }
})


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
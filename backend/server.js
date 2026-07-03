const express = require("express");
const cors = require("cors");

require("dotenv").config({
  path: `.env.${process.env.NODE_ENV || "development"}`
});

const pool = require("./db"); // establishes DB connection
const { globallimiter } = require("./middleware/rateLimiters");

const app = express();
app.set('trust proxy', 1);

// ─── Core Middleware ───
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
app.use(globallimiter);

// ─── Health / Root ───
app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/health", (req, res) => {
  console.log("Health Check Ping - ");
  res.send("Ok");
});

// ─── API Routes ───
// each file receives `app` and registers its own app.get/app.post/app.put routes
require("./api/auth")(app);
require("./api/sinceWhen")(app);
require("./api/howManyToday")(app);
require("./api/specimens")(app);

// ─── Start Server ───
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
const express = require("express");
const app = express();
const cors = require("cors");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors({
  origin: process.env.FRONTEND_URL
}));
app.use(express.json());

app.get("/", (req, resp) => {
  resp.send("Backend is running");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "API is Working" });
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching users");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
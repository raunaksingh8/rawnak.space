const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { authlimiter } = require("../middleware/rateLimiters");

module.exports = (app) => {

    // POST /api/auth/signup
    app.post("/api/auth/signup", authlimiter, async (req, res) => {
        console.time("signup");
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            console.timeEnd("signup");
            return res.status(400).json({ message: "All fields are required" });
        }
        try {
            const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
            if (existing.rows.length > 0) {
                console.timeEnd("signup");
                return res.status(400).json({ message: "Email already registered" });
            }
            const hashedPassword = await bcrypt.hash(password, 8);
            const result = await pool.query(
                "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email",
                [name, email, hashedPassword]
            );
            const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET, { expiresIn: "7d" });
            console.timeEnd("signup");
            res.json({ token, user: result.rows[0] });
        } catch (err) {
            console.timeEnd("signup");
            console.error(err);
            res.status(500).json({ message: "Signup Failed" });
        }
    });

    // POST /api/auth/login
    app.post("/api/auth/login", authlimiter, async (req, res) => {
        console.time("login");
        const { email, password } = req.body;

        if (!email || !password) {
            console.timeEnd("login");
            return res.status(400).json({ message: "No credentials entered" });
        }
        try {
            const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
            if (result.rows.length === 0) {
                console.timeEnd("login");
                return res.status(400).json({ message: "Invalid email id or password" });
            }
            const user = result.rows[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                console.timeEnd("login");
                return res.status(400).json({ message: "Invalid email id or password" });
            }
            const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
            console.timeEnd("login");
            res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
        } catch (err) {
            console.error(err);
            console.timeEnd("login");
            res.status(500).json({ message: "Login Failed" });
        }
    });

};
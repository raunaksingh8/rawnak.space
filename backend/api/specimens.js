const pool = require("../db");

module.exports = (app) => {

    // GET /api/specimens
    app.get("/api/specimens", async (req, res) => {
        try {
            const result = await pool.query("SELECT * FROM specimens ORDER BY id");
            res.json(result.rows);
        } catch (err) {
            console.error("Failed to fetch specimens", err);
            res.status(500).json({ message: "Failed to fetch specimens" });
        }
    });

};
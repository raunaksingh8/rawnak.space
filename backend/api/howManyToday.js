const pool = require("../db");

module.exports = (app) => {

    // GET /api/howmanytoday
    app.get("/api/howmanytoday", async (req, res) => {
        try {
            const result = await pool.query(
                "SELECT slug, value, unit FROM how_many_today ORDER BY id"
            );
            res.json(result.rows);
        } catch (err) {
            console.error("Failed to fetch howmanytoday:", err);
            res.status(500).json({ message: "Failed to fetch stats" });
        }
    });

};
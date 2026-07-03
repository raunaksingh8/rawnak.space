const pool = require("../db");
const authMiddleware = require("../middleware/auth");

module.exports = (app) => {

    // GET /api/since-when
    // app.get("/api/since-when", async (req, res) => {
    //     try {
    //         const result = await pool.query(
    //             "SELECT * FROM since_when ORDER BY timestamp ASC"
    //         );
    //         res.json(result.rows);
    //     } catch (err) {
    //         console.error("Failed to fetch since_when:", err);
    //         res.status(500).json({ message: "Failed to fetch events" });
    //     }
    // });

    app.get("/api/since-when", async (req, res) => {
        try {
            const result = await pool.query(
                "select * from since_when order by id"
            )
            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    status: 404,
                    message: "No data found"
                })
            }
            return res.status(200).json({
                success: true,
                status: 200,
                message: "Data fetched successfully",
                data: result.rows
            })
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                success: false,
                status: 500,
                message: "Internal server error"
            })
        }
    });


    // PUT /api/since-when/:id (protected)
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

};
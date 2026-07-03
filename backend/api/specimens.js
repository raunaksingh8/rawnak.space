const pool = require("../db");

module.exports = (app) => {

    app.get("/api/specimens", async (req, res) => {
        try {
            const result = await pool.query(
                "Select * from specimens  order by id"
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
                message: "Internal server error",
            });
        }
    });



};
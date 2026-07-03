const pool = require("../db");

module.exports = (app) => {

    // get api

    app.get("/api/howmanytoday", async (req, res) => {
        try {
            const result = await pool.query(
                "Select slug,value,unit from how_many_today order by id"
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
            return res.status(500)({
                success: false,
                status: 500,
                message: "Internal server error"
            })
        }
    });

    // post api

    app.post("/api/howmanytoday", async (req, res) => {
        try {
            const { slug, value, unit } = req.body;

            if (!slug || !value || !unit) {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: "All Fields are required"
                })
            }
            const result = await pool.query(
                "Insert into how_many_today (slug,value,unit) values ($1,$2,$3) returning *",
                [slug, value, unit]
            )
            return res.status(201).json({
                success: true,
                status: 201,
                message: "Data inserted successfully",
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



};
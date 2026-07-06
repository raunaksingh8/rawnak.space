module.exports = (app) => {

    app.post("/api/track", (req, res) => {
        try {
            const { page } = req.body;
            const ist = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
            console.log(`[${ist}] Page view - ${page || "unknown"} - IP:${req.ip}`)
            res.json({
                success: true,
                status: 200,
                message: "Page tracked",
            })
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                success: false,
                status: 500,
                message: "Internal server error"
            });
        }
    });
}
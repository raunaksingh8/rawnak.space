const { Pool } = require("pg");

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

(async () => {
    try {
        const client = await pool.connect();
        console.log("Database connected successfully");
        client.release();
    } catch (err) {
        console.error("Database connection failed:", err);
    }
})();

module.exports = pool;
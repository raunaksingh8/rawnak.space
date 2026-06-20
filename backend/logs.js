process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const https = require("https");

const API_KEY = process.env.RENDER_API_KEY;
const SERVICE_ID = process.env.RENDER_SERVICE_ID;
const OWNER_ID = process.env.RENDER_OWNER_ID;

if (!API_KEY || !SERVICE_ID || !OWNER_ID) {
    console.error("Usage: RENDER_API_KEY=xxx RENDER_SERVICE_ID=srv-xxx RENDER_OWNER_ID=tea-xxx node logs.js");
    process.exit(1);
}

let lastTimestamp = new Date(Date.now() - 30000).toISOString();

function stripAnsi(str) {
    return str.replace(/\u001b\[[0-9;]*m/g, "").trim();
}

function fetchLogs() {
    const params = new URLSearchParams({
        resource: SERVICE_ID,
        ownerId: OWNER_ID,
        start: lastTimestamp,
    });

    const options = {
        hostname: "api.render.com",
        path: `/v1/logs?${params.toString()}`,
        method: "GET",
        headers: { Authorization: `Bearer ${API_KEY}` },
        rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
            try {
                const json = JSON.parse(data);
                if (json.logs && json.logs.length > 0) {
                    json.logs.forEach((log) => {
                        const msg = stripAnsi(log.message);
                        if (!msg) return;
                        const time = new Date(log.timestamp).toLocaleString("en-IN", {
                            timeZone: "Asia/Kolkata",
                        });
                        console.log(`[${time}] ${msg}`);
                    });
                    lastTimestamp = json.logs[json.logs.length - 1].timestamp;
                }
            } catch (err) {
                console.error("Parse error:", err.message);
            }
        });
    });

    req.on("error", (err) => console.error("Request error:", err.message));
    req.end();
}

console.log("🚀 Streaming Render production logs (Ctrl+C to stop)...\n");
fetchLogs();
setInterval(fetchLogs, 3000);


//rnd_4UErS6k7xgXdPKyr9TdRISb5YVTl
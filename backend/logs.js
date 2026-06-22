process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const https = require("https");

const API_KEY = (process.env.RENDER_API_KEY || "").trim();
const SERVICE_ID = (process.env.RENDER_SERVICE_ID || "").trim();
const OWNER_ID = (process.env.RENDER_OWNER_ID || "").trim();

if (!API_KEY || !SERVICE_ID || !OWNER_ID) {
    console.error("Usage: RENDER_API_KEY=xxx RENDER_SERVICE_ID=srv-xxx RENDER_OWNER_ID=tea-xxx node logs.js");
    process.exit(1);
}

let lastTimestamp = new Date(Date.now() - 60000).toISOString();
let pollInterval = 5000; // 5 seconds default
const DEFAULT_INTERVAL = 5000;
const BACKOFF_INTERVAL = 30000; // 30 seconds on rate limit

function stripAnsi(str) {
    return str.replace(/\u001b\[[0-9;]*m/g, "").trim();
}

function fetchLogs() {
    const url = new URL("https://api.render.com/v1/logs");
    url.searchParams.set("ownerId", OWNER_ID);
    url.searchParams.set("resource", SERVICE_ID);
    url.searchParams.set("startTime", lastTimestamp);
    url.searchParams.set("direction", "forward");
    url.searchParams.set("limit", "100");

    const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: "GET",
        headers: { Authorization: `Bearer ${API_KEY}` },
    };

    const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
            if (res.statusCode === 429) {
                console.error("⏳ Rate limited, backing off 30s...");
                pollInterval = BACKOFF_INTERVAL;
                scheduleNext();
                return;
            }
            if (res.statusCode !== 200) {
                console.error(`API error: ${res.statusCode} - ${data}`);
                scheduleNext();
                return;
            }

            // Reset to normal interval after a successful request
            pollInterval = DEFAULT_INTERVAL;

            try {
                const json = JSON.parse(data);
                if (json.logs && json.logs.length > 0) {
                    json.logs.forEach((log) => {
                        const msg = stripAnsi(log.message);
                        if (!msg) return;
                        console.log(msg);
                    });
                }
                if (json.nextStartTime) {
                    lastTimestamp = json.nextStartTime;
                }
            } catch (err) {
                console.error("Parse error:", err.message);
            }
            scheduleNext();
        });
    });

    req.on("error", (err) => {
        console.error("Request error:", err.message);
        scheduleNext();
    });
    req.end();
}

function scheduleNext() {
    setTimeout(fetchLogs, pollInterval);
}

console.log("Streaming Live production logs...\n");

// Wait 5s before first fetch to let any rate limit cool down
setTimeout(fetchLogs, 5000);
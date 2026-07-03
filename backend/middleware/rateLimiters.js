const ratelimit = require("express-rate-limit");

const globallimiter = ratelimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    handler: (req, res) => {
        res.status(429).json({ message: "Too many requests from this IP, Please slow down" });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const authlimiter = ratelimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    handler: (req, res) => {
        res.status(429).json({ message: "Too many attempts, try again after 10 minutes" });
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { globallimiter, authlimiter };
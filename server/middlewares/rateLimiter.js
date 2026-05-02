const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { error: 'Too many requests from this IP, please try again after 10 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { apiLimiter };

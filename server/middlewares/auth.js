const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Not authorized, no token' });
    }
    try {
        const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Token invalid or expired' });
    }
};

module.exports = { protect };

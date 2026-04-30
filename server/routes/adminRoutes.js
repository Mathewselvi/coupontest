const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { protect } = require('../middlewares/auth');
const { getStats } = require('../controllers/adminController');

router.post('/login', (req, res) => {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (password === process.env.ADMIN_PASSWORD) {
        const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.status(200).json({ success: true, token });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

router.get('/stats', protect, getStats);

module.exports = router;

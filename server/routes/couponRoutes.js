const express = require('express');
const router = express.Router();
const { validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon, getAvailableCoupons } = require('../controllers/couponController');
const { protect } = require('../middlewares/auth');

router.post('/validate', validateCoupon);
router.get('/available', getAvailableCoupons);
router.get('/', protect, getAllCoupons);
router.post('/', protect, createCoupon);
router.put('/:id', protect, updateCoupon);
router.delete('/:id', protect, deleteCoupon);

module.exports = router;

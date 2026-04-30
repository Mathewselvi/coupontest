const Coupon = require('../models/Coupon');
const Lead = require('../models/Lead');
const Joi = require('joi');

const validateCouponSchema = Joi.object({
    couponCode: Joi.string().required(),
    budget: Joi.number().required(),
    requirementType: Joi.string().valid('Service', 'Product', 'Consultation').required(),
    email: Joi.string().email().required()
});

const validateCoupon = async (req, res) => {
    try {
        const { error } = validateCouponSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { couponCode, budget, requirementType, email } = req.body;

        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
        if (!coupon) return res.status(400).json({ error: 'Invalid or inactive coupon code' });
        if (new Date() > new Date(coupon.expiryDate)) return res.status(400).json({ error: 'This coupon has expired' });
        if (budget < coupon.minOrderValue) return res.status(400).json({ error: `Minimum budget required for this coupon is ₹${coupon.minOrderValue}` });
        if (!coupon.applicableTo.includes('All') && !coupon.applicableTo.includes(requirementType)) {
            return res.status(400).json({ error: `This coupon is not applicable for ${requirementType}` });
        }
        if (coupon.currentUses >= coupon.maxUses) return res.status(400).json({ error: 'Coupon usage limit has been exceeded' });
        if (coupon.isFirstTimeOnly) {
            const prev = await Lead.findOne({ email: email.toLowerCase() });
            if (prev) return res.status(400).json({ error: 'This coupon is only valid for first-time users' });
        }

        let discountAmount = coupon.discountType === 'percentage'
            ? (budget * coupon.discountValue) / 100
            : coupon.discountValue;
        if (discountAmount > budget) discountAmount = budget;

        return res.status(200).json({
            message: 'Coupon applied successfully',
            discountAmount,
            finalPrice: budget - discountAmount,
            couponId: coupon._id
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json(coupons);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const createCouponSchema = Joi.object({
    code: Joi.string().required(),
    discountType: Joi.string().valid('percentage', 'flat').required(),
    discountValue: Joi.number().min(0).required(),
    minOrderValue: Joi.number().min(0).default(0),
    applicableTo: Joi.array().items(Joi.string()).default(['All']),
    maxUses: Joi.number().min(1).default(100),
    expiryDate: Joi.date().required(),
    isFirstTimeOnly: Joi.boolean().default(false),
    isActive: Joi.boolean().default(true)
});

const createCoupon = async (req, res) => {
    try {
        const { error, value } = createCouponSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const code = value.code.toUpperCase().trim();
        const existing = await Coupon.findOne({ code });
        if (existing) return res.status(400).json({ error: 'Coupon code already exists' });

        const coupon = new Coupon({ ...value, code });
        await coupon.save();
        res.status(201).json(coupon);
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateCouponSchema = Joi.object({
    discountType: Joi.string().valid('percentage', 'flat'),
    discountValue: Joi.number().min(0),
    minOrderValue: Joi.number().min(0),
    applicableTo: Joi.array().items(Joi.string()),
    maxUses: Joi.number().min(1),
    expiryDate: Joi.date(),
    isFirstTimeOnly: Joi.boolean(),
    isActive: Joi.boolean()
});

const updateCoupon = async (req, res) => {
    try {
        const { error, value } = updateCouponSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const coupon = await Coupon.findByIdAndUpdate(req.params.id, value, { new: true, runValidators: true });
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
        res.status(200).json(coupon);
    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
        res.status(200).json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getAvailableCoupons = async (req, res) => {
    try {
        const { email, requirementType, budget } = req.query;
        const budgetNum = Number(budget) || 0;
        const now = new Date();

        const query = {
            isActive: true,
            expiryDate: { $gt: now },
            $expr: { $lt: ['$currentUses', '$maxUses'] },
        };

        // Filter by budget minimum if provided
        if (budgetNum > 0) {
            query.minOrderValue = { $lte: budgetNum };
        }

        // Filter by requirementType if provided
        if (requirementType) {
            query.$or = [
                { applicableTo: 'All' },
                { applicableTo: requirementType }
            ];
        }

        let coupons = await Coupon.find(query)
            .select('code discountType discountValue minOrderValue applicableTo isFirstTimeOnly maxUses currentUses')
            .sort({ discountValue: -1 });

        // For first-time-only coupons: exclude if email already exists in leads
        if (email) {
            const emailLower = email.toLowerCase().trim();
            const isReturningUser = await Lead.exists({ email: emailLower });
            if (isReturningUser) {
                coupons = coupons.filter(c => !c.isFirstTimeOnly);
            }
        }

        res.status(200).json(coupons);
    } catch (error) {
        console.error('Get available coupons error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon, getAvailableCoupons };

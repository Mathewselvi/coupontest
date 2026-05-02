const Lead = require('../models/Lead');
const Coupon = require('../models/Coupon');
const Joi = require('joi');

const submitLeadSchema = Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({ 'string.pattern.base': 'Phone number must be exactly 10 digits' }),
    email: Joi.string().email().required(),
    city: Joi.string().required(),
    requirementType: Joi.string().valid('Service', 'Product', 'Consultation').required(),
    budget: Joi.number().min(1).required(),
    message: Joi.string().allow('', null).optional(),
    couponCode: Joi.string().allow('', null).optional()
});

const submitLead = async (req, res) => {
    try {
        const { error } = submitLeadSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { name, phone, email, city, requirementType, budget, message, couponCode } = req.body;

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const recentLead = await Lead.findOne({
            $or: [{ email: email.toLowerCase() }, { phone }],
            createdAt: { $gte: tenMinutesAgo }
        });
        if (recentLead) {
            return res.status(429).json({ error: 'You have already submitted a request recently. Please wait before trying again.' });
        }

        let couponAppliedId = null;
        let discountAmount = 0;
        let finalPrice = budget;

        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
            if (!coupon) return res.status(400).json({ error: 'Invalid or inactive coupon code' });
            if (new Date() > new Date(coupon.expiryDate)) return res.status(400).json({ error: 'This coupon has expired' });
            if (budget < coupon.minOrderValue) return res.status(400).json({ error: `Minimum budget required is ₹${coupon.minOrderValue}` });
            if (!coupon.applicableTo.includes('All') && !coupon.applicableTo.includes(requirementType)) {
                return res.status(400).json({ error: `Not applicable for ${requirementType}` });
            }
            if (coupon.currentUses >= coupon.maxUses) return res.status(400).json({ error: 'Coupon usage limit exceeded' });
            if (coupon.isFirstTimeOnly) {
                const prev = await Lead.findOne({ email: email.toLowerCase() });
                if (prev) return res.status(400).json({ error: 'Only valid for first-time users' });
            }

            discountAmount = coupon.discountType === 'percentage'
                ? (budget * coupon.discountValue) / 100
                : coupon.discountValue;
            if (discountAmount > budget) discountAmount = budget;
            finalPrice = budget - discountAmount;
            couponAppliedId = coupon._id;
            coupon.currentUses += 1;
            await coupon.save();
        }

        const lead = new Lead({ name, phone, email, city, requirementType, budget, message, couponApplied: couponAppliedId, discountAmount, finalPrice });
        await lead.save();

        res.status(201).json({ message: 'Lead submitted successfully', lead: { id: lead._id, name: lead.name, finalPrice: lead.finalPrice } });
    } catch (error) {
        console.error('Submit lead error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getLeads = async (req, res) => {
    try {
        const { page = 1, limit = 10, couponId, requirementType, search, startDate, endDate } = req.query;

        const query = {};

        if (couponId === 'none') query.couponApplied = null;
        else if (couponId) query.couponApplied = couponId;

        if (requirementType) query.requirementType = requirementType;

        if (search) {
            const rx = { $regex: search.trim(), $options: 'i' };
            query.$or = [{ email: rx }, { phone: rx }, { name: rx }];
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const pageNum = Math.max(1, Number(page));
        const limitNum = Math.min(50, Math.max(1, Number(limit)));
        const skip = (pageNum - 1) * limitNum;

        const [total, leads] = await Promise.all([
            Lead.countDocuments(query),
            Lead.find(query)
                .populate('couponApplied', 'code discountType discountValue')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
        ]);

        res.status(200).json({ leads, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const getLeadById = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id)
            .populate('couponApplied', 'code discountType discountValue');
        if (!lead) return res.status(404).json({ error: 'Lead not found' });
        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findById(req.params.id);
        if (!lead) return res.status(404).json({ error: 'Lead not found' });

        if (lead.couponApplied && lead.discountAmount > 0) {
            await Coupon.findByIdAndUpdate(lead.couponApplied, { $inc: { currentUses: -1 } });
        }

        await lead.deleteOne();
        res.status(200).json({ message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const exportLeads = async (req, res) => {
    try {
        const { couponId, requirementType, search, startDate, endDate } = req.query;

        const query = {};

        if (couponId === 'none') query.couponApplied = null;
        else if (couponId) query.couponApplied = couponId;

        if (requirementType) query.requirementType = requirementType;

        if (search) {
            const rx = { $regex: search.trim(), $options: 'i' };
            query.$or = [{ email: rx }, { phone: rx }, { name: rx }];
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        const leads = await Lead.find(query)
            .populate('couponApplied', 'code discountType discountValue')
            .sort({ createdAt: -1 });

        res.status(200).json({ leads, total: leads.length });
    } catch (error) {
        console.error('Export leads error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { submitLead, getLeads, getLeadById, deleteLead, exportLeads };

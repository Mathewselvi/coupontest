const Lead = require('../models/Lead');

const getStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalLeads, todayLeads, discountAgg, couponUsage] = await Promise.all([
            Lead.countDocuments(),
            Lead.countDocuments({ createdAt: { $gte: today } }),
            Lead.aggregate([{ $group: { _id: null, total: { $sum: '$discountAmount' } } }]),
            Lead.aggregate([
                { $match: { couponApplied: { $ne: null } } },
                { $group: { _id: '$couponApplied', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 },
                { $lookup: { from: 'coupons', localField: '_id', foreignField: '_id', as: 'coupon' } },
                { $unwind: '$coupon' }
            ])
        ]);

        res.status(200).json({
            totalLeads,
            todayLeads,
            totalDiscount: discountAgg[0]?.total || 0,
            mostUsedCoupon: couponUsage[0]
                ? { code: couponUsage[0].coupon.code, count: couponUsage[0].count }
                : null
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getStats };

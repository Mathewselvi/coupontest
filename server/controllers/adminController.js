const Lead = require('../models/Lead');
const Coupon = require('../models/Coupon');

const getLeadsChart = async (_req, res) => {
    try {
        const days = 7;
        const result = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setUTCDate(d.getUTCDate() - i);
            const dateStr = d.toISOString().split('T')[0];

            const startOfDay = new Date(dateStr);
            const endOfDay = new Date(dateStr);
            endOfDay.setUTCHours(23, 59, 59, 999);
            
            const count = await Lead.countDocuments({
                createdAt: { $gte: startOfDay, $lte: endOfDay }
            });
            
            result.push({
                date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                leads: count,
                fullDate: dateStr
            });
        }

        res.json(result);
    } catch (error) {
        console.error('Chart error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


const getStats = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastWeek = new Date();
        lastWeek.setDate(lastWeek.getDate() - 7);

        const [
            totalLeads, 
            todayLeads, 
            lastWeekLeads,
            totalDiscountRes, 
            totalBudgetRes,
            typeDistribution,
            topCouponsRaw,
            couponStatus
        ] = await Promise.all([
            Lead.countDocuments(),
            Lead.countDocuments({ createdAt: { $gte: today } }),
            Lead.countDocuments({ createdAt: { $gte: lastWeek } }),
            Lead.aggregate([{ $group: { _id: null, total: { $sum: '$discountAmount' } } }]),
            Lead.aggregate([{ $group: { _id: null, total: { $sum: '$budget' } } }]),
            Lead.aggregate([
                { $group: { _id: '$requirementType', count: { $sum: 1 } } }
            ]),
            Lead.aggregate([
                { $match: { couponApplied: { $ne: null } } },
                { $group: { _id: '$couponApplied', count: { $sum: 1 }, totalDiscount: { $sum: '$discountAmount' } } },
                { $sort: { count: -1 } },
                { $limit: 4 },
                { $lookup: { from: 'coupons', localField: '_id', foreignField: '_id', as: 'coupon' } },
                { $unwind: { path: '$coupon', preserveNullAndEmptyArrays: true } }
            ]),
            Promise.all([
                Coupon.countDocuments({ isActive: true }),
                Coupon.countDocuments({ expiryDate: { $lt: new Date() } }),
                Coupon.countDocuments()
            ])
        ]);

        res.status(200).json({
            totalLeads,
            todayLeads,
            lastWeekLeads,
            totalDiscount: totalDiscountRes[0]?.total || 0,
            totalBudget: totalBudgetRes[0]?.total || 0,
            typeDistribution: typeDistribution.map(t => ({ name: t._id || 'Unknown', value: t.count })),
            topCoupons: topCouponsRaw
                .filter(c => c.coupon)
                .map(c => ({
                    code: c.coupon.code,
                    count: c.count,
                    totalDiscount: c.totalDiscount
                })),
            couponMetrics: {
                active: couponStatus[0],
                expired: couponStatus[1],
                total: couponStatus[2]
            }
        });
    } catch (error) {
        console.error('Stats aggregation error:', error);
        res.status(500).json({ error: 'Failed to aggregate dashboard stats. ' + error.message });
    }
};

module.exports = { getStats, getLeadsChart };


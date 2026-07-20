"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WalletService_1 = require("./WalletService");
const OrderEconomicsService_1 = require("./OrderEconomicsService");
const PaymentService_1 = require("./PaymentService");
const CashReconciliationService_1 = require("./CashReconciliationService");
const PayoutService_1 = require("./PayoutService");
const supabase_js_1 = require("@supabase/supabase-js");
const router = (0, express_1.Router)();
const walletService = new WalletService_1.WalletService();
const orderEconomicsService = new OrderEconomicsService_1.OrderEconomicsService();
const paymentService = new PaymentService_1.PaymentService();
const cashReconciliationService = new CashReconciliationService_1.CashReconciliationService();
const payoutService = new PayoutService_1.PayoutService();
// Simple in-memory rate limiter
const rateLimitMap = new Map();
const rateLimit = (maxRequests, windowMs) => {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const now = Date.now();
        const windowStart = now - windowMs;
        const record = rateLimitMap.get(ip);
        if (!record || record.resetTime < now) {
            rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
            next();
            return;
        }
        if (record.count >= maxRequests) {
            return res.status(429).json({ error: 'Too many requests, please try again later' });
        }
        record.count++;
        next();
    };
};
// Clean up expired rate limit entries every minute
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (record.resetTime < now) {
            rateLimitMap.delete(ip);
        }
    }
}, 60000);
// Authentication middleware
const authenticateUser = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    const userType = req.headers['x-user-type'];
    if (!userId || !userType) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    if (!isValidUUID(userId)) {
        return res.status(401).json({ error: 'Invalid user ID' });
    }
    if (!isValidUserType(userType)) {
        return res.status(401).json({ error: 'Invalid user type' });
    }
    // Attach user info to request
    req.userId = userId;
    req.userType = userType;
    next();
};
// Audit logging function (console-based for now, could be extended to database)
const logAuditEvent = async (action, userId, userType, details) => {
    const timestamp = new Date().toISOString();
    console.log(`[AUDIT] ${timestamp} | ${action} | User: ${userId} (${userType}) | Details: ${JSON.stringify(details)}`);
};
// Helper function to get supabase client
const getSupabaseClient = () => {
    return (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
};
// Helper function to get UUID parameter
const getParam = (param) => {
    if (Array.isArray(param))
        return param[0];
    return param;
};
// Validation helper functions
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
const isValidUserType = (userType) => {
    return ['driver', 'vendor', 'platform', 'admin'].includes(userType);
};
const isValidTransactionType = (type) => {
    return ['earning', 'deduction', 'payout', 'deposit', 'refund', 'debt', 'credit', 'adjustment', 'withhold', 'release'].includes(type);
};
const isValidAmount = (amount) => {
    return typeof amount === 'number' && !isNaN(amount) && amount >= 0 && amount <= 1000000;
};
const sanitizeString = (str) => {
    return str.trim().replace(/[<>]/g, '');
};
// WALLET ROUTES
// Get wallet balance
router.get('/wallet/:userId/:userType', async (req, res) => {
    try {
        const userId = getParam(req.params.userId);
        const userType = getParam(req.params.userType);
        // Validate inputs
        if (!isValidUUID(userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }
        if (!isValidUserType(userType)) {
            return res.status(400).json({ error: 'Invalid user type' });
        }
        const wallet = await walletService.getOrCreateWallet(userId, userType);
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        const balance = await walletService.getWalletBalance(wallet.id);
        res.json({ wallet, balance });
    }
    catch (error) {
        console.error('Error getting wallet:', error);
        res.status(500).json({ error: 'Failed to get wallet' });
    }
});
// Get transaction history
router.get('/wallet/:walletId/transactions', async (req, res) => {
    try {
        const walletId = getParam(req.params.walletId);
        const limit = parseInt(req.query.limit) || 50;
        // Validate inputs
        if (!isValidUUID(walletId)) {
            return res.status(400).json({ error: 'Invalid wallet ID format' });
        }
        if (limit < 1 || limit > 500) {
            return res.status(400).json({ error: 'Limit must be between 1 and 500' });
        }
        const transactions = await walletService.getTransactionHistory(walletId, limit);
        res.json(transactions);
    }
    catch (error) {
        console.error('Error getting transaction history:', error);
        res.status(500).json({ error: 'Failed to get transaction history' });
    }
});
// ORDER ECONOMICS ROUTES
// Get platform configuration
router.get('/config/platform', async (req, res) => {
    try {
        const config = await orderEconomicsService.getPlatformConfig();
        res.json(config);
    }
    catch (error) {
        console.error('Error getting platform config:', error);
        res.status(500).json({ error: 'Failed to get platform config' });
    }
});
// Update platform configuration (rate limited, authenticated)
router.put('/config/platform/:key', rateLimit(10, 60000), authenticateUser, async (req, res) => {
    try {
        const key = getParam(req.params.key);
        const { value } = req.body;
        // Validate inputs
        if (!key || typeof key !== 'string') {
            return res.status(400).json({ error: 'Invalid configuration key' });
        }
        // Validate value based on key
        const validKeys = ['vendor_commission_rate', 'driver_delivery_rate', 'service_fee', 'min_payout_amount', 'payout_day'];
        if (!validKeys.includes(key)) {
            return res.status(400).json({ error: 'Invalid configuration key' });
        }
        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            return res.status(400).json({ error: 'Invalid configuration value' });
        }
        // Validate ranges
        if (key === 'vendor_commission_rate' || key === 'driver_delivery_rate') {
            if (numValue < 0 || numValue > 100) {
                return res.status(400).json({ error: 'Percentage must be between 0 and 100' });
            }
        }
        if (key === 'service_fee' || key === 'min_payout_amount') {
            if (numValue < 0 || numValue > 100000) {
                return res.status(400).json({ error: 'Amount must be between 0 and 100000' });
            }
        }
        if (key === 'payout_day') {
            if (numValue < 1 || numValue > 7) {
                return res.status(400).json({ error: 'Payout day must be between 1 and 7' });
            }
        }
        const success = await orderEconomicsService.updatePlatformConfig(key, value);
        if (!success) {
            return res.status(400).json({ error: 'Failed to update config' });
        }
        // Log audit event
        await logAuditEvent('CONFIG_UPDATE', req.userId || 'unknown', req.userType || 'unknown', { key, value });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error updating platform config:', error);
        res.status(500).json({ error: 'Failed to update platform config' });
    }
});
// Calculate order economics
router.post('/economics/calculate', async (req, res) => {
    try {
        const { foodAmount, deliveryFee } = req.body;
        const economics = await orderEconomicsService.calculateOrderEconomics(foodAmount, deliveryFee);
        res.json(economics);
    }
    catch (error) {
        console.error('Error calculating order economics:', error);
        res.status(500).json({ error: 'Failed to calculate order economics' });
    }
});
// PAYMENT ROUTES
// Initialize payment
router.post('/payment/initialize', async (req, res) => {
    try {
        const { orderId, paymentMethod, amount } = req.body;
        const paymentIntent = await paymentService.initializePayment(orderId, paymentMethod, amount);
        if (!paymentIntent) {
            return res.status(400).json({ error: 'Failed to initialize payment' });
        }
        res.json(paymentIntent);
    }
    catch (error) {
        console.error('Error initializing payment:', error);
        res.status(500).json({ error: 'Failed to initialize payment' });
    }
});
// Process online payment
router.post('/payment/online', async (req, res) => {
    try {
        const { orderId, paymentDetails } = req.body;
        const success = await paymentService.processOnlinePayment(orderId, paymentDetails);
        if (!success) {
            return res.status(400).json({ error: 'Failed to process payment' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error processing online payment:', error);
        res.status(500).json({ error: 'Failed to process payment' });
    }
});
// Record cash collection
router.post('/payment/cash', async (req, res) => {
    try {
        const { orderId, driverId, cashCollected } = req.body;
        const success = await paymentService.recordCashCollection(orderId, driverId, cashCollected);
        if (!success) {
            return res.status(400).json({ error: 'Failed to record cash collection' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error recording cash collection:', error);
        res.status(500).json({ error: 'Failed to record cash collection' });
    }
});
// Process refund
router.post('/payment/refund', async (req, res) => {
    try {
        const { orderId, refundAmount, reason } = req.body;
        const success = await paymentService.processRefund(orderId, refundAmount, reason);
        if (!success) {
            return res.status(400).json({ error: 'Failed to process refund' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({ error: 'Failed to process refund' });
    }
});
// Handle order cancellation
router.post('/payment/cancel', async (req, res) => {
    try {
        const { orderId, cancellationReason } = req.body;
        const success = await paymentService.handleOrderCancellation(orderId, cancellationReason);
        if (!success) {
            return res.status(400).json({ error: 'Failed to handle cancellation' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error handling cancellation:', error);
        res.status(500).json({ error: 'Failed to handle cancellation' });
    }
});
// CASH RECONCILIATION ROUTES
// Get debt summary (must come before :driverId route)
router.get('/cash/debts/summary', async (req, res) => {
    try {
        const summary = await cashReconciliationService.getDebtSummary();
        res.json(summary);
    }
    catch (error) {
        console.error('Error getting debt summary:', error);
        res.status(500).json({ error: 'Failed to get debt summary' });
    }
});
// Get driver debts
router.get('/cash/debts/:driverId', async (req, res) => {
    try {
        const driverId = getParam(req.params.driverId);
        const debts = await cashReconciliationService.getDriverDebts(driverId);
        res.json(debts);
    }
    catch (error) {
        console.error('Error getting driver debts:', error);
        res.status(500).json({ error: 'Failed to get driver debts' });
    }
});
// Write off debt (rate limited, authenticated)
router.post('/cash/debts/:debtId/writeoff', rateLimit(10, 60000), authenticateUser, async (req, res) => {
    try {
        const debtId = getParam(req.params.debtId);
        const { reason } = req.body;
        const success = await cashReconciliationService.writeOffDebt(debtId, reason);
        if (!success) {
            return res.status(400).json({ error: 'Failed to write off debt' });
        }
        // Log audit event
        await logAuditEvent('DEBT_WRITEOFF', req.userId || 'unknown', req.userType || 'unknown', { debtId, reason });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error writing off debt:', error);
        res.status(500).json({ error: 'Failed to write off debt' });
    }
});
// PAYOUT ROUTES
// Generate payout batch
router.post('/payouts/batch', async (req, res) => {
    try {
        const { startDate, endDate } = req.body;
        const batch = await payoutService.generatePayoutBatch(new Date(startDate), new Date(endDate));
        if (!batch) {
            return res.status(400).json({ error: 'Failed to generate payout batch' });
        }
        res.json(batch);
    }
    catch (error) {
        console.error('Error generating payout batch:', error);
        res.status(500).json({ error: 'Failed to generate payout batch' });
    }
});
// Get payout batch
router.get('/payouts/batch/:batchId', async (req, res) => {
    try {
        const batchId = getParam(req.params.batchId);
        const batch = await payoutService.getPayoutBatch(batchId);
        if (!batch) {
            return res.status(404).json({ error: 'Payout batch not found' });
        }
        res.json(batch);
    }
    catch (error) {
        console.error('Error getting payout batch:', error);
        res.status(500).json({ error: 'Failed to get payout batch' });
    }
});
// Get payouts for batch
router.get('/payouts/batch/:batchId/payouts', async (req, res) => {
    try {
        const batchId = getParam(req.params.batchId);
        const payouts = await payoutService.getPayoutsForBatch(batchId);
        res.json(payouts);
    }
    catch (error) {
        console.error('Error getting payouts:', error);
        res.status(500).json({ error: 'Failed to get payouts' });
    }
});
// Approve payout (rate limited, authenticated)
router.put('/payouts/:payoutId/approve', rateLimit(20, 60000), authenticateUser, async (req, res) => {
    try {
        const payoutId = getParam(req.params.payoutId);
        const { approvedBy } = req.body;
        // Validate inputs
        if (!isValidUUID(payoutId)) {
            return res.status(400).json({ error: 'Invalid payout ID format' });
        }
        if (!approvedBy || typeof approvedBy !== 'string') {
            return res.status(400).json({ error: 'Approved by is required' });
        }
        const success = await payoutService.approvePayout(payoutId, approvedBy);
        if (!success) {
            return res.status(400).json({ error: 'Failed to approve payout' });
        }
        // Log audit event
        await logAuditEvent('PAYOUT_APPROVE', req.userId || 'unknown', req.userType || 'unknown', { payoutId, approvedBy });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error approving payout:', error);
        res.status(500).json({ error: 'Failed to approve payout' });
    }
});
// Reject payout (rate limited, authenticated)
router.put('/payouts/:payoutId/reject', rateLimit(20, 60000), authenticateUser, async (req, res) => {
    try {
        const payoutId = getParam(req.params.payoutId);
        const { reason } = req.body;
        // Validate inputs
        if (!isValidUUID(payoutId)) {
            return res.status(400).json({ error: 'Invalid payout ID format' });
        }
        if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
            return res.status(400).json({ error: 'Rejection reason is required' });
        }
        const success = await payoutService.rejectPayout(payoutId, reason);
        if (!success) {
            return res.status(400).json({ error: 'Failed to reject payout' });
        }
        // Log audit event
        await logAuditEvent('PAYOUT_REJECT', req.userId || 'unknown', req.userType || 'unknown', { payoutId, reason });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error rejecting payout:', error);
        res.status(500).json({ error: 'Failed to reject payout' });
    }
});
// Request payout (rate limited)
router.post('/payouts/request', rateLimit(5, 60000), async (req, res) => {
    try {
        const { userId, userType, amount, payoutMethod, bankAccountDetails } = req.body;
        if (!userId || !userType) {
            return res.status(400).json({ error: 'userId and userType are required' });
        }
        if (userType !== 'vendor' && userType !== 'driver') {
            return res.status(400).json({ error: 'Invalid user type' });
        }
        // Get or create wallet
        const wallet = await walletService.getOrCreateWallet(userId, userType);
        if (!wallet || !wallet.id) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        // Get wallet balance
        const walletData = await walletService.getWalletBalance(wallet.id);
        if (!walletData) {
            return res.status(404).json({ error: 'Wallet balance not found' });
        }
        // Get minimum payout amount from config
        const config = await orderEconomicsService.getPlatformConfig();
        const minPayoutAmount = config.min_payout_amount || 100;
        // Determine payout amount (use custom amount if provided, otherwise use full available balance)
        const payoutAmount = amount && amount > 0 ? amount : walletData.available;
        // Check if payout amount meets minimum payout
        if (payoutAmount < minPayoutAmount) {
            return res.status(400).json({ error: `Payout amount must be at least R${minPayoutAmount}` });
        }
        // Check if payout amount doesn't exceed available balance
        if (payoutAmount > walletData.available) {
            return res.status(400).json({ error: `Payout amount cannot exceed available balance of R${walletData.available.toFixed(2)}` });
        }
        // Check if there's already a pending payout for this user
        const supabase = getSupabaseClient();
        const { data: existingPayouts } = await supabase
            .from('payouts')
            .select('*')
            .eq('user_id', userId)
            .eq('user_type', userType)
            .in('status', ['pending', 'approved'])
            .maybeSingle();
        if (existingPayouts) {
            return res.status(400).json({ error: 'You already have a pending or approved payout' });
        }
        // Validate bank account details
        if (!bankAccountDetails) {
            return res.status(400).json({ error: 'Bank account details are required' });
        }
        // Create a payout request (this will be added to the next batch by admin)
        // For now, we'll create a pending payout that can be added to a batch
        const { data: payout, error } = await supabase
            .from('payouts')
            .insert({
            batch_id: null, // Will be assigned when batch is created
            user_id: userId,
            user_type: userType,
            gross_amount: payoutAmount,
            debt_deductions: 0,
            credit_additions: 0,
            net_amount: payoutAmount,
            status: 'pending',
            bank_account_details: bankAccountDetails,
            transaction_reference: null,
            notes: amount && amount > 0 ? `Requested by user - Custom amount: R${payoutAmount.toFixed(2)} - Method: ${payoutMethod}` : `Requested by user - Method: ${payoutMethod}`
        })
            .select()
            .single();
        if (error) {
            console.error('Error creating payout request:', error);
            return res.status(500).json({ error: 'Failed to create payout request' });
        }
        res.json({ success: true, payoutId: payout.id });
    }
    catch (error) {
        console.error('Error requesting payout:', error);
        res.status(500).json({ error: 'Failed to request payout' });
    }
});
// Process payout batch (rate limited, authenticated)
router.post('/payouts/batch/:batchId/process', rateLimit(5, 60000), authenticateUser, async (req, res) => {
    try {
        const batchId = getParam(req.params.batchId);
        const { processedBy } = req.body;
        const success = await payoutService.processPayoutBatch(batchId, processedBy);
        if (!success) {
            return res.status(400).json({ error: 'Failed to process payout batch' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error processing payout batch:', error);
        res.status(500).json({ error: 'Failed to process payout batch' });
    }
});
// Get user payout history
router.get('/payouts/user/:userId/:userType', async (req, res) => {
    try {
        const userId = getParam(req.params.userId);
        const userType = getParam(req.params.userType);
        const limit = parseInt(req.query.limit) || 20;
        const payouts = await payoutService.getUserPayoutHistory(userId, userType, limit);
        res.json(payouts);
    }
    catch (error) {
        console.error('Error getting payout history:', error);
        res.status(500).json({ error: 'Failed to get payout history' });
    }
});
// Get pending batches
router.get('/payouts/batches/pending', async (req, res) => {
    try {
        const batches = await payoutService.getPendingBatches();
        res.json(batches);
    }
    catch (error) {
        console.error('Error getting pending batches:', error);
        res.status(500).json({ error: 'Failed to get pending batches' });
    }
});
// Cancel payout batch (rate limited, authenticated)
router.post('/payouts/batch/:batchId/cancel', rateLimit(5, 60000), authenticateUser, async (req, res) => {
    try {
        const batchId = getParam(req.params.batchId);
        const success = await payoutService.cancelPayoutBatch(batchId);
        if (!success) {
            return res.status(400).json({ error: 'Failed to cancel payout batch' });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error cancelling payout batch:', error);
        res.status(500).json({ error: 'Failed to cancel payout batch' });
    }
});
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map
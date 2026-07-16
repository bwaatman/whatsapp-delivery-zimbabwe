"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DriverService_1 = require("./DriverService");
const DriverSettlementService_1 = require("./DriverSettlementService");
const router = (0, express_1.Router)();
const driverService = new DriverService_1.DriverService();
const settlementService = new DriverSettlementService_1.DriverSettlementService();
// Helper function to safely extract string from params
function getParam(param) {
    return Array.isArray(param) ? param[0] : param;
}
// Test endpoint to verify deployment (must be before parameterized routes)
router.get('/test-deployment-check', async (req, res) => {
    try {
        console.log('🧪 TEST ENDPOINT - NEW CODE VERSION: fc0e99d');
        console.log('🧪 Cache-busting deployment is active');
        res.json({
            success: true,
            version: 'fc0e99d',
            message: 'Cache-busting deployment is working',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Test endpoint error:', error);
        res.status(500).json({ error: 'Test endpoint failed' });
    }
});
// Get driver by ID
router.get('/driver/:id', async (req, res) => {
    try {
        const driver = await driverService.getDriverById(getParam(req.params.id));
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.json(driver);
    }
    catch (error) {
        console.error('Error getting driver:', error);
        res.status(500).json({ error: 'Failed to get driver' });
    }
});
// Get driver by phone number
router.get('/driver/phone/:phone', async (req, res) => {
    try {
        const driver = await driverService.getDriverByPhone(getParam(req.params.phone));
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.json(driver);
    }
    catch (error) {
        console.error('Error getting driver by phone:', error);
        res.status(500).json({ error: 'Failed to get driver' });
    }
});
// Get driver dashboard summary
router.get('/driver/:id/dashboard', async (req, res) => {
    try {
        const summary = await driverService.getDriverDashboardSummary(getParam(req.params.id));
        if (!summary) {
            return res.status(404).json({ error: 'Driver dashboard summary not found' });
        }
        res.json(summary);
    }
    catch (error) {
        console.error('Error getting driver dashboard summary:', error);
        res.status(500).json({ error: 'Failed to get dashboard summary' });
    }
});
// Get available orders for drivers
router.get('/driver/orders/available', async (req, res) => {
    try {
        const { driverId } = req.query;
        const orders = await driverService.getAvailableOrders(driverId);
        res.json(orders);
    }
    catch (error) {
        console.error('Error getting available orders:', error);
        res.status(500).json({ error: 'Failed to get available orders' });
    }
});
// Get driver's active delivery
router.get('/driver/:id/active-delivery', async (req, res) => {
    try {
        const delivery = await driverService.getDriverActiveDelivery(getParam(req.params.id));
        if (!delivery) {
            return res.status(404).json({ error: 'No active delivery found' });
        }
        res.json(delivery);
    }
    catch (error) {
        console.error('Error getting active delivery:', error);
        res.status(500).json({ error: 'Failed to get active delivery' });
    }
});
// Accept an order
router.post('/driver/:id/orders/:orderId/accept', async (req, res) => {
    try {
        // Disable caching for this endpoint
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        console.log('🚀 ORDER ACCEPTANCE - NEW CODE VERSION: 3f5221b');
        console.log('🚀 AGGRESSIVE 10KM CHECK SHOULD BE ACTIVE');
        const { latitude, longitude } = req.body;
        console.log('📍 Request body:', { latitude, longitude });
        const success = await driverService.acceptOrder(getParam(req.params.orderId), getParam(req.params.id), latitude, longitude);
        if (!success) {
            console.log('❌ Order acceptance rejected by service');
            return res.status(400).json({ error: 'Failed to accept order. You may be too far from this order.' });
        }
        console.log('✅ Order acceptance successful');
        res.json({ success: true, message: 'Order accepted successfully' });
    }
    catch (error) {
        console.error('❌ Error accepting order:', error);
        res.status(500).json({ error: 'Failed to accept order' });
    }
});
// Start delivery
router.post('/driver/:id/orders/:orderId/start', async (req, res) => {
    try {
        const success = await driverService.startDelivery(getParam(req.params.orderId));
        if (!success) {
            return res.status(400).json({ error: 'Failed to start delivery' });
        }
        res.json({ success: true, message: 'Delivery started successfully' });
    }
    catch (error) {
        console.error('Error starting delivery:', error);
        res.status(500).json({ error: 'Failed to start delivery' });
    }
});
// Complete delivery
router.post('/driver/:id/orders/:orderId/complete', async (req, res) => {
    try {
        const success = await driverService.completeDelivery(getParam(req.params.orderId), getParam(req.params.id));
        if (!success) {
            return res.status(400).json({ error: 'Failed to complete delivery' });
        }
        res.json({ success: true, message: 'Delivery completed successfully' });
    }
    catch (error) {
        console.error('Error completing delivery:', error);
        res.status(500).json({ error: 'Failed to complete delivery' });
    }
});
// Update driver location
router.put('/driver/:id/location', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const success = await driverService.updateDriverLocation(getParam(req.params.id), latitude, longitude);
        if (!success) {
            return res.status(400).json({ error: 'Failed to update driver location' });
        }
        res.json({ success: true, message: 'Driver location updated successfully' });
    }
    catch (error) {
        console.error('Error updating driver location:', error);
        res.status(500).json({ error: 'Failed to update driver location' });
    }
});
// Set driver availability
router.put('/driver/:id/availability', async (req, res) => {
    try {
        const { isAvailable, latitude, longitude } = req.body;
        // If location is provided and driver is going online, update location first
        if (isAvailable && latitude !== undefined && longitude !== undefined) {
            console.log('📍 Updating driver location with availability change');
            const locationSuccess = await driverService.updateDriverLocation(getParam(req.params.id), latitude, longitude);
            if (!locationSuccess) {
                console.warn('⚠️ Failed to update driver location, but continuing with availability update');
            }
        }
        const success = await driverService.setDriverAvailability(getParam(req.params.id), isAvailable);
        if (!success) {
            return res.status(400).json({ error: 'Failed to set driver availability' });
        }
        res.json({ success: true, message: `Driver is now ${isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}` });
    }
    catch (error) {
        console.error('Error setting driver availability:', error);
        res.status(500).json({ error: 'Failed to set driver availability' });
    }
});
// Get driver category
router.get('/driver/:id/category', async (req, res) => {
    try {
        const driver = await driverService.getDriverById(getParam(req.params.id));
        if (!driver) {
            return res.status(404).json({ error: 'Driver not found' });
        }
        res.json({ category_id: driver.category_id });
    }
    catch (error) {
        console.error('Error getting driver category:', error);
        res.status(500).json({ error: 'Failed to get driver category' });
    }
});
// Update driver category
router.put('/driver/:id/category', async (req, res) => {
    try {
        const { categoryId } = req.body;
        const success = await driverService.setDriverCategory(getParam(req.params.id), categoryId);
        if (!success) {
            return res.status(400).json({ error: 'Failed to set driver category' });
        }
        res.json({ success: true, message: 'Driver category updated successfully' });
    }
    catch (error) {
        console.error('Error setting driver category:', error);
        res.status(500).json({ error: 'Failed to set driver category' });
    }
});
// Get driver delivery history
router.get('/driver/:id/history', async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(getParam(req.query.limit)) : 10;
        const history = await driverService.getDriverDeliveryHistory(getParam(req.params.id), limit);
        res.json(history);
    }
    catch (error) {
        console.error('Error getting delivery history:', error);
        res.status(500).json({ error: 'Failed to get delivery history' });
    }
});
// Get order details for driver
router.get('/driver/:id/orders/:orderId', async (req, res) => {
    try {
        const details = await driverService.getOrderDetails(getParam(req.params.orderId));
        if (!details) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(details);
    }
    catch (error) {
        console.error('Error getting order details:', error);
        res.status(500).json({ error: 'Failed to get order details' });
    }
});
// Get all available drivers
router.get('/drivers/available', async (req, res) => {
    try {
        const drivers = await driverService.getAllAvailableDrivers();
        res.json(drivers);
    }
    catch (error) {
        console.error('Error getting available drivers:', error);
        res.status(500).json({ error: 'Failed to get available drivers' });
    }
});
// Create a new driver
router.post('/driver', async (req, res) => {
    try {
        const { name, phone } = req.body;
        const driver = await driverService.createDriver(name, phone);
        if (!driver) {
            return res.status(400).json({ error: 'Failed to create driver' });
        }
        res.status(201).json(driver);
    }
    catch (error) {
        console.error('Error creating driver:', error);
        res.status(500).json({ error: 'Failed to create driver' });
    }
});
// Driver registration endpoint
router.post('/drivers/register', async (req, res) => {
    try {
        const registrationData = req.body;
        const result = await driverService.submitDriverRegistration(registrationData);
        if (!result) {
            return res.status(400).json({ error: 'Failed to submit driver registration' });
        }
        res.status(201).json({
            success: true,
            message: 'Driver registration submitted successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Error submitting driver registration:', error);
        res.status(500).json({ error: 'Failed to submit driver registration' });
    }
});
// Get weekly settlement for a specific driver
router.get('/driver/:id/settlement', async (req, res) => {
    try {
        const { weekStart, weekEnd } = req.query;
        if (!weekStart || !weekEnd) {
            return res.status(400).json({ error: 'weekStart and weekEnd query parameters are required' });
        }
        const settlement = await settlementService.calculateWeeklySettlement(getParam(req.params.id), new Date(weekStart), new Date(weekEnd));
        if (!settlement) {
            return res.status(404).json({ error: 'No settlement data found for this period' });
        }
        res.json(settlement);
    }
    catch (error) {
        console.error('Error getting driver settlement:', error);
        res.status(500).json({ error: 'Failed to get driver settlement' });
    }
});
// Get weekly settlements for all drivers
router.get('/drivers/settlements', async (req, res) => {
    try {
        const { weekStart, weekEnd } = req.query;
        if (!weekStart || !weekEnd) {
            return res.status(400).json({ error: 'weekStart and weekEnd query parameters are required' });
        }
        const settlements = await settlementService.getWeeklySettlements(new Date(weekStart), new Date(weekEnd));
        res.json(settlements);
    }
    catch (error) {
        console.error('Error getting driver settlements:', error);
        res.status(500).json({ error: 'Failed to get driver settlements' });
    }
});
// Get detailed settlement report for a driver
router.get('/driver/:id/settlement/report', async (req, res) => {
    try {
        const { weekStart, weekEnd } = req.query;
        if (!weekStart || !weekEnd) {
            return res.status(400).json({ error: 'weekStart and weekEnd query parameters are required' });
        }
        const report = await settlementService.getDriverSettlementReport(getParam(req.params.id), new Date(weekStart), new Date(weekEnd));
        if (!report) {
            return res.status(404).json({ error: 'No settlement report found for this period' });
        }
        res.json(report);
    }
    catch (error) {
        console.error('Error getting driver settlement report:', error);
        res.status(500).json({ error: 'Failed to get driver settlement report' });
    }
});
exports.default = router;
//# sourceMappingURL=driverRoutes.js.map
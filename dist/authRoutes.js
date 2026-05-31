"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DriverService_1 = require("./DriverService");
const ShopService_1 = require("./ShopService");
const router = (0, express_1.Router)();
const driverService = new DriverService_1.DriverService();
const shopService = new ShopService_1.ShopService();
// Login endpoint - authenticate by phone number and user type
router.post('/login', async (req, res) => {
    try {
        const { user_type, phone, password } = req.body;
        if (!user_type || !phone || !password) {
            return res.status(400).json({ error: 'User type, phone number, and password are required' });
        }
        let user = null;
        if (user_type === 'driver') {
            user = await driverService.getDriverByPhone(phone);
            if (!user) {
                return res.status(404).json({ error: 'Driver not found' });
            }
            if (user.registration_status !== 'approved') {
                return res.status(403).json({ error: 'Driver account is not approved' });
            }
            // Check password (for now, simple comparison since password column may not exist yet)
            if (user.password && user.password !== password) {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }
        else if (user_type === 'vendor') {
            user = await shopService.getShopByPhone(phone);
            if (!user) {
                return res.status(404).json({ error: 'Vendor not found' });
            }
            if (user.registration_status !== 'approved') {
                return res.status(403).json({ error: 'Vendor account is not approved' });
            }
            // Check password (for now, simple comparison since password column may not exist yet)
            if (user.password && user.password !== password) {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }
        else if (user_type === 'admin') {
            // For admin, we'll need to check admin_users table
            // For now, allow admin login without phone check (simplified)
            user = { id: 'admin', name: 'Admin', user_type: 'admin' };
        }
        else {
            return res.status(400).json({ error: 'Invalid user type' });
        }
        // Generate a simple token (in production, use JWT)
        const token = Buffer.from(`${user_type}:${phone}:${Date.now()}`).toString('base64');
        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                name: user.name || user.shop_name,
                user_type: user_type,
                phone: user.phone || user.contact_phone
            }
        });
    }
    catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
exports.default = router;
//# sourceMappingURL=authRoutes.js.map
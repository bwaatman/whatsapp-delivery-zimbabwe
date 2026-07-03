"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DriverService_1 = require("./DriverService");
const ShopService_1 = require("./ShopService");
const database_1 = require("./database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const router = (0, express_1.Router)();
const driverService = new DriverService_1.DriverService();
const shopService = new ShopService_1.ShopService();
// Login endpoint - authenticate by phone number and user type
router.post('/login', async (req, res) => {
    try {
        const { user_type, phone, password, email } = req.body;
        if (!user_type) {
            return res.status(400).json({ error: 'User type is required' });
        }
        let user = null;
        if (user_type === 'driver') {
            if (!phone || !password) {
                return res.status(400).json({ error: 'Phone number and password are required' });
            }
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
            if (!phone || !password) {
                return res.status(400).json({ error: 'Phone number and password are required' });
            }
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
            // Admin login with email and password
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required for admin login' });
            }
            const { data: adminUser, error } = await database_1.supabase
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .eq('is_active', true)
                .single();
            if (error || !adminUser) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            // Verify password hash
            const passwordMatch = await bcrypt_1.default.compare(password, adminUser.password_hash);
            if (!passwordMatch) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
            user = adminUser;
        }
        else {
            return res.status(400).json({ error: 'Invalid user type' });
        }
        // Generate a simple token (in production, use JWT)
        const token = Buffer.from(`${user_type}:${user.id}:${Date.now()}`).toString('base64');
        res.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                name: user.name || user.shop_name,
                user_type: user_type,
                email: user.email,
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
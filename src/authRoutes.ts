import { Router, Request, Response } from 'express';
import { DriverService } from './DriverService';
import { ShopService } from './ShopService';
import { supabase } from './database';
import bcrypt from 'bcrypt';

const router = Router();
const driverService = new DriverService();
const shopService = new ShopService();

// Login endpoint - authenticate by phone number and user type
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { user_type, phone, password, email } = req.body;
    
    if (!user_type) {
      return res.status(400).json({ error: 'User type is required' });
    }
    
    let user: any = null;
    
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
    } else if (user_type === 'vendor') {
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
    } else if (user_type === 'admin') {
      // Admin login with email and password
      if (!email || !password) {
        console.log('Admin login missing email or password:', { email: !!email, password: !!password });
        return res.status(400).json({ error: 'Email and password are required for admin login' });
      }
      
      console.log('Admin login attempt for email:', email);
      
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();
      
      console.log('Admin user query result:', { error: !!error, userFound: !!adminUser });
      
      if (error || !adminUser) {
        console.log('Admin user not found or error:', error);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      console.log('Admin user found, verifying password...');
      
      // Verify password hash
      const passwordMatch = await bcrypt.compare(password, adminUser.password_hash);
      console.log('Password match result:', passwordMatch);
      
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      user = adminUser;
    } else {
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
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;

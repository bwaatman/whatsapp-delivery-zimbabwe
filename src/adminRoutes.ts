import { Router, Request, Response } from 'express';
import { AdminService } from './AdminService';
import { supabase } from './database';

const router = Router();
const adminService = new AdminService();

// Helper function to safely extract string from params
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// Authentication middleware for admin routes
const authenticateAdmin = (req: Request, res: Response, next: Function) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  // Simple token validation (in production, use proper JWT verification)
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userType, userId] = decoded.split(':');
    
    // Accept tokens from the new auth system (format: admin:userId:timestamp)
    if (userType === 'admin') {
      next();
    } else {
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin authentication routes
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    console.log('Admin login attempt:', { username, password: password ? password : 'missing', passwordLength: password ? password.length : 0 });
    
    // Hardcoded admin credentials as requested
    const ADMIN_USERNAME = 'Delivery';
    const ADMIN_PASSWORD = 'D3l1v3ry';
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      console.log('Invalid credentials for:', username, '- password match:', password === ADMIN_PASSWORD, '- expected password length:', ADMIN_PASSWORD.length, '- received password length:', password.length);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate a simple token (in production, use proper JWT)
    const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
    
    console.log('Admin login successful for:', username);
    res.json({ success: true, token, username });
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin dashboard summary (protected)
router.get('/admin/dashboard', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const summary = await adminService.getDashboardSummary();
    if (!summary) {
      return res.status(404).json({ error: 'Dashboard summary not found' });
    }
    res.json(summary);
  } catch (error) {
    console.error('Error getting dashboard summary:', error);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

// Vendor registration management (protected)
router.get('/admin/vendor-registrations/pending', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const registrations = await adminService.getPendingVendorRegistrations();
    res.json(registrations);
  } catch (error) {
    console.error('Error getting pending vendor registrations:', error);
    res.status(500).json({ error: 'Failed to get pending registrations' });
  }
});

router.get('/admin/vendor-registrations/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const details = await adminService.getVendorRegistrationDetails(getParam(req.params.id));
    if (!details) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    res.json(details);
  } catch (error) {
    console.error('Error getting vendor registration details:', error);
    res.status(500).json({ error: 'Failed to get registration details' });
  }
});

router.post('/admin/vendor-registrations/:id/approve', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { adminId } = req.body;
    const success = await adminService.approveVendorRegistration(getParam(req.params.id), adminId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to approve registration' });
    }
    res.json({ success: true, message: 'Vendor registration approved successfully' });
  } catch (error) {
    console.error('Error approving vendor registration:', error);
    res.status(500).json({ error: 'Failed to approve registration' });
  }
});

router.post('/admin/vendor-registrations/:id/reject', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { adminId, reason } = req.body;
    const success = await adminService.rejectVendorRegistration(getParam(req.params.id), adminId, reason);
    if (!success) {
      return res.status(400).json({ error: 'Failed to reject registration' });
    }
    res.json({ success: true, message: 'Vendor registration rejected successfully' });
  } catch (error) {
    console.error('Error rejecting vendor registration:', error);
    res.status(500).json({ error: 'Failed to reject registration' });
  }
});

// Driver registration management (protected)
router.get('/admin/driver-registrations/pending', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const registrations = await adminService.getPendingDriverRegistrations();
    res.json(registrations);
  } catch (error) {
    console.error('Error getting pending driver registrations:', error);
    res.status(500).json({ error: 'Failed to get pending registrations' });
  }
});

router.get('/admin/driver-registrations/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const details = await adminService.getDriverRegistrationDetails(getParam(req.params.id));
    if (!details) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    res.json(details);
  } catch (error) {
    console.error('Error getting driver registration details:', error);
    res.status(500).json({ error: 'Failed to get registration details' });
  }
});

router.post('/admin/driver-registrations/:id/approve', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { adminId } = req.body;
    const success = await adminService.approveDriverRegistration(getParam(req.params.id), adminId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to approve registration' });
    }
    res.json({ success: true, message: 'Driver registration approved successfully' });
  } catch (error) {
    console.error('Error approving driver registration:', error);
    res.status(500).json({ error: 'Failed to approve registration' });
  }
});

router.post('/admin/driver-registrations/:id/reject', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { adminId, reason } = req.body;
    const success = await adminService.rejectDriverRegistration(getParam(req.params.id), adminId, reason);
    if (!success) {
      return res.status(400).json({ error: 'Failed to reject registration' });
    }
    res.json({ success: true, message: 'Driver registration rejected successfully' });
  } catch (error) {
    console.error('Error rejecting driver registration:', error);
    res.status(500).json({ error: 'Failed to reject registration' });
  }
});

// Vendor management (protected)
router.get('/admin/vendors', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const vendors = await adminService.getAllVendors();
    res.json(vendors);
  } catch (error) {
    console.error('Error getting vendors:', error);
    res.status(500).json({ error: 'Failed to get vendors' });
  }
});

router.get('/admin/vendors/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const vendor = await adminService.getVendorById(getParam(req.params.id));
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    // If vendor has missing details, try to fetch from registration request
    if (!vendor.business_license_number || !vendor.tax_id) {
      const { data: registration } = await supabase
        .from('vendor_registration_requests')
        .select('*')
        .eq('merchant_id', getParam(req.params.id))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (registration) {
        // Merge registration data with vendor data
        Object.assign(vendor, {
          business_license_number: vendor.business_license_number || registration.business_license_number,
          tax_id: vendor.tax_id || registration.tax_id,
          business_description: vendor.business_description || registration.business_description,
          operating_hours: vendor.operating_hours || registration.operating_hours,
          shop_address: vendor.shop_address || registration.shop_address
        });
      }
    }
    
    res.json(vendor);
  } catch (error) {
    console.error('Error getting vendor:', error);
    res.status(500).json({ error: 'Failed to get vendor' });
  }
});

router.put('/admin/vendors/:id/suspend', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const success = await adminService.suspendVendor(getParam(req.params.id));
    if (!success) {
      return res.status(400).json({ error: 'Failed to suspend vendor' });
    }
    res.json({ success: true, message: 'Vendor suspended successfully' });
  } catch (error) {
    console.error('Error suspending vendor:', error);
    res.status(500).json({ error: 'Failed to suspend vendor' });
  }
});

router.put('/admin/vendors/:id/activate', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const success = await adminService.activateVendor(getParam(req.params.id));
    if (!success) {
      return res.status(400).json({ error: 'Failed to activate vendor' });
    }
    res.json({ success: true, message: 'Vendor activated successfully' });
  } catch (error) {
    console.error('Error activating vendor:', error);
    res.status(500).json({ error: 'Failed to activate vendor' });
  }
});

// Driver management (protected)
router.get('/admin/drivers', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const drivers = await adminService.getAllDrivers();
    res.json(drivers);
  } catch (error) {
    console.error('Error getting drivers:', error);
    res.status(500).json({ error: 'Failed to get drivers' });
  }
});

router.get('/admin/drivers/:id', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const driver = await adminService.getDriverById(getParam(req.params.id));
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    // If driver has missing details, try to fetch from registration request
    if (!driver.driver_license_number || !driver.vehicle_type || !driver.name) {
      const { data: registration } = await supabase
        .from('driver_registration_requests')
        .select('*')
        .eq('driver_id', getParam(req.params.id))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (registration) {
        // Merge registration data with driver data
        Object.assign(driver, {
          name: driver.name || registration.full_name,
          phone: driver.phone || registration.phone,
          driver_license_number: driver.driver_license_number || registration.driver_license_number,
          vehicle_type: driver.vehicle_type || registration.vehicle_type,
          vehicle_registration: driver.vehicle_registration || registration.vehicle_registration,
          vehicle_color: driver.vehicle_color || registration.vehicle_color,
          home_address: driver.home_address || registration.home_address,
          emergency_contact_name: driver.emergency_contact_name || registration.emergency_contact_name,
          emergency_contact_phone: driver.emergency_contact_phone || registration.emergency_contact_phone
        });
      }
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error getting driver:', error);
    res.status(500).json({ error: 'Failed to get driver' });
  }
});

router.put('/admin/drivers/:id/suspend', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const success = await adminService.suspendDriver(getParam(req.params.id));
    if (!success) {
      return res.status(400).json({ error: 'Failed to suspend driver' });
    }
    res.json({ success: true, message: 'Driver suspended successfully' });
  } catch (error) {
    console.error('Error suspending driver:', error);
    res.status(500).json({ error: 'Failed to suspend driver' });
  }
});

router.put('/admin/drivers/:id/activate', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const success = await adminService.activateDriver(getParam(req.params.id));
    if (!success) {
      return res.status(400).json({ error: 'Failed to activate driver' });
    }
    res.json({ success: true, message: 'Driver activated successfully' });
  } catch (error) {
    console.error('Error activating driver:', error);
    res.status(500).json({ error: 'Failed to activate driver' });
  }
});

router.post('/admin/drivers/:id/approve', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { adminId } = req.body;
    const success = await adminService.approveDriverDirectly(getParam(req.params.id), adminId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to approve driver' });
    }
    res.json({ success: true, message: 'Driver approved successfully' });
  } catch (error) {
    console.error('Error approving driver:', error);
    res.status(500).json({ error: 'Failed to approve driver' });
  }
});

router.post('/admin/drivers/:id/reject', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { adminId, reason } = req.body;
    const success = await adminService.rejectDriverDirectly(getParam(req.params.id), adminId, reason);
    if (!success) {
      return res.status(400).json({ error: 'Failed to reject driver' });
    }
    res.json({ success: true, message: 'Driver rejected successfully' });
  } catch (error) {
    console.error('Error rejecting driver:', error);
    res.status(500).json({ error: 'Failed to reject driver' });
  }
});

// Order management (protected)
router.get('/admin/orders', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const orders = await adminService.getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Admin user management (protected)
router.post('/admin/users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;
    const admin = await adminService.createAdminUser(email, password, name, role);
    if (!admin) {
      return res.status(400).json({ error: 'Failed to create admin user' });
    }
    res.status(201).json(admin);
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ error: 'Failed to create admin user' });
  }
});

router.get('/admin/users', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    const admins = await adminService.getAllAdminUsers();
    res.json(admins);
  } catch (error) {
    console.error('Error getting admin users:', error);
    res.status(500).json({ error: 'Failed to get admin users' });
  }
});

export default router;

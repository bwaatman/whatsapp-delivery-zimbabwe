import { Router, Request, Response } from 'express';
import { AdminService } from './AdminService';

const router = Router();
const adminService = new AdminService();

// Helper function to safely extract string from params
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// Admin authentication routes
router.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    // For now, simple admin auth - in production use proper JWT
    const admin = await adminService.getAdminUserByEmail(email);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Simple password check (use proper hashing in production)
    if (admin.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ success: true, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } });
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin dashboard summary
router.get('/admin/dashboard', async (req: Request, res: Response) => {
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

// Vendor registration management
router.get('/admin/vendor-registrations/pending', async (req: Request, res: Response) => {
  try {
    const registrations = await adminService.getPendingVendorRegistrations();
    res.json(registrations);
  } catch (error) {
    console.error('Error getting pending vendor registrations:', error);
    res.status(500).json({ error: 'Failed to get pending registrations' });
  }
});

router.get('/admin/vendor-registrations/:id', async (req: Request, res: Response) => {
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

router.post('/admin/vendor-registrations/:id/approve', async (req: Request, res: Response) => {
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

router.post('/admin/vendor-registrations/:id/reject', async (req: Request, res: Response) => {
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

// Driver registration management
router.get('/admin/driver-registrations/pending', async (req: Request, res: Response) => {
  try {
    const registrations = await adminService.getPendingDriverRegistrations();
    res.json(registrations);
  } catch (error) {
    console.error('Error getting pending driver registrations:', error);
    res.status(500).json({ error: 'Failed to get pending registrations' });
  }
});

router.get('/admin/driver-registrations/:id', async (req: Request, res: Response) => {
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

router.post('/admin/driver-registrations/:id/approve', async (req: Request, res: Response) => {
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

router.post('/admin/driver-registrations/:id/reject', async (req: Request, res: Response) => {
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

// Vendor management
router.get('/admin/vendors', async (req: Request, res: Response) => {
  try {
    const vendors = await adminService.getAllVendors();
    res.json(vendors);
  } catch (error) {
    console.error('Error getting vendors:', error);
    res.status(500).json({ error: 'Failed to get vendors' });
  }
});

router.put('/admin/vendors/:id/suspend', async (req: Request, res: Response) => {
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

router.put('/admin/vendors/:id/activate', async (req: Request, res: Response) => {
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

// Driver management
router.get('/admin/drivers', async (req: Request, res: Response) => {
  try {
    const drivers = await adminService.getAllDrivers();
    res.json(drivers);
  } catch (error) {
    console.error('Error getting drivers:', error);
    res.status(500).json({ error: 'Failed to get drivers' });
  }
});

router.put('/admin/drivers/:id/suspend', async (req: Request, res: Response) => {
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

router.put('/admin/drivers/:id/activate', async (req: Request, res: Response) => {
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

// Order management
router.get('/admin/orders', async (req: Request, res: Response) => {
  try {
    const orders = await adminService.getAllOrders();
    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

// Admin user management
router.post('/admin/users', async (req: Request, res: Response) => {
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

router.get('/admin/users', async (req: Request, res: Response) => {
  try {
    const admins = await adminService.getAllAdminUsers();
    res.json(admins);
  } catch (error) {
    console.error('Error getting admin users:', error);
    res.status(500).json({ error: 'Failed to get admin users' });
  }
});

export default router;

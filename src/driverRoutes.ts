import { Router, Request, Response } from 'express';
import { DriverService } from './DriverService';
import { DriverSettlementService } from './DriverSettlementService';
import { supabase } from './database';

const router = Router();
const driverService = new DriverService();
const settlementService = new DriverSettlementService();

// Helper function to safely extract string from params
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// Test endpoint to verify deployment (must be before parameterized routes)
router.get('/test-deployment-check', async (req: Request, res: Response) => {
  try {
    console.log('🧪 TEST ENDPOINT - NEW CODE VERSION: fc0e99d');
    console.log('🧪 Cache-busting deployment is active');
    res.json({ 
      success: true, 
      version: 'fc0e99d',
      message: 'Cache-busting deployment is working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({ error: 'Test endpoint failed' });
  }
});

// Get driver by ID
router.get('/driver/:id', async (req: Request, res: Response) => {
  try {
    const driver = await driverService.getDriverById(getParam(req.params.id));
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    console.error('Error getting driver:', error);
    res.status(500).json({ error: 'Failed to get driver' });
  }
});

// Get driver by phone number
router.get('/driver/phone/:phone', async (req: Request, res: Response) => {
  try {
    const driver = await driverService.getDriverByPhone(getParam(req.params.phone));
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
  } catch (error) {
    console.error('Error getting driver by phone:', error);
    res.status(500).json({ error: 'Failed to get driver' });
  }
});

// Get driver dashboard summary
router.get('/driver/:id/dashboard', async (req: Request, res: Response) => {
  try {
    const summary = await driverService.getDriverDashboardSummary(getParam(req.params.id));
    if (!summary) {
      return res.status(404).json({ error: 'Driver dashboard summary not found' });
    }
    res.json(summary);
  } catch (error) {
    console.error('Error getting driver dashboard summary:', error);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

// Get available orders for drivers
router.get('/driver/orders/available', async (req: Request, res: Response) => {
  try {
    const { driverId } = req.query;
    console.log('🔍 [DIAGNOSTIC] GET /driver/orders/available called');
    console.log('🔍 [DIAGNOSTIC] req.query:', req.query);
    console.log('🔍 [DIAGNOSTIC] driverId received:', driverId);
    console.log('🔍 [DIAGNOSTIC] driverId type:', typeof driverId);
    const orders = await driverService.getAvailableOrders(driverId as string);
    console.log('🔍 [DIAGNOSTIC] Orders returned from service:', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('Error getting available orders:', error);
    res.status(500).json({ error: 'Failed to get available orders' });
  }
});

// Get driver's active delivery
router.get('/driver/:id/active-delivery', async (req: Request, res: Response) => {
  try {
    const delivery = await driverService.getDriverActiveDelivery(getParam(req.params.id));
    if (!delivery) {
      return res.status(404).json({ error: 'No active delivery found' });
    }
    res.json(delivery);
  } catch (error) {
    console.error('Error getting active delivery:', error);
    res.status(500).json({ error: 'Failed to get active delivery' });
  }
});

// Accept an order (v2 - new endpoint to bypass Cloudflare caching)
router.post('/driver/:id/orders/:orderId/accept-v2', async (req: Request, res: Response) => {
  try {
    // Disable caching for this endpoint
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('🚀 ORDER ACCEPTANCE V2 - NEW CODE VERSION: 3f5221b');
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
  } catch (error) {
    console.error('❌ Error accepting order:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// Accept an order (legacy - kept for compatibility)
router.post('/driver/:id/orders/:orderId/accept', async (req: Request, res: Response) => {
  try {
    // Disable caching for this endpoint
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('🚀 ORDER ACCEPTANCE LEGACY - NEW CODE VERSION: 3f5221b');
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
  } catch (error) {
    console.error('❌ Error accepting order:', error);
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// Start delivery
router.post('/driver/:id/orders/:orderId/start', async (req: Request, res: Response) => {
  try {
    const success = await driverService.startDelivery(getParam(req.params.orderId));
    if (!success) {
      return res.status(400).json({ error: 'Failed to start delivery' });
    }
    res.json({ success: true, message: 'Delivery started successfully' });
  } catch (error) {
    console.error('Error starting delivery:', error);
    res.status(500).json({ error: 'Failed to start delivery' });
  }
});

// Complete delivery
router.post('/driver/:id/orders/:orderId/complete', async (req: Request, res: Response) => {
  try {
    const success = await driverService.completeDelivery(getParam(req.params.orderId), getParam(req.params.id));
    if (!success) {
      return res.status(400).json({ error: 'Failed to complete delivery' });
    }
    res.json({ success: true, message: 'Delivery completed successfully' });
  } catch (error) {
    console.error('Error completing delivery:', error);
    res.status(500).json({ error: 'Failed to complete delivery' });
  }
});

// Update driver location
router.put('/driver/:id/location', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    const success = await driverService.updateDriverLocation(getParam(req.params.id), latitude, longitude);
    if (!success) {
      return res.status(400).json({ error: 'Failed to update driver location' });
    }
    res.json({ success: true, message: 'Driver location updated successfully' });
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ error: 'Failed to update driver location' });
  }
});

// Set driver availability
router.put('/driver/:id/availability', async (req: Request, res: Response) => {
  try {
    console.log('🔍 [DIAGNOSTIC] PUT /driver/:id/availability called');
    console.log('🔍 [DIAGNOSTIC] req.params.id:', req.params.id);
    console.log('🔍 [DIAGNOSTIC] req.body:', req.body);
    const { isAvailable, latitude, longitude } = req.body;
    console.log('🔍 [DIAGNOSTIC] isAvailable:', isAvailable);
    console.log('🔍 [DIAGNOSTIC] latitude:', latitude);
    console.log('🔍 [DIAGNOSTIC] longitude:', longitude);
    console.log('🔍 [DIAGNOSTIC] latitude !== undefined:', latitude !== undefined);
    console.log('🔍 [DIAGNOSTIC] longitude !== undefined:', longitude !== undefined);

    // If location is provided and driver is going online, update location first
    if (isAvailable && latitude !== undefined && longitude !== undefined) {
      console.log('📍 Updating driver location with availability change');
      console.log('🔍 [DIAGNOSTIC] Calling updateDriverLocation');
      const locationSuccess = await driverService.updateDriverLocation(getParam(req.params.id), latitude, longitude);
      console.log('🔍 [DIAGNOSTIC] updateDriverLocation returned:', locationSuccess);
      if (!locationSuccess) {
        console.warn('⚠️ Failed to update driver location, but continuing with availability update');
      }
    } else {
      console.log('🔍 [DIAGNOSTIC] Skipping location update - conditions not met');
      console.log('🔍 [DIAGNOSTIC] isAvailable:', isAvailable, 'latitude:', latitude, 'longitude:', longitude);
    }

    console.log('🔍 [DIAGNOSTIC] Calling setDriverAvailability');
    const success = await driverService.setDriverAvailability(getParam(req.params.id), isAvailable);
    console.log('🔍 [DIAGNOSTIC] setDriverAvailability returned:', success);
    if (!success) {
      return res.status(400).json({ error: 'Failed to set driver availability' });
    }
    res.json({ success: true, message: `Driver is now ${isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}` });
  } catch (error) {
    console.error('Error setting driver availability:', error);
    console.log('🔍 [DIAGNOSTIC] Exception in PUT /availability:', error);
    res.status(500).json({ error: 'Failed to set driver availability' });
  }
});

// Get driver category
router.get('/driver/:id/category', async (req: Request, res: Response) => {
  try {
    const driver = await driverService.getDriverById(getParam(req.params.id));
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json({ category_id: driver.category_id });
  } catch (error) {
    console.error('Error getting driver category:', error);
    res.status(500).json({ error: 'Failed to get driver category' });
  }
});

// Update driver category
router.put('/driver/:id/category', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.body;
    const success = await driverService.setDriverCategory(getParam(req.params.id), categoryId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to set driver category' });
    }
    res.json({ success: true, message: 'Driver category updated successfully' });
  } catch (error) {
    console.error('Error setting driver category:', error);
    res.status(500).json({ error: 'Failed to set driver category' });
  }
});

// Get driver delivery history
router.get('/driver/:id/history', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(getParam(req.query.limit as string | string[])) : 10;
    const history = await driverService.getDriverDeliveryHistory(getParam(req.params.id), limit);
    res.json(history);
  } catch (error) {
    console.error('Error getting delivery history:', error);
    res.status(500).json({ error: 'Failed to get delivery history' });
  }
});

// Get order details for driver
router.get('/driver/:id/orders/:orderId', async (req: Request, res: Response) => {
  try {
    const details = await driverService.getOrderDetails(getParam(req.params.orderId));
    if (!details) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(details);
  } catch (error) {
    console.error('Error getting order details:', error);
    res.status(500).json({ error: 'Failed to get order details' });
  }
});

// Get all available drivers
router.get('/drivers/available', async (req: Request, res: Response) => {
  try {
    const drivers = await driverService.getAllAvailableDrivers();
    res.json(drivers);
  } catch (error) {
    console.error('Error getting available drivers:', error);
    res.status(500).json({ error: 'Failed to get available drivers' });
  }
});

// Create a new driver
router.post('/driver', async (req: Request, res: Response) => {
  try {
    const { name, phone } = req.body;
    const driver = await driverService.createDriver(name, phone);
    if (!driver) {
      return res.status(400).json({ error: 'Failed to create driver' });
    }
    res.status(201).json(driver);
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ error: 'Failed to create driver' });
  }
});

// Driver registration endpoint
router.post('/drivers/register', async (req: Request, res: Response) => {
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
  } catch (error) {
    console.error('Error submitting driver registration:', error);
    res.status(500).json({ error: 'Failed to submit driver registration' });
  }
});

// Get driver registration with documents
router.get('/driver-registrations/:id', async (req: Request, res: Response) => {
  try {
    const { data: registration, error } = await supabase
      .from('driver_registration_requests')
      .select('*')
      .eq('id', getParam(req.params.id))
      .single();

    if (error || !registration) {
      return res.status(404).json({ error: 'Driver registration not found' });
    }

    // Get documents for this registration
    const documentIds = [
      registration.national_id_front_doc_id,
      registration.national_id_back_doc_id,
      registration.selfie_with_id_doc_id,
      registration.profile_photo_doc_id,
      registration.driver_licence_doc_id,
      registration.vehicle_registration_book_doc_id,
      registration.bicycle_photo_doc_id,
      registration.motorcycle_photo_doc_id,
      registration.vehicle_photo_doc_id,
      registration.insurance_doc_id
    ].filter(Boolean);

    console.log('📄 Document IDs for registration:', documentIds);
    console.log('📄 Registration document fields:', {
      national_id_front: registration.national_id_front_doc_id,
      national_id_back: registration.national_id_back_doc_id,
      selfie_with_id: registration.selfie_with_id_doc_id,
      profile_photo: registration.profile_photo_doc_id,
      driver_licence: registration.driver_licence_doc_id,
      vehicle_registration_book: registration.vehicle_registration_book_doc_id,
      vehicle_photo: registration.vehicle_photo_doc_id,
      insurance: registration.insurance_doc_id
    });

    let documents = [];
    if (documentIds.length > 0) {
      const { data: docs, error } = await supabase
        .from('documents')
        .select('*')
        .in('id', documentIds);
      documents = docs || [];
      console.log('📄 Retrieved documents:', documents.length, documents);
      if (error) {
        console.error('❌ Error fetching documents:', error);
      }
    }

    res.json({ registration, documents });
  } catch (error) {
    console.error('Error getting driver registration:', error);
    res.status(500).json({ error: 'Failed to get driver registration' });
  }
});

// Resubmit driver registration with new documents
router.put('/driver-registrations/:id/resubmit', async (req: Request, res: Response) => {
  try {
    const registrationData = req.body;
    const { error } = await supabase
      .from('driver_registration_requests')
      .update({
        ...registrationData,
        verification_status: 'submitted',
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', getParam(req.params.id));

    if (error) {
      console.error('Error resubmitting driver registration:', error);
      return res.status(400).json({ error: 'Failed to resubmit driver registration' });
    }

    res.json({ success: true, message: 'Driver registration resubmitted successfully' });
  } catch (error) {
    console.error('Error resubmitting driver registration:', error);
    res.status(500).json({ error: 'Failed to resubmit driver registration' });
  }
});

// Get weekly settlement for a specific driver
router.get('/driver/:id/settlement', async (req: Request, res: Response) => {
  try {
    const { weekStart, weekEnd } = req.query;
    
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart and weekEnd query parameters are required' });
    }

    const settlement = await settlementService.calculateWeeklySettlement(
      getParam(req.params.id),
      new Date(weekStart as string),
      new Date(weekEnd as string)
    );

    if (!settlement) {
      return res.status(404).json({ error: 'No settlement data found for this period' });
    }

    res.json(settlement);
  } catch (error) {
    console.error('Error getting driver settlement:', error);
    res.status(500).json({ error: 'Failed to get driver settlement' });
  }
});

// Get weekly settlements for all drivers
router.get('/drivers/settlements', async (req: Request, res: Response) => {
  try {
    const { weekStart, weekEnd } = req.query;
    
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart and weekEnd query parameters are required' });
    }

    const settlements = await settlementService.getWeeklySettlements(
      new Date(weekStart as string),
      new Date(weekEnd as string)
    );

    res.json(settlements);
  } catch (error) {
    console.error('Error getting driver settlements:', error);
    res.status(500).json({ error: 'Failed to get driver settlements' });
  }
});

// Get detailed settlement report for a driver
router.get('/driver/:id/settlement/report', async (req: Request, res: Response) => {
  try {
    const { weekStart, weekEnd } = req.query;
    
    if (!weekStart || !weekEnd) {
      return res.status(400).json({ error: 'weekStart and weekEnd query parameters are required' });
    }

    const report = await settlementService.getDriverSettlementReport(
      getParam(req.params.id),
      new Date(weekStart as string),
      new Date(weekEnd as string)
    );

    if (!report) {
      return res.status(404).json({ error: 'No settlement report found for this period' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error getting driver settlement report:', error);
    res.status(500).json({ error: 'Failed to get driver settlement report' });
  }
});

export default router;

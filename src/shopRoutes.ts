import { Router, Request, Response } from 'express';
import { ShopService } from './ShopService';

const router = Router();
const shopService = new ShopService();

// Helper function to safely extract string from params
function getParam(param: string | string[]): string {
  return Array.isArray(param) ? param[0] : param;
}

// Get shop by ID
router.get('/shop/:id', async (req: Request, res: Response) => {
  try {
    const shopId = getParam(req.params.id);
    const shop = await shopService.getShopById(shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    console.error('Error getting shop:', error);
    res.status(500).json({ error: 'Failed to get shop' });
  }
});

// Get shop by phone number
router.get('/shop/phone/:phone', async (req: Request, res: Response) => {
  try {
    const shop = await shopService.getShopByPhone(getParam(req.params.phone));
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json(shop);
  } catch (error) {
    console.error('Error getting shop by phone:', error);
    res.status(500).json({ error: 'Failed to get shop' });
  }
});

// Get shop dashboard summary
router.get('/shop/:id/dashboard', async (req: Request, res: Response) => {
  try {
    const summary = await shopService.getShopDashboardSummary(getParam(req.params.id));
    if (!summary) {
      return res.status(404).json({ error: 'Shop dashboard summary not found' });
    }
    res.json(summary);
  } catch (error) {
    console.error('Error getting shop dashboard summary:', error);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

// Get all orders for a shop
router.get('/shop/:id/orders', async (req: Request, res: Response) => {
  try {
    const statusFilter = req.query.status as string | undefined;
    const orders = await shopService.getShopOrders(getParam(req.params.id), statusFilter);
    res.json(orders);
  } catch (error) {
    console.error('Error getting shop orders:', error);
    res.status(500).json({ error: 'Failed to get shop orders' });
  }
});

// Get pending orders for a shop
router.get('/shop/:id/orders/pending', async (req: Request, res: Response) => {
  try {
    const orders = await shopService.getPendingOrders(getParam(req.params.id));
    res.json(orders);
  } catch (error) {
    console.error('Error getting pending orders:', error);
    res.status(500).json({ error: 'Failed to get pending orders' });
  }
});

// Get confirmed orders for a shop
router.get('/shop/:id/orders/confirmed', async (req: Request, res: Response) => {
  try {
    const orders = await shopService.getConfirmedOrders(getParam(req.params.id));
    res.json(orders);
  } catch (error) {
    console.error('Error getting confirmed orders:', error);
    res.status(500).json({ error: 'Failed to get confirmed orders' });
  }
});

// Get preparing orders for a shop
router.get('/shop/:id/orders/preparing', async (req: Request, res: Response) => {
  try {
    const orders = await shopService.getPreparingOrders(getParam(req.params.id));
    res.json(orders);
  } catch (error) {
    console.error('Error getting preparing orders:', error);
    res.status(500).json({ error: 'Failed to get preparing orders' });
  }
});

// Get ready for pickup orders for a shop
router.get('/shop/:id/orders/ready', async (req: Request, res: Response) => {
  try {
    const orders = await shopService.getReadyForPickupOrders(getParam(req.params.id));
    res.json(orders);
  } catch (error) {
    console.error('Error getting ready orders:', error);
    res.status(500).json({ error: 'Failed to get ready orders' });
  }
});

// Get assigned orders for a shop
router.get('/shop/:id/orders/assigned', async (req: Request, res: Response) => {
  try {
    const orders = await shopService.getAssignedOrders(getParam(req.params.id));
    res.json(orders);
  } catch (error) {
    console.error('Error getting assigned orders:', error);
    res.status(500).json({ error: 'Failed to get assigned orders' });
  }
});

// Confirm an order
router.post('/shop/:id/orders/:orderId/confirm', async (req: Request, res: Response) => {
  try {
    const success = await shopService.confirmOrder(getParam(req.params.orderId));
    if (!success) {
      return res.status(400).json({ error: 'Failed to confirm order' });
    }
    res.json({ success: true, message: 'Order confirmed successfully' });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({ error: 'Failed to confirm order' });
  }
});

// Start preparing an order
router.post('/shop/:id/orders/:orderId/prepare', async (req: Request, res: Response) => {
  try {
    const success = await shopService.startPreparingOrder(getParam(req.params.orderId));
    if (!success) {
      return res.status(400).json({ error: 'Failed to start order preparation' });
    }
    res.json({ success: true, message: 'Order preparation started successfully' });
  } catch (error) {
    console.error('Error starting order preparation:', error);
    res.status(500).json({ error: 'Failed to start order preparation' });
  }
});

// Mark order as ready for pickup
router.post('/shop/:id/orders/:orderId/ready', async (req: Request, res: Response) => {
  try {
    const { estimatedDeliveryMinutes } = req.body;
    const success = await shopService.markOrderReadyForPickup(
      getParam(req.params.orderId),
      estimatedDeliveryMinutes
    );
    if (!success) {
      return res.status(400).json({ error: 'Failed to mark order as ready' });
    }
    res.json({ success: true, message: 'Order marked as ready for pickup successfully' });
  } catch (error) {
    console.error('Error marking order as ready:', error);
    res.status(500).json({ error: 'Failed to mark order as ready' });
  }
});

// Update shop location
router.put('/shop/:id/location', async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, address } = req.body;
    const success = await shopService.updateShopLocation(
      getParam(req.params.id),
      latitude,
      longitude,
      address
    );
    if (!success) {
      return res.status(400).json({ error: 'Failed to update shop location' });
    }
    res.json({ success: true, message: 'Shop location updated successfully' });
  } catch (error) {
    console.error('Error updating shop location:', error);
    res.status(500).json({ error: 'Failed to update shop location' });
  }
});

// Update shop operating hours
router.put('/shop/:id/hours', async (req: Request, res: Response) => {
  try {
    const { operatingHours } = req.body;
    const success = await shopService.updateShopOperatingHours(getParam(req.params.id), operatingHours);
    if (!success) {
      return res.status(400).json({ error: 'Failed to update operating hours' });
    }
    res.json({ success: true, message: 'Operating hours updated successfully' });
  } catch (error) {
    console.error('Error updating operating hours:', error);
    res.status(500).json({ error: 'Failed to update operating hours' });
  }
});

// Toggle shop open/closed status
router.put('/shop/:id/status', async (req: Request, res: Response) => {
  try {
    const { isOpen } = req.body;
    const success = await shopService.toggleShopStatus(getParam(req.params.id), isOpen);
    if (!success) {
      return res.status(400).json({ error: 'Failed to toggle shop status' });
    }
    res.json({ success: true, message: `Shop is now ${isOpen ? 'OPEN' : 'CLOSED'}` });
  } catch (error) {
    console.error('Error toggling shop status:', error);
    res.status(500).json({ error: 'Failed to toggle shop status' });
  }
});

// Get delivery distance for an order
router.get('/shop/:id/orders/:orderId/distance', async (req: Request, res: Response) => {
  try {
    const distance = await shopService.getOrderDeliveryDistance(getParam(req.params.orderId));
    if (distance === null) {
      return res.status(400).json({ error: 'Failed to calculate delivery distance' });
    }
    res.json({ distance_km: distance });
  } catch (error) {
    console.error('Error calculating delivery distance:', error);
    res.status(500).json({ error: 'Failed to calculate delivery distance' });
  }
});

// Create a new shop
router.post('/shop', async (req: Request, res: Response) => {
  try {
    const { name, contactPhone, shopAddress } = req.body;
    const shop = await shopService.createShop(name, contactPhone, shopAddress);
    if (!shop) {
      return res.status(400).json({ error: 'Failed to create shop' });
    }
    res.status(201).json(shop);
  } catch (error) {
    console.error('Error creating shop:', error);
    res.status(500).json({ error: 'Failed to create shop' });
  }
});

// Vendor registration endpoint
router.post('/shops/register', async (req: Request, res: Response) => {
  try {
    const registrationData = req.body;
    const result = await shopService.submitVendorRegistration(registrationData);
    
    if (!result) {
      return res.status(400).json({ error: 'Failed to submit vendor registration' });
    }
    
    res.status(201).json({
      success: true,
      message: 'Vendor registration submitted successfully',
      data: result
    });
  } catch (error) {
    console.error('Error submitting vendor registration:', error);
    res.status(500).json({ error: 'Failed to submit vendor registration' });
  }
});

// Get vendor category
router.get('/shop/:id/category', async (req: Request, res: Response) => {
  try {
    const shop = await shopService.getShopById(getParam(req.params.id));
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }
    res.json({ category_id: shop.category_id });
  } catch (error) {
    console.error('Error getting vendor category:', error);
    res.status(500).json({ error: 'Failed to get vendor category' });
  }
});

// Update vendor category
router.put('/shop/:id/category', async (req: Request, res: Response) => {
  try {
    const { categoryId } = req.body;
    const success = await shopService.setShopCategory(getParam(req.params.id), categoryId);
    if (!success) {
      return res.status(400).json({ error: 'Failed to set vendor category' });
    }
    res.json({ success: true, message: 'Vendor category updated successfully' });
  } catch (error) {
    console.error('Error setting vendor category:', error);
    res.status(500).json({ error: 'Failed to set vendor category' });
  }
});

// Get all products for a shop
router.get('/shop/:id/products', async (req: Request, res: Response) => {
  try {
    const products = await shopService.getProducts(getParam(req.params.id));
    res.json(products);
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// Create a new product
router.post('/shop/:id/products', async (req: Request, res: Response) => {
  try {
    const productData = {
      ...req.body,
      merchant_id: getParam(req.params.id)
    };
    const product = await shopService.createProduct(productData);
    if (!product) {
      return res.status(400).json({ error: 'Failed to create product' });
    }
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update a product
router.put('/shop/:id/products/:productId', async (req: Request, res: Response) => {
  try {
    const product = await shopService.updateProduct(getParam(req.params.productId), req.body);
    if (!product) {
      return res.status(400).json({ error: 'Failed to update product' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete a product
router.delete('/shop/:id/products/:productId', async (req: Request, res: Response) => {
  try {
    const success = await shopService.deleteProduct(getParam(req.params.productId));
    if (!success) {
      return res.status(400).json({ error: 'Failed to delete product' });
    }
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get a single product
router.get('/shop/:id/products/:productId', async (req: Request, res: Response) => {
  try {
    const products = await shopService.getProducts(getParam(req.params.id));
    const product = products.find(p => p.id === getParam(req.params.productId));
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Get product variants
router.get('/shop/:id/products/:productId/variants', async (req: Request, res: Response) => {
  try {
    const variants = await shopService.getProductVariants(getParam(req.params.productId));
    res.json(variants);
  } catch (error) {
    console.error('Error getting product variants:', error);
    res.status(500).json({ error: 'Failed to get product variants' });
  }
});

export default router;

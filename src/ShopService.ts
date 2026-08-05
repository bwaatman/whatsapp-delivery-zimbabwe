import { supabase } from './database';

// Import WhatsApp bot service for sending notifications
let whatsappBotService: any = null;

// Function to set the WhatsApp bot service instance
export function setWhatsAppBotService(service: any) {
  whatsappBotService = service;
}

export interface Shop {
  id: string;
  name: string;
  contact_phone: string;
  shop_location?: string; // PostGIS geometry
  shop_address?: string;
  operating_hours?: any;
  is_open: boolean;
  active: boolean;
  registration_status?: 'pending' | 'approved' | 'rejected' | 'suspended';
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  business_license_number?: string;
  business_description?: string;
  category_id?: string;
  password?: string;
  registration_data?: any;
  is_temporarily_offline?: boolean;
  offline_reason?: string;
  offline_since?: string;
  location_metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id?: string;
  merchant_id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  is_available: boolean;
  preparation_time_minutes: number;
  delivery_time?: number;
  delivery_time_unit?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  name: string;
  price_adjustment: number;
  description?: string;
}

export interface ProductImage {
  id?: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at?: string;
}

export interface ShopOrder {
  id: string;
  customer_phone: string;
  status: string;
  order_details?: string;
  delivery_location?: string;
  created_at: string;
  shop_confirmed_at?: string;
  ready_for_pickup_at?: string;
  assigned_driver_id?: string;
  estimated_delivery_time?: string;
}

export interface ShopDashboardSummary {
  shop_id: string;
  shop_name: string;
  pending_orders: number;
  confirmed_orders: number;
  preparing_orders: number;
  ready_orders: number;
  assigned_orders: number;
  out_for_delivery_orders: number;
  delivered_orders: number;
  today_orders: number;
}

export interface NearbyVendor {
  id: string;
  name: string;
  contact_phone: string;
  shop_location?: string;
  shop_address?: string;
  category_id?: string;
  category_name?: string;
  category_icon?: string;
  service_radius_km?: number;
  effective_radius_km?: number;
  distance_km?: number;
  is_open: boolean;
  registration_status?: string;
}

export interface CategoryWithVendors {
  category_id: string;
  category_name: string;
  category_icon: string;
  default_delivery_radius_km: number;
  vendor_count: number;
  vendors: NearbyVendor[];
}

export class ShopService {
  async getShopById(shopId: string): Promise<Shop | null> {
    try {
      console.log('🏪 Getting shop by ID:', shopId);

      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) {
        console.error('❌ Error getting shop:', error);
        return null;
      }

      console.log('✅ Shop retrieved successfully');
      return data as Shop;
    } catch (error) {
      console.error('❌ Exception in getShopById:', error);
      return null;
    }
  }

  async getShopByPhone(phone: string): Promise<Shop | null> {
    try {
      console.log('🏪 Getting shop by phone:', phone);

      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .eq('contact_phone', phone)
        .single();

      if (error) {
        console.error('❌ Error getting shop by phone:', error);
        return null;
      }

      console.log('✅ Shop retrieved successfully');
      return data as Shop;
    } catch (error) {
      console.error('❌ Exception in getShopByPhone:', error);
      return null;
    }
  }

  async getShopOrders(shopId: string, statusFilter?: string): Promise<ShopOrder[]> {
    try {
      console.log('📋 Getting orders for shop:', shopId, 'Status filter:', statusFilter);

      const { data, error } = await supabase
        .rpc('get_shop_orders', {
          shop_id: shopId,
          status_filter: statusFilter || null
        });

      if (error) {
        console.error('❌ Error getting shop orders:', error);
        return [];
      }

      console.log(`✅ Retrieved ${data.length} orders for shop`);
      return data as ShopOrder[];
    } catch (error) {
      console.error('❌ Exception in getShopOrders:', error);
      return [];
    }
  }

  async getPendingOrders(shopId: string): Promise<ShopOrder[]> {
    return this.getShopOrders(shopId, 'pending');
  }

  async getConfirmedOrders(shopId: string): Promise<ShopOrder[]> {
    return this.getShopOrders(shopId, 'confirmed');
  }

  async getPreparingOrders(shopId: string): Promise<ShopOrder[]> {
    return this.getShopOrders(shopId, 'preparing');
  }

  async getReadyForPickupOrders(shopId: string): Promise<ShopOrder[]> {
    return this.getShopOrders(shopId, 'ready_for_pickup');
  }

  async getAssignedOrders(shopId: string): Promise<ShopOrder[]> {
    return this.getShopOrders(shopId, 'assigned');
  }

  async confirmOrder(orderId: string): Promise<boolean> {
    try {
      console.log('✅ Confirming order:', orderId);

      // Get order details before updating
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!order) {
        console.error('❌ Order not found:', orderId);
        return false;
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error confirming order:', error);
        return false;
      }

      console.log('✅ Order confirmed successfully');

      // Send WhatsApp notification to customer
      await this.sendOrderStatusNotification(order.customer_phone, orderId, 'confirmed');

      return true;
    } catch (error) {
      console.error('❌ Exception in confirmOrder:', error);
      return false;
    }
  }

  async startPreparingOrder(orderId: string): Promise<boolean> {
    try {
      console.log('👨‍🍳 Starting preparation for order:', orderId);

      // Get order details before updating
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!order) {
        console.error('❌ Order not found:', orderId);
        return false;
      }

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'preparing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error starting order preparation:', error);
        return false;
      }

      console.log('✅ Order preparation started successfully');
      console.log('📱 Attempting to send WhatsApp notification to:', order.customer_phone);

      // Send WhatsApp notification to customer
      await this.sendOrderStatusNotification(order.customer_phone, orderId, 'preparing');

      return true;
    } catch (error) {
      console.error('❌ Exception in startPreparingOrder:', error);
      return false;
    }
  }

  async markOrderReadyForPickup(orderId: string, estimatedDeliveryMinutes?: number): Promise<boolean> {
    try {
      console.log('📦 Marking order as ready for pickup:', orderId);

      // Get order details before updating
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (!order) {
        console.error('❌ Order not found:', orderId);
        return false;
      }

      const updateData: any = {
        status: 'ready_for_pickup',
        updated_at: new Date().toISOString()
      };

      if (estimatedDeliveryMinutes) {
        const estimatedTime = new Date();
        estimatedTime.setMinutes(estimatedTime.getMinutes() + estimatedDeliveryMinutes);
        updateData.estimated_delivery_time = estimatedTime.toISOString();
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error marking order as ready:', error);
        return false;
      }

      console.log('✅ Order marked as ready for pickup successfully');
      console.log('📱 Attempting to send WhatsApp notification to:', order.customer_phone);

      // Send WhatsApp notification to customer
      await this.sendOrderStatusNotification(order.customer_phone, orderId, 'ready_for_pickup');

      return true;
    } catch (error) {
      console.error('❌ Exception in markOrderReadyForPickup:', error);
      return false;
    }
  }

  async updateShopLocation(shopId: string, latitude: number, longitude: number, address?: string, accuracy?: number, timestamp?: string): Promise<boolean> {
    try {
      console.log('📍 Updating shop location...');
      console.log('Shop ID:', shopId);
      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);
      console.log('Accuracy:', accuracy);
      console.log('Timestamp:', timestamp);

      // Get platform config for GPS accuracy validation
      const { OrderEconomicsService } = await import('./OrderEconomicsService');
      const orderEconomicsService = new OrderEconomicsService();
      const config = await orderEconomicsService.getPlatformConfig();

      // Validate GPS accuracy if provided
      if (accuracy !== undefined && accuracy > config.max_gps_accuracy_meters) {
        console.warn(`⚠️ GPS accuracy ${accuracy}m exceeds maximum ${config.max_gps_accuracy_meters}m - rejecting update`);
        return false;
      }

      // Use Supabase RPC to properly handle PostGIS geometry
      const { data, error } = await supabase.rpc('update_shop_location', {
        p_shop_id: shopId,
        p_latitude: latitude,
        p_longitude: longitude,
        p_address: address || null,
        p_accuracy: accuracy || null,
        p_timestamp: timestamp || new Date().toISOString()
      });

      if (error) {
        console.error('❌ Error updating shop location:', error);
        return false;
      }

      // Log the location update event
      await this.logLocationEvent(shopId, 'gps_updated', `Location updated with accuracy ${accuracy || 'unknown'}m`);

      // Check location health after successful update
      await this.checkShopLocationHealth(shopId);

      console.log('✅ Shop location updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in updateShopLocation:', error);
      return false;
    }
  }

  async updateShopOperatingHours(shopId: string, operatingHours: any): Promise<boolean> {
    try {
      console.log('🕐 Updating shop operating hours...');

      const { data, error } = await supabase
        .from('merchants')
        .update({
          operating_hours: operatingHours,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating operating hours:', error);
        return false;
      }

      console.log('✅ Operating hours updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in updateShopOperatingHours:', error);
      return false;
    }
  }

  async toggleShopStatus(shopId: string, isOpen: boolean): Promise<boolean> {
    try {
      console.log('🔄 Toggling shop status:', isOpen ? 'OPEN' : 'CLOSED');

      const { data, error } = await supabase
        .from('merchants')
        .update({
          is_open: isOpen,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error toggling shop status:', error);
        return false;
      }

      console.log('✅ Shop status toggled successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in toggleShopStatus:', error);
      return false;
    }
  }

  /**
   * Check and update shop location health
   * Marks shops as temporarily offline if location is stale
   * Restores shops to open if location is fresh again
   */
  async checkShopLocationHealth(shopId: string): Promise<void> {
    try {
      // Get platform config for stale timeout
      const { OrderEconomicsService } = await import('./OrderEconomicsService');
      const orderEconomicsService = new OrderEconomicsService();
      const config = await orderEconomicsService.getPlatformConfig();
      const staleTimeoutMinutes = config.gps_stale_timeout_minutes;

      // Get shop details
      const { data: shop, error: shopError } = await supabase
        .from('merchants')
        .select('id, is_open, location_metadata, is_temporarily_offline, updated_at')
        .eq('id', shopId)
        .single();

      if (shopError || !shop) {
        console.error('❌ Error fetching shop for health check:', shopError);
        return;
      }

      // Only check health if shop is marked as open
      if (!shop.is_open) {
        return;
      }

      // Parse location metadata
      const locationMetadata = shop.location_metadata ? JSON.parse(shop.location_metadata) : null;
      const lastUpdated = locationMetadata?.timestamp ? new Date(locationMetadata.timestamp) : null;
      const now = new Date();

      if (!lastUpdated) {
        console.warn(`⚠️ Shop ${shopId} has no location metadata - marking as temporarily offline`);
        await this.markShopTemporarilyOffline(shopId, 'No location data available');
        return;
      }

      const minutesSinceUpdate = (now.getTime() - lastUpdated.getTime()) / 60000;

      if (minutesSinceUpdate > staleTimeoutMinutes) {
        console.warn(`⚠️ Shop ${shopId} location is stale (${minutesSinceUpdate.toFixed(0)}m > ${staleTimeoutMinutes}m) - marking as temporarily offline`);
        await this.markShopTemporarilyOffline(shopId, `Location stale for ${minutesSinceUpdate.toFixed(0)} minutes`);
      } else {
        // Location is fresh - if shop was temporarily offline, restore it
        if (shop.is_temporarily_offline) {
          console.log(`✅ Shop ${shopId} location is fresh - restoring to open`);
          await this.restoreShopFromOffline(shopId);
        }
      }
    } catch (error) {
      console.error('❌ Exception in checkShopLocationHealth:', error);
    }
  }

  /**
   * Mark a shop as temporarily offline due to stale location
   */
  async markShopTemporarilyOffline(shopId: string, reason: string): Promise<boolean> {
    try {
      console.log(`🔴 Marking shop ${shopId} as temporarily offline: ${reason}`);

      const { error } = await supabase
        .from('merchants')
        .update({
          is_temporarily_offline: true,
          offline_reason: reason,
          offline_since: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId);

      if (error) {
        console.error('❌ Error marking shop as temporarily offline:', error);
        return false;
      }

      // Log the event
      await this.logLocationEvent(shopId, 'shop_offline', reason);

      console.log('✅ Shop marked as temporarily offline');
      return true;
    } catch (error) {
      console.error('❌ Exception in markShopTemporarilyOffline:', error);
      return false;
    }
  }

  /**
   * Restore a shop from temporarily offline to open
   */
  async restoreShopFromOffline(shopId: string): Promise<boolean> {
    try {
      console.log(`🟢 Restoring shop ${shopId} from temporarily offline to open`);

      const { error } = await supabase
        .from('merchants')
        .update({
          is_temporarily_offline: false,
          offline_reason: null,
          offline_since: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId);

      if (error) {
        console.error('❌ Error restoring shop from offline:', error);
        return false;
      }

      // Log the event
      await this.logLocationEvent(shopId, 'shop_restored', 'Location restored');

      console.log('✅ Shop restored from temporarily offline');
      return true;
    } catch (error) {
      console.error('❌ Exception in restoreShopFromOffline:', error);
      return false;
    }
  }

  /**
   * Log a location-related event for audit purposes
   */
  async logLocationEvent(shopId: string, eventType: string, details: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('location_audit_log')
        .insert({
          entity_id: shopId,
          entity_type: 'shop',
          event_type: eventType,
          details: details,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error logging location event:', error);
      }
    } catch (error) {
      console.error('❌ Exception in logLocationEvent:', error);
    }
  }

  async getShopDashboardSummary(shopId: string): Promise<ShopDashboardSummary | null> {
    try {
      console.log('📊 Getting shop dashboard summary for:', shopId);

      const { data, error } = await supabase
        .from('shop_dashboard_summary')
        .select('*')
        .eq('shop_id', shopId)
        .single();

      if (error) {
        console.error('❌ Error getting dashboard summary:', error);
        return null;
      }

      console.log('✅ Dashboard summary retrieved successfully');
      return data as ShopDashboardSummary;
    } catch (error) {
      console.error('❌ Exception in getShopDashboardSummary:', error);
      return null;
    }
  }

  async getOrderDeliveryDistance(orderId: string): Promise<number | null> {
    try {
      console.log('📏 Calculating delivery distance for order:', orderId);

      const { data, error } = await supabase
        .rpc('calculate_delivery_distance', {
          order_id: orderId
        });

      if (error) {
        console.error('❌ Error calculating delivery distance:', error);
        return null;
      }

      console.log(`✅ Delivery distance: ${data} km`);
      return data as number;
    } catch (error) {
      console.error('❌ Exception in getOrderDeliveryDistance:', error);
      return null;
    }
  }

  async createShop(name: string, contactPhone: string, shopAddress?: string): Promise<Shop | null> {
    try {
      console.log('🏪 Creating new shop...');

      const newShop: any = {
        name: name,
        contact_phone: contactPhone,
        active: true,
        is_open: true,
        registration_status: 'pending'
      };

      if (shopAddress) {
        newShop.shop_address = shopAddress;
      }

      const { data, error } = await supabase
        .from('merchants')
        .insert(newShop)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating shop:', error);
        return null;
      }

      console.log('✅ Shop created successfully');
      return data as Shop;
    } catch (error) {
      console.error('❌ Exception in createShop:', error);
      return null;
    }
  }

  // Product Management Methods

  async createProduct(product: Product): Promise<Product | null> {
    try {
      console.log('📦 Creating new product...');

      // Extract variants from product before insertion
      const variants = product.variants || [];
      const { variants: _, ...productData } = product;

      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating product:', error);
        return null;
      }

      // Insert variants if provided
      if (variants.length > 0) {
        for (const variant of variants) {
          await supabase
            .from('product_variants')
            .insert({
              product_id: data.id,
              name: variant.name,
              price_adjustment: variant.price_adjustment || 0,
              description: variant.description || null,
              is_available: true
            });
        }
      }

      console.log('✅ Product created successfully');
      return data as Product;
    } catch (error) {
      console.error('❌ Exception in createProduct:', error);
      return null;
    }
  }

  async getProducts(merchantId: string): Promise<Product[]> {
    try {
      console.log('📦 Getting products for merchant:', merchantId);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting products:', error);
        return [];
      }

      console.log(`✅ Retrieved ${data.length} products`);
      return data as Product[];
    } catch (error) {
      console.error('❌ Exception in getProducts:', error);
      return [];
    }
  }

  async getProduct(productId: string): Promise<Product | null> {
    try {
      console.log('📦 Getting product:', productId);

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) {
        console.error('❌ Error getting product:', error);
        return null;
      }

      console.log('✅ Product retrieved successfully');
      return data as Product;
    } catch (error) {
      console.error('❌ Exception in getProduct:', error);
      return null;
    }
  }

  async updateProduct(productId: string, updates: Partial<Product>): Promise<boolean> {
    try {
      console.log('📦 Updating product:', productId);

      // Extract variants from updates before updating the product
      const variants = updates.variants;
      const { variants: _, ...productUpdates } = updates;

      const { data, error } = await supabase
        .from('products')
        .update({
          ...productUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating product:', error);
        return false;
      }

      // Handle variants if provided
      if (variants && Array.isArray(variants)) {
        // Delete existing variants
        await supabase
          .from('product_variants')
          .delete()
          .eq('product_id', productId);

        // Insert new variants
        for (const variant of variants) {
          await supabase
            .from('product_variants')
            .insert({
              product_id: productId,
              name: variant.name,
              price_adjustment: variant.price_adjustment || 0,
              description: variant.description || null,
              is_available: true
            });
        }
      }

      console.log('✅ Product updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in updateProduct:', error);
      return false;
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting product:', productId);

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('❌ Error deleting product:', error);
        return false;
      }

      console.log('✅ Product deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in deleteProduct:', error);
      return false;
    }
  }

  async getProductVariants(productId: string): Promise<any[]> {
    try {
      console.log('📦 Getting variants for product:', productId);

      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('name');

      if (error) {
        console.error('❌ Error getting product variants:', error);
        return [];
      }

      console.log(`✅ Retrieved ${data.length} variants`);
      return data || [];
    } catch (error) {
      console.error('❌ Exception in getProductVariants:', error);
      return [];
    }
  }

  async addProductImage(productImage: ProductImage): Promise<ProductImage | null> {
    try {
      console.log('🖼️ Adding product image...');

      const { data, error } = await supabase
        .from('product_images')
        .insert(productImage)
        .select()
        .single();

      if (error) {
        console.error('❌ Error adding product image:', error);
        return null;
      }

      console.log('✅ Product image added successfully');
      return data as ProductImage;
    } catch (error) {
      console.error('❌ Exception in addProductImage:', error);
      return null;
    }
  }

  async getProductImages(productId: string): Promise<ProductImage[]> {
    try {
      console.log('🖼️ Getting product images:', productId);

      const { data, error } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('❌ Error getting product images:', error);
        return [];
      }

      console.log(`✅ Retrieved ${data.length} product images`);
      return data as ProductImage[];
    } catch (error) {
      console.error('❌ Exception in getProductImages:', error);
      return [];
    }
  }

  async deleteProductImage(imageId: string): Promise<boolean> {
    try {
      console.log('🗑️ Deleting product image:', imageId);

      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('❌ Error deleting product image:', error);
        return false;
      }

      console.log('✅ Product image deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in deleteProductImage:', error);
      return false;
    }
  }

  async setPrimaryProductImage(productId: string, imageId: string): Promise<boolean> {
    try {
      console.log('⭐ Setting primary product image:', imageId);

      // First, remove primary status from all images of this product
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId);

      // Then set the new primary image
      const { error } = await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId);

      if (error) {
        console.error('❌ Error setting primary product image:', error);
        return false;
      }

      console.log('✅ Primary product image set successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in setPrimaryProductImage:', error);
      return false;
    }
  }

  async getProductsWithImages(merchantId: string): Promise<any[]> {
    try {
      console.log('📦 Getting products with images for merchant:', merchantId);

      const { data, error } = await supabase
        .from('vendor_products_with_images')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting products with images:', error);
        return [];
      }

      console.log(`✅ Retrieved ${data.length} products with images`);
      return data;
    } catch (error) {
      console.error('❌ Exception in getProductsWithImages:', error);
      return [];
    }
  }

  async setShopCategory(shopId: string, categoryId: string): Promise<boolean> {
    try {
      console.log(`🔄 Setting shop ${shopId} category to ${categoryId}...`);

      const { error } = await supabase
        .from('merchants')
        .update({ category_id: categoryId })
        .eq('id', shopId);

      if (error) {
        console.error('❌ Error setting shop category:', error);
        return false;
      }

      console.log('✅ Shop category updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in setShopCategory:', error);
      return false;
    }
  }

  async submitVendorRegistration(registrationData: any): Promise<any> {
    try {
      console.log('📝 Submitting vendor registration...');

      // First create the merchant
      const merchant = await this.createShop(
        registrationData.business_name,
        registrationData.business_phone,
        registrationData.shop_address
      );

      if (!merchant) {
        console.error('❌ Failed to create merchant during registration');
        return null;
      }

      // Then create the registration request with document references
      const { data, error } = await supabase
        .from('vendor_registration_requests')
        .insert({
          merchant_id: merchant.id,
          business_name: registrationData.business_name,
          business_address: registrationData.business_address,
          business_phone: registrationData.business_phone,
          password: registrationData.password || null,
          business_email: registrationData.business_email,
          business_license_number: registrationData.business_license_number,
          tax_id: registrationData.tax_id,
          business_description: registrationData.business_description,
          operating_hours: registrationData.operating_hours,
          shop_location: registrationData.shop_location,
          shop_address: registrationData.shop_address,
          // Registration type (individual vs registered business)
          registration_type: registrationData.registration_type || 'individual',
          // Individual vendor documents
          national_id_doc_id: registrationData.national_id_doc_id,
          proof_of_address_doc_id: registrationData.proof_of_address_doc_id,
          // Registered business documents
          certificate_of_incorporation_doc_id: registrationData.certificate_of_incorporation_doc_id,
          tax_number: registrationData.tax_number,
          vat_number: registrationData.vat_number,
          business_licence_doc_id: registrationData.business_licence_doc_id,
          trading_licence_doc_id: registrationData.trading_licence_doc_id,
          // Business photos (required for all)
          shop_front_photo_doc_id: registrationData.shop_front_photo_doc_id,
          interior_photo_doc_id: registrationData.interior_photo_doc_id,
          // Optional business area photos
          kitchen_photo_doc_id: registrationData.kitchen_photo_doc_id,
          storage_photo_doc_id: registrationData.storage_photo_doc_id,
          // Food vendor optional documents
          health_certificate_doc_id: registrationData.health_certificate_doc_id,
          food_handling_permit_doc_id: registrationData.food_handling_permit_doc_id,
          restaurant_licence_doc_id: registrationData.restaurant_licence_doc_id,
          // Verification status
          verification_status: 'submitted',
          registration_data: registrationData,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating registration request:', error);
        return null;
      }

      console.log('✅ Vendor registration submitted successfully');
      return { merchant, registration_request: data };
    } catch (error) {
      console.error('❌ Exception in submitVendorRegistration:', error);
      return null;
    }
  }

  // Vendor Discovery Methods

  async findNearbyVendors(customerLat: number, customerLng: number, categoryId?: string): Promise<NearbyVendor[]> {
    try {
      console.log('🔍 Finding nearby vendors for location:', customerLat, customerLng, 'Category:', categoryId || 'All');

      // Build the query with PostGIS filtering
      let query = supabase
        .from('merchants')
        .select(`
          id,
          name,
          contact_phone,
          shop_location,
          shop_address,
          category_id,
          service_radius_km,
          is_open,
          registration_status,
          business_categories!inner (
            id,
            name,
            icon,
            default_delivery_radius_km
          )
        `)
        .eq('registration_status', 'approved')
        .eq('active', true)
        .eq('is_open', true)
        .not('shop_location', 'is', null);

      // Filter by category if provided
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching vendors:', error);
        return [];
      }

      // Filter by distance and radius using PostGIS
      const nearbyVendors: NearbyVendor[] = [];

      for (const merchant of data) {
        const category = Array.isArray(merchant.business_categories) ? merchant.business_categories[0] : merchant.business_categories;
        const categoryRadius = category.default_delivery_radius_km;
        const vendorRadius = merchant.service_radius_km;

        // Effective radius is MIN(category default, vendor radius)
        // If vendor radius is NULL, use category default
        const effectiveRadius = vendorRadius !== null && vendorRadius !== undefined
          ? Math.min(categoryRadius, vendorRadius)
          : categoryRadius;

        // Calculate distance using PostGIS ST_DistanceSphere
        const { data: distanceData, error: distanceError } = await supabase.rpc('calculate_distance', {
          lat1: customerLat,
          lng1: customerLng,
          lat2: null, // Will be extracted from shop_location
          lng2: null  // Will be extracted from shop_location
        });

        // Manual distance calculation using ST_DistanceSphere
        const distanceQuery = `
          SELECT ST_DistanceSphere(
            ST_SetSRID(ST_MakePoint($1, $2), 4326),
            shop_location
          ) / 1000 as distance_km
          FROM merchants
          WHERE id = $3
        `;

        const { data: distanceResult, error: distanceCalcError } = await supabase
          .rpc('calculate_distance_between_points', {
            point1_lat: customerLat,
            point1_lng: customerLng,
            merchant_id: merchant.id
          });

        // Use direct PostGIS query for distance calculation
        const { data: shopData } = await supabase
          .from('merchants')
          .select('shop_location')
          .eq('id', merchant.id)
          .single();

        if (!shopData || !shopData.shop_location) {
          console.warn('⚠️ Shop location missing for vendor:', merchant.id);
          continue;
        }

        // Calculate distance using PostGIS
        const distanceKm = await this.calculateDistanceBetweenPoints(
          customerLat,
          customerLng,
          shopData.shop_location
        );

        if (distanceKm === null) {
          console.warn('⚠️ Could not calculate distance for vendor:', merchant.id);
          continue;
        }

        // Check if vendor is within effective radius
        if (distanceKm <= effectiveRadius) {
          nearbyVendors.push({
            id: merchant.id,
            name: merchant.name,
            contact_phone: merchant.contact_phone,
            shop_location: merchant.shop_location,
            shop_address: merchant.shop_address,
            category_id: merchant.category_id,
            category_name: category.name,
            category_icon: category.icon,
            service_radius_km: merchant.service_radius_km,
            effective_radius_km: effectiveRadius,
            distance_km: distanceKm,
            is_open: merchant.is_open,
            registration_status: merchant.registration_status
          });
        }
      }

      console.log(`✅ Found ${nearbyVendors.length} nearby vendors`);
      return nearbyVendors.sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));
    } catch (error) {
      console.error('❌ Exception in findNearbyVendors:', error);
      return [];
    }
  }

  private async calculateDistanceBetweenPoints(lat: number, lng: number, shopLocation: any): Promise<number | null> {
    try {
      // Use PostGIS ST_DistanceSphere for accurate distance calculation
      const { data, error } = await supabase
        .rpc('calculate_distance_from_point', {
          lat: lat,
          lng: lng,
          shop_location: shopLocation
        });

      if (error) {
        console.error('❌ Error calculating distance:', error);
        return null;
      }

      return data as number;
    } catch (error) {
      console.error('❌ Exception in calculateDistanceBetweenPoints:', error);
      return null;
    }
  }

  async getCategoriesWithNearbyVendors(customerLat: number, customerLng: number): Promise<CategoryWithVendors[]> {
    try {
      console.log('🔍 Getting categories with nearby vendors for location:', customerLat, customerLng);

      // Get all nearby vendors first
      const nearbyVendors = await this.findNearbyVendors(customerLat, customerLng);

      // Group by category
      const categoryMap = new Map<string, CategoryWithVendors>();

      for (const vendor of nearbyVendors) {
        if (!vendor.category_id || !vendor.category_name) continue;

        if (!categoryMap.has(vendor.category_id)) {
          categoryMap.set(vendor.category_id, {
            category_id: vendor.category_id,
            category_name: vendor.category_name,
            category_icon: vendor.category_icon || '📦',
            default_delivery_radius_km: vendor.effective_radius_km || 20,
            vendor_count: 0,
            vendors: []
          });
        }

        const category = categoryMap.get(vendor.category_id)!;
        category.vendors.push(vendor);
        category.vendor_count++;
      }

      // Convert to array and sort by vendor count
      const categories = Array.from(categoryMap.values())
        .sort((a, b) => b.vendor_count - a.vendor_count);

      console.log(`✅ Found ${categories.length} categories with nearby vendors`);
      return categories;
    } catch (error) {
      console.error('❌ Exception in getCategoriesWithNearbyVendors:', error);
      return [];
    }
  }

  async updateVendorServiceRadius(shopId: string, serviceRadiusKm: number): Promise<boolean> {
    try {
      console.log('🏪 Updating service radius for shop:', shopId, 'Radius:', serviceRadiusKm);

      // Get shop's category to validate radius doesn't exceed category maximum
      const shop = await this.getShopById(shopId);
      if (!shop || !shop.category_id) {
        console.error('❌ Shop not found or has no category');
        return false;
      }

      // Get category default radius
      const { data: category, error: categoryError } = await supabase
        .from('business_categories')
        .select('default_delivery_radius_km')
        .eq('id', shop.category_id)
        .single();

      if (categoryError || !category) {
        console.error('❌ Error fetching category:', categoryError);
        return false;
      }

      // Validate that vendor radius doesn't exceed category maximum
      if (serviceRadiusKm > category.default_delivery_radius_km) {
        console.error(`❌ Service radius ${serviceRadiusKm} km exceeds category maximum ${category.default_delivery_radius_km} km`);
        return false;
      }

      // Update service radius
      const { error } = await supabase
        .from('merchants')
        .update({ service_radius_km: serviceRadiusKm })
        .eq('id', shopId);

      if (error) {
        console.error('❌ Error updating service radius:', error);
        return false;
      }

      console.log('✅ Service radius updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in updateVendorServiceRadius:', error);
      return false;
    }
  }

  async getVendorServiceRadiusInfo(shopId: string): Promise<any> {
    try {
      console.log('🏪 Getting service radius info for shop:', shopId);

      const { data, error } = await supabase
        .from('merchants')
        .select(`
          id,
          service_radius_km,
          category_id,
          business_categories!inner (
            id,
            name,
            default_delivery_radius_km
          )
        `)
        .eq('id', shopId)
        .single();

      if (error) {
        console.error('❌ Error fetching service radius info:', error);
        return null;
      }

      const category = Array.isArray(data.business_categories) ? data.business_categories[0] : data.business_categories;
      const vendorRadius = data.service_radius_km;
      const categoryRadius = category.default_delivery_radius_km;

      // Calculate effective radius
      const effectiveRadius = vendorRadius !== null && vendorRadius !== undefined
        ? Math.min(categoryRadius, vendorRadius)
        : categoryRadius;

      return {
        shop_id: data.id,
        service_radius_km: vendorRadius,
        category_id: data.category_id,
        category_name: category.name,
        category_default_radius_km: categoryRadius,
        effective_radius_km: effectiveRadius
      };
    } catch (error) {
      console.error('❌ Exception in getVendorServiceRadiusInfo:', error);
      return null;
    }
  }

  // Send WhatsApp notification to customer when order status changes
  private async sendOrderStatusNotification(customerPhone: string, orderId: string, status: string): Promise<void> {
    try {
      console.log('📱 Sending order status notification to customer:', customerPhone, 'Status:', status);

      if (!whatsappBotService) {
        console.warn('⚠️ WhatsApp bot service not available, skipping notification');
        return;
      }

      console.log('✅ WhatsApp bot service is available');

      // Format the phone number for WhatsApp
      const formattedPhone = customerPhone.startsWith('+') ? customerPhone : `+${customerPhone}`;
      console.log('📱 Formatted phone number:', formattedPhone);

      // Create status message based on order status
      let statusMessage = '';
      const shortOrderId = orderId.substring(0, 8);

      switch (status) {
        case 'confirmed':
          statusMessage = `✅ *Order Confirmed!*\n\nYour order #${shortOrderId} has been confirmed by the vendor.\n\nYour order is now being prepared.\n\nType "track ${shortOrderId}" to check your order status.`;
          break;
        case 'preparing':
          statusMessage = `👨‍🍳 *Order In Preparation*\n\nYour order #${shortOrderId} is currently being prepared.\n\nWe'll notify you when it's ready for pickup.\n\nType "track ${shortOrderId}" to check your order status.`;
          break;
        case 'ready_for_pickup':
          statusMessage = `📦 *Order Ready for Pickup!*\n\nYour order #${shortOrderId} is ready for pickup.\n\nA driver will be assigned shortly.\n\nType "track ${shortOrderId}" to check your order status.`;
          break;
        case 'assigned':
          statusMessage = `🚗 *Driver Assigned!*\n\nA driver has been assigned to your order #${shortOrderId}.\n\nYour order is on its way!\n\nType "track ${shortOrderId}" to check your order status.`;
          break;
        case 'out_for_delivery':
          statusMessage = `🚚 *Order Out for Delivery!*\n\nYour order #${shortOrderId} is out for delivery.\n\nEstimated arrival time will be provided by the driver.\n\nType "track ${shortOrderId}" to check your order status.`;
          break;
        case 'delivered':
          statusMessage = `🎉 *Order Delivered!*\n\nYour order #${shortOrderId} has been delivered.\n\nThank you for your order! We hope you enjoy it.\n\nType "track ${shortOrderId}" to view your order details.`;
          break;
        default:
          statusMessage = `📋 *Order Status Update*\n\nYour order #${shortOrderId} status has been updated to: ${status}\n\nType "track ${shortOrderId}" to check your order status.`;
      }

      console.log('📱 Message to send:', statusMessage);

      // Send the message via WhatsApp bot
      await whatsappBotService.sendMessageToCustomer(formattedPhone, statusMessage);

      console.log('✅ Order status notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending order status notification:', error);
    }
  }
}

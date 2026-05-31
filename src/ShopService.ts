import { supabase } from './database';

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
      return true;
    } catch (error) {
      console.error('❌ Exception in confirmOrder:', error);
      return false;
    }
  }

  async startPreparingOrder(orderId: string): Promise<boolean> {
    try {
      console.log('👨‍🍳 Starting preparation for order:', orderId);

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
      return true;
    } catch (error) {
      console.error('❌ Exception in startPreparingOrder:', error);
      return false;
    }
  }

  async markOrderReadyForPickup(orderId: string, estimatedDeliveryMinutes?: number): Promise<boolean> {
    try {
      console.log('📦 Marking order as ready for pickup:', orderId);

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
      return true;
    } catch (error) {
      console.error('❌ Exception in markOrderReadyForPickup:', error);
      return false;
    }
  }

  async updateShopLocation(shopId: string, latitude: number, longitude: number, address?: string): Promise<boolean> {
    try {
      console.log('📍 Updating shop location...');
      console.log('Shop ID:', shopId);
      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);

      const locationQuery = `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;

      const updateData: any = {
        shop_location: locationQuery,
        updated_at: new Date().toISOString()
      };

      if (address) {
        updateData.shop_address = address;
      }

      const { data, error } = await supabase
        .from('merchants')
        .update(updateData)
        .eq('id', shopId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating shop location:', error);
        return false;
      }

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

      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating product:', error);
        return null;
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

      const { data, error } = await supabase
        .from('products')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating product:', error);
        return false;
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

      // Then create the registration request
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
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopService = void 0;
const database_1 = require("./database");
class ShopService {
    async getShopById(shopId) {
        try {
            console.log('🏪 Getting shop by ID:', shopId);
            const { data, error } = await database_1.supabase
                .from('merchants')
                .select('*')
                .eq('id', shopId)
                .single();
            if (error) {
                console.error('❌ Error getting shop:', error);
                return null;
            }
            console.log('✅ Shop retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getShopById:', error);
            return null;
        }
    }
    async getShopByPhone(phone) {
        try {
            console.log('🏪 Getting shop by phone:', phone);
            const { data, error } = await database_1.supabase
                .from('merchants')
                .select('*')
                .eq('contact_phone', phone)
                .single();
            if (error) {
                console.error('❌ Error getting shop by phone:', error);
                return null;
            }
            console.log('✅ Shop retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getShopByPhone:', error);
            return null;
        }
    }
    async getShopOrders(shopId, statusFilter) {
        try {
            console.log('📋 Getting orders for shop:', shopId, 'Status filter:', statusFilter);
            const { data, error } = await database_1.supabase
                .rpc('get_shop_orders', {
                shop_id: shopId,
                status_filter: statusFilter || null
            });
            if (error) {
                console.error('❌ Error getting shop orders:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} orders for shop`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getShopOrders:', error);
            return [];
        }
    }
    async getPendingOrders(shopId) {
        return this.getShopOrders(shopId, 'pending');
    }
    async getConfirmedOrders(shopId) {
        return this.getShopOrders(shopId, 'confirmed');
    }
    async getPreparingOrders(shopId) {
        return this.getShopOrders(shopId, 'preparing');
    }
    async getReadyForPickupOrders(shopId) {
        return this.getShopOrders(shopId, 'ready_for_pickup');
    }
    async getAssignedOrders(shopId) {
        return this.getShopOrders(shopId, 'assigned');
    }
    async confirmOrder(orderId) {
        try {
            console.log('✅ Confirming order:', orderId);
            const { data, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in confirmOrder:', error);
            return false;
        }
    }
    async startPreparingOrder(orderId) {
        try {
            console.log('👨‍🍳 Starting preparation for order:', orderId);
            const { data, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in startPreparingOrder:', error);
            return false;
        }
    }
    async markOrderReadyForPickup(orderId, estimatedDeliveryMinutes) {
        try {
            console.log('📦 Marking order as ready for pickup:', orderId);
            const updateData = {
                status: 'ready_for_pickup',
                updated_at: new Date().toISOString()
            };
            if (estimatedDeliveryMinutes) {
                const estimatedTime = new Date();
                estimatedTime.setMinutes(estimatedTime.getMinutes() + estimatedDeliveryMinutes);
                updateData.estimated_delivery_time = estimatedTime.toISOString();
            }
            const { data, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in markOrderReadyForPickup:', error);
            return false;
        }
    }
    async updateShopLocation(shopId, latitude, longitude, address) {
        try {
            console.log('📍 Updating shop location...');
            console.log('Shop ID:', shopId);
            console.log('Latitude:', latitude);
            console.log('Longitude:', longitude);
            const locationQuery = `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
            const updateData = {
                shop_location: locationQuery,
                updated_at: new Date().toISOString()
            };
            if (address) {
                updateData.shop_address = address;
            }
            const { data, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in updateShopLocation:', error);
            return false;
        }
    }
    async updateShopOperatingHours(shopId, operatingHours) {
        try {
            console.log('🕐 Updating shop operating hours...');
            const { data, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in updateShopOperatingHours:', error);
            return false;
        }
    }
    async toggleShopStatus(shopId, isOpen) {
        try {
            console.log('🔄 Toggling shop status:', isOpen ? 'OPEN' : 'CLOSED');
            const { data, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in toggleShopStatus:', error);
            return false;
        }
    }
    async getShopDashboardSummary(shopId) {
        try {
            console.log('📊 Getting shop dashboard summary for:', shopId);
            const { data, error } = await database_1.supabase
                .from('shop_dashboard_summary')
                .select('*')
                .eq('shop_id', shopId)
                .single();
            if (error) {
                console.error('❌ Error getting dashboard summary:', error);
                return null;
            }
            console.log('✅ Dashboard summary retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getShopDashboardSummary:', error);
            return null;
        }
    }
    async getOrderDeliveryDistance(orderId) {
        try {
            console.log('📏 Calculating delivery distance for order:', orderId);
            const { data, error } = await database_1.supabase
                .rpc('calculate_delivery_distance', {
                order_id: orderId
            });
            if (error) {
                console.error('❌ Error calculating delivery distance:', error);
                return null;
            }
            console.log(`✅ Delivery distance: ${data} km`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getOrderDeliveryDistance:', error);
            return null;
        }
    }
    async createShop(name, contactPhone, shopAddress) {
        try {
            console.log('🏪 Creating new shop...');
            const newShop = {
                name: name,
                contact_phone: contactPhone,
                active: true,
                is_open: true,
                registration_status: 'pending'
            };
            if (shopAddress) {
                newShop.shop_address = shopAddress;
            }
            const { data, error } = await database_1.supabase
                .from('merchants')
                .insert(newShop)
                .select()
                .single();
            if (error) {
                console.error('❌ Error creating shop:', error);
                return null;
            }
            console.log('✅ Shop created successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in createShop:', error);
            return null;
        }
    }
    // Product Management Methods
    async createProduct(product) {
        try {
            console.log('📦 Creating new product...');
            const { data, error } = await database_1.supabase
                .from('products')
                .insert(product)
                .select()
                .single();
            if (error) {
                console.error('❌ Error creating product:', error);
                return null;
            }
            console.log('✅ Product created successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in createProduct:', error);
            return null;
        }
    }
    async getProducts(merchantId) {
        try {
            console.log('📦 Getting products for merchant:', merchantId);
            const { data, error } = await database_1.supabase
                .from('products')
                .select('*')
                .eq('merchant_id', merchantId)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Error getting products:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} products`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getProducts:', error);
            return [];
        }
    }
    async getProduct(productId) {
        try {
            console.log('📦 Getting product:', productId);
            const { data, error } = await database_1.supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();
            if (error) {
                console.error('❌ Error getting product:', error);
                return null;
            }
            console.log('✅ Product retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getProduct:', error);
            return null;
        }
    }
    async updateProduct(productId, updates) {
        try {
            console.log('📦 Updating product:', productId);
            const { data, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in updateProduct:', error);
            return false;
        }
    }
    async deleteProduct(productId) {
        try {
            console.log('🗑️ Deleting product:', productId);
            const { error } = await database_1.supabase
                .from('products')
                .delete()
                .eq('id', productId);
            if (error) {
                console.error('❌ Error deleting product:', error);
                return false;
            }
            console.log('✅ Product deleted successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in deleteProduct:', error);
            return false;
        }
    }
    async addProductImage(productImage) {
        try {
            console.log('🖼️ Adding product image...');
            const { data, error } = await database_1.supabase
                .from('product_images')
                .insert(productImage)
                .select()
                .single();
            if (error) {
                console.error('❌ Error adding product image:', error);
                return null;
            }
            console.log('✅ Product image added successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in addProductImage:', error);
            return null;
        }
    }
    async getProductImages(productId) {
        try {
            console.log('🖼️ Getting product images:', productId);
            const { data, error } = await database_1.supabase
                .from('product_images')
                .select('*')
                .eq('product_id', productId)
                .order('display_order', { ascending: true });
            if (error) {
                console.error('❌ Error getting product images:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} product images`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getProductImages:', error);
            return [];
        }
    }
    async deleteProductImage(imageId) {
        try {
            console.log('🗑️ Deleting product image:', imageId);
            const { error } = await database_1.supabase
                .from('product_images')
                .delete()
                .eq('id', imageId);
            if (error) {
                console.error('❌ Error deleting product image:', error);
                return false;
            }
            console.log('✅ Product image deleted successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in deleteProductImage:', error);
            return false;
        }
    }
    async setPrimaryProductImage(productId, imageId) {
        try {
            console.log('⭐ Setting primary product image:', imageId);
            // First, remove primary status from all images of this product
            await database_1.supabase
                .from('product_images')
                .update({ is_primary: false })
                .eq('product_id', productId);
            // Then set the new primary image
            const { error } = await database_1.supabase
                .from('product_images')
                .update({ is_primary: true })
                .eq('id', imageId);
            if (error) {
                console.error('❌ Error setting primary product image:', error);
                return false;
            }
            console.log('✅ Primary product image set successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in setPrimaryProductImage:', error);
            return false;
        }
    }
    async getProductsWithImages(merchantId) {
        try {
            console.log('📦 Getting products with images for merchant:', merchantId);
            const { data, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in getProductsWithImages:', error);
            return [];
        }
    }
    async setShopCategory(shopId, categoryId) {
        try {
            console.log(`🔄 Setting shop ${shopId} category to ${categoryId}...`);
            const { error } = await database_1.supabase
                .from('merchants')
                .update({ category_id: categoryId })
                .eq('id', shopId);
            if (error) {
                console.error('❌ Error setting shop category:', error);
                return false;
            }
            console.log('✅ Shop category updated successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in setShopCategory:', error);
            return false;
        }
    }
    async submitVendorRegistration(registrationData) {
        try {
            console.log('📝 Submitting vendor registration...');
            // First create the merchant
            const merchant = await this.createShop(registrationData.business_name, registrationData.business_phone, registrationData.shop_address);
            if (!merchant) {
                console.error('❌ Failed to create merchant during registration');
                return null;
            }
            // Then create the registration request
            const { data, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in submitVendorRegistration:', error);
            return null;
        }
    }
}
exports.ShopService = ShopService;
//# sourceMappingURL=ShopService.js.map
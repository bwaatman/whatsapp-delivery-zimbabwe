"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopService = void 0;
exports.setWhatsAppBotService = setWhatsAppBotService;
const database_1 = require("./database");
// Import WhatsApp bot service for sending notifications
let whatsappBotService = null;
// Function to set the WhatsApp bot service instance
function setWhatsAppBotService(service) {
    whatsappBotService = service;
}
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
            // Get order details before updating
            const { data: order } = await database_1.supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();
            if (!order) {
                console.error('❌ Order not found:', orderId);
                return false;
            }
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
            // Send WhatsApp notification to customer
            await this.sendOrderStatusNotification(order.customer_phone, orderId, 'confirmed');
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
            // Get order details before updating
            const { data: order } = await database_1.supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();
            if (!order) {
                console.error('❌ Order not found:', orderId);
                return false;
            }
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
            console.log('📱 Attempting to send WhatsApp notification to:', order.customer_phone);
            // Send WhatsApp notification to customer
            await this.sendOrderStatusNotification(order.customer_phone, orderId, 'preparing');
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
            // Get order details before updating
            const { data: order } = await database_1.supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();
            if (!order) {
                console.error('❌ Order not found:', orderId);
                return false;
            }
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
            console.log('📱 Attempting to send WhatsApp notification to:', order.customer_phone);
            // Send WhatsApp notification to customer
            await this.sendOrderStatusNotification(order.customer_phone, orderId, 'ready_for_pickup');
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
            // Extract variants from product before insertion
            const variants = product.variants || [];
            const { variants: _, ...productData } = product;
            const { data, error } = await database_1.supabase
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
                    await database_1.supabase
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
            // Extract variants from updates before updating the product
            const variants = updates.variants;
            const { variants: _, ...productUpdates } = updates;
            const { data, error } = await database_1.supabase
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
                await database_1.supabase
                    .from('product_variants')
                    .delete()
                    .eq('product_id', productId);
                // Insert new variants
                for (const variant of variants) {
                    await database_1.supabase
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
    async getProductVariants(productId) {
        try {
            console.log('📦 Getting variants for product:', productId);
            const { data, error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in getProductVariants:', error);
            return [];
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
    // Send WhatsApp notification to customer when order status changes
    async sendOrderStatusNotification(customerPhone, orderId, status) {
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
        }
        catch (error) {
            console.error('❌ Error sending order status notification:', error);
        }
    }
}
exports.ShopService = ShopService;
//# sourceMappingURL=ShopService.js.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverService = void 0;
exports.setWhatsAppBotService = setWhatsAppBotService;
const database_1 = require("./database");
const VehicleRestrictionService_1 = require("./VehicleRestrictionService");
// Import WhatsApp bot service for sending notifications
let whatsappBotService = null;
// Function to set the WhatsApp bot service instance
function setWhatsAppBotService(service) {
    whatsappBotService = service;
}
class DriverService {
    async getDriverById(driverId) {
        try {
            console.log('🚗 Getting driver by ID:', driverId);
            const { data, error } = await database_1.supabase
                .from('drivers')
                .select('*')
                .eq('id', driverId)
                .single();
            if (error) {
                console.error('❌ Error getting driver:', error);
                return null;
            }
            console.log('✅ Driver retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getDriverById:', error);
            return null;
        }
    }
    async getDriverByPhone(phone) {
        try {
            console.log('🚗 Getting driver by phone:', phone);
            const { data, error } = await database_1.supabase
                .from('drivers')
                .select('*')
                .eq('phone', phone)
                .single();
            if (error) {
                console.error('❌ Error getting driver by phone:', error);
                return null;
            }
            console.log('✅ Driver retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getDriverByPhone:', error);
            return null;
        }
    }
    async getAvailableOrders(driverId) {
        try {
            console.log('📋 Getting available orders for drivers...');
            const { data, error } = await database_1.supabase
                .from('orders')
                .select(`
          id,
          customer_phone,
          customer_name,
          order_details,
          delivery_location,
          merchants!inner (
            shop_location,
            shop_address,
            name,
            category_id
          ),
          created_at,
          status
        `)
                .in('status', ['confirmed', 'preparing', 'ready_for_pickup'])
                .is('assigned_driver_id', null)
                .not('delivery_location', 'is', null)
                .order('created_at', { ascending: true });
            if (error) {
                console.error('❌ Error getting available orders:', error);
                return [];
            }
            // Transform the data to match AvailableOrder interface
            const orders = data.map((order) => ({
                id: order.id,
                customer_phone: order.customer_phone,
                customer_name: order.customer_name,
                order_details: order.order_details,
                delivery_location: order.delivery_location,
                shop_location: order.merchants?.shop_location,
                shop_address: order.merchants?.shop_address,
                shop_name: order.merchants?.name,
                created_at: order.created_at,
                estimated_preparation_time: 30, // Default 30 minutes
                merchant_id: order.merchants?.category_id,
                status: order.status
            }));
            // If driverId is provided, filter orders based on vehicle eligibility
            if (driverId) {
                const vehicleRestrictionService = new VehicleRestrictionService_1.VehicleRestrictionService();
                const eligibleOrders = [];
                for (const order of orders) {
                    const isEligible = await vehicleRestrictionService.isDriverEligibleForOrder(driverId, order.shop_location, order.delivery_location, order.estimated_preparation_time || 30);
                    if (isEligible) {
                        eligibleOrders.push(order);
                    }
                    else {
                        console.log(`🚗 Order ${order.id} is not eligible for driver ${driverId} - filtering out`);
                    }
                }
                console.log(`✅ Retrieved ${eligibleOrders.length} eligible orders for driver ${driverId} (filtered from ${orders.length} total)`);
                return eligibleOrders;
            }
            console.log(`✅ Retrieved ${orders.length} available orders`);
            return orders;
        }
        catch (error) {
            console.error('❌ Exception in getAvailableOrders:', error);
            return [];
        }
    }
    async getDriverActiveDelivery(driverId) {
        try {
            console.log('📦 Getting active delivery for driver:', driverId);
            const { data, error } = await database_1.supabase
                .from('orders')
                .select(`
          id,
          customer_phone,
          order_details,
          delivery_location,
          merchants!inner (
            shop_location,
            shop_address,
            name
          ),
          status,
          updated_at,
          merchant_id
        `)
                .eq('assigned_driver_id', driverId)
                .in('status', ['assigned', 'out_for_delivery'])
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error) {
                console.error('❌ Error getting active delivery:', error);
                return null;
            }
            if (!data) {
                console.log('📭 No active delivery found');
                return null;
            }
            // Transform the data to match ActiveDelivery interface
            const delivery = {
                order_id: data.id,
                customer_phone: data.customer_phone,
                order_details: data.order_details,
                delivery_location: data.delivery_location,
                shop_location: data.merchants?.shop_location,
                shop_address: data.merchants?.shop_address,
                shop_name: data.merchants?.name,
                status: data.status,
                assigned_at: data.updated_at,
                merchant_id: data.merchant_id
            };
            console.log('✅ Active delivery retrieved successfully');
            return delivery;
        }
        catch (error) {
            console.error('❌ Exception in getDriverActiveDelivery:', error);
            return null;
        }
    }
    async acceptOrder(orderId, driverId, latitude, longitude) {
        try {
            console.log('✅ Driver accepting order:', orderId);
            // Update driver location if provided
            if (latitude !== undefined && longitude !== undefined) {
                console.log('📍 Updating driver location at order acceptance time');
                const locationSuccess = await this.updateDriverLocation(driverId, latitude, longitude);
                if (!locationSuccess) {
                    console.warn('⚠️ Failed to update driver location, but continuing with order acceptance');
                }
            }
            // Get order details before updating
            const { data: order } = await database_1.supabase
                .from('orders')
                .select(`
          *,
          merchants!inner (
            shop_location
          )
        `)
                .eq('id', orderId)
                .single();
            if (!order) {
                console.error('❌ Order not found:', orderId);
                return false;
            }
            // Check vehicle eligibility before accepting (this will use the updated location)
            const { VehicleRestrictionService } = await Promise.resolve().then(() => __importStar(require('./VehicleRestrictionService')));
            const vehicleRestrictionService = new VehicleRestrictionService();
            const isEligible = await vehicleRestrictionService.isDriverEligibleForOrder(driverId, order.merchants.shop_location, order.delivery_location, order.estimated_preparation_time || 30);
            if (!isEligible) {
                console.log(`❌ Driver ${driverId} is not eligible for order ${orderId} based on distance restrictions`);
                return false;
            }
            const { data, error } = await database_1.supabase
                .from('orders')
                .update({
                assigned_driver_id: driverId,
                status: 'assigned',
                updated_at: new Date().toISOString()
            })
                .eq('id', orderId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error accepting order:', error);
                return false;
            }
            // Mark driver as unavailable
            await this.setDriverAvailability(driverId, false);
            console.log('✅ Order accepted successfully');
            // Send WhatsApp notification to customer
            await this.sendOrderStatusNotification(order.customer_phone, orderId, 'assigned');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in acceptOrder:', error);
            return false;
        }
    }
    async startDelivery(orderId) {
        try {
            console.log('🚗 Starting delivery for order:', orderId);
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
                status: 'out_for_delivery',
                updated_at: new Date().toISOString()
            })
                .eq('id', orderId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error starting delivery:', error);
                return false;
            }
            console.log('✅ Delivery started successfully');
            // Send WhatsApp notification to customer
            await this.sendOrderStatusNotification(order.customer_phone, orderId, 'out_for_delivery');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in startDelivery:', error);
            return false;
        }
    }
    async completeDelivery(orderId, driverId) {
        try {
            console.log('✅ Completing delivery for order:', orderId);
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
                status: 'delivered',
                updated_at: new Date().toISOString()
            })
                .eq('id', orderId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error completing delivery:', error);
                return false;
            }
            // Process order completion to create wallet transactions
            if (data.merchant_id && data.assigned_driver_id) {
                const { OrderEconomicsService } = await Promise.resolve().then(() => __importStar(require('./OrderEconomicsService')));
                const orderEconomicsService = new OrderEconomicsService();
                await orderEconomicsService.processOrderCompletion(orderId, data.merchant_id, data.assigned_driver_id);
            }
            // Mark driver as available again
            await this.setDriverAvailability(driverId, true);
            console.log('✅ Delivery completed successfully');
            // Send WhatsApp notification to customer
            await this.sendOrderStatusNotification(order.customer_phone, orderId, 'delivered');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in completeDelivery:', error);
            return false;
        }
    }
    async updateDriverLocation(driverId, latitude, longitude) {
        try {
            console.log('📍 Updating driver location...');
            console.log('Driver ID:', driverId);
            console.log('Latitude:', latitude);
            console.log('Longitude:', longitude);
            const locationQuery = `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
            const { data, error } = await database_1.supabase
                .from('drivers')
                .update({
                current_location: locationQuery,
                updated_at: new Date().toISOString()
            })
                .eq('id', driverId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error updating driver location:', error);
                return false;
            }
            console.log('✅ Driver location updated successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in updateDriverLocation:', error);
            return false;
        }
    }
    async setDriverAvailability(driverId, isAvailable) {
        try {
            console.log('🔄 Setting driver availability:', isAvailable ? 'AVAILABLE' : 'UNAVAILABLE');
            const { data, error } = await database_1.supabase
                .from('drivers')
                .update({
                is_available: isAvailable,
                updated_at: new Date().toISOString()
            })
                .eq('id', driverId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error setting driver availability:', error);
                return false;
            }
            console.log('✅ Driver availability updated successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in setDriverAvailability:', error);
            return false;
        }
    }
    async setDriverCategory(driverId, categoryId) {
        try {
            console.log(`🔄 Setting driver ${driverId} category to ${categoryId}...`);
            const { error } = await database_1.supabase
                .from('drivers')
                .update({ category_id: categoryId })
                .eq('id', driverId);
            if (error) {
                console.error('❌ Error setting driver category:', error);
                return false;
            }
            console.log('✅ Driver category updated successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in setDriverCategory:', error);
            return false;
        }
    }
    async getDriverDashboardSummary(driverId) {
        try {
            console.log('📊 Getting driver dashboard summary for:', driverId);
            // Get driver info
            const { data: driver, error: driverError } = await database_1.supabase
                .from('drivers')
                .select('*')
                .eq('id', driverId)
                .single();
            if (driverError || !driver) {
                console.error('❌ Error getting driver:', driverError);
                return null;
            }
            // Get active deliveries count
            const { count: activeCount, error: activeError } = await database_1.supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_driver_id', driverId)
                .in('status', ['assigned', 'out_for_delivery']);
            if (activeError) {
                console.error('❌ Error getting active deliveries count:', activeError);
            }
            // Get today's deliveries count
            const { count: todayCount, error: todayError } = await database_1.supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('assigned_driver_id', driverId)
                .eq('status', 'delivered')
                .gte('updated_at', new Date().toISOString().split('T')[0]);
            if (todayError) {
                console.error('❌ Error getting today deliveries count:', todayError);
            }
            const summary = {
                driver_id: driver.id,
                driver_name: driver.name,
                is_available: driver.is_available,
                active_deliveries: activeCount || 0,
                today_deliveries: todayCount || 0,
                current_location: driver.current_location
            };
            console.log('✅ Driver dashboard summary retrieved successfully');
            return summary;
        }
        catch (error) {
            console.error('❌ Exception in getDriverDashboardSummary:', error);
            return null;
        }
    }
    async getDriverDeliveryHistory(driverId, limit = 10) {
        try {
            console.log('📜 Getting delivery history for driver:', driverId);
            const { data, error } = await database_1.supabase
                .from('orders')
                .select(`
          *,
          merchants!inner (
            name,
            shop_address
          )
        `)
                .eq('assigned_driver_id', driverId)
                .in('status', ['delivered', 'cancelled'])
                .order('updated_at', { ascending: false })
                .limit(limit);
            if (error) {
                console.error('❌ Error getting delivery history:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} deliveries from history`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getDriverDeliveryHistory:', error);
            return [];
        }
    }
    async createDriver(name, phone) {
        try {
            console.log('🚗 Creating new driver...');
            const { data, error } = await database_1.supabase
                .from('drivers')
                .insert({
                name: name,
                phone: phone,
                is_available: true,
                registration_status: 'pending'
            })
                .select()
                .single();
            if (error) {
                console.error('❌ Error creating driver:', error);
                return null;
            }
            console.log('✅ Driver created successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in createDriver:', error);
            return null;
        }
    }
    async submitDriverRegistration(registrationData) {
        try {
            console.log('📝 Submitting driver registration...');
            // First create the driver
            const driver = await this.createDriver(registrationData.full_name, registrationData.phone);
            if (!driver) {
                console.error('❌ Failed to create driver during registration');
                return null;
            }
            // Then create the registration request
            const { data, error } = await database_1.supabase
                .from('driver_registration_requests')
                .insert({
                driver_id: driver.id,
                full_name: registrationData.full_name,
                phone: registrationData.phone,
                password: registrationData.password || null,
                email: registrationData.email,
                driver_license_number: registrationData.driver_license_number,
                vehicle_type: registrationData.vehicle_type,
                vehicle_registration: registrationData.vehicle_registration,
                vehicle_color: registrationData.vehicle_color,
                home_address: registrationData.home_address,
                emergency_contact_name: registrationData.emergency_contact_name,
                emergency_contact_phone: registrationData.emergency_contact_phone,
                registration_data: registrationData,
                status: 'pending'
            })
                .select()
                .single();
            if (error) {
                console.error('❌ Error creating registration request:', error);
                return null;
            }
            console.log('✅ Driver registration submitted successfully');
            return { driver, registration_request: data };
        }
        catch (error) {
            console.error('❌ Exception in submitDriverRegistration:', error);
            return null;
        }
    }
    async getDriverRegistrationStatus(driverId) {
        try {
            console.log('📋 Getting driver registration status:', driverId);
            const { data, error } = await database_1.supabase
                .from('driver_registration_requests')
                .select('*')
                .eq('driver_id', driverId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();
            if (error) {
                console.error('❌ Error getting registration status:', error);
                return null;
            }
            console.log('✅ Registration status retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getDriverRegistrationStatus:', error);
            return null;
        }
    }
    async updateDriverProfile(driverId, updates) {
        try {
            console.log('🔄 Updating driver profile...');
            const { data, error } = await database_1.supabase
                .from('drivers')
                .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
                .eq('id', driverId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error updating driver profile:', error);
                return false;
            }
            console.log('✅ Driver profile updated successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in updateDriverProfile:', error);
            return false;
        }
    }
    async getAllAvailableDrivers() {
        try {
            console.log('🚗 Getting all available drivers...');
            const { data, error } = await database_1.supabase
                .from('drivers')
                .select('*')
                .eq('is_available', true)
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Error getting available drivers:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} available drivers`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getAllAvailableDrivers:', error);
            return [];
        }
    }
    async getOrderDetails(orderId) {
        try {
            console.log('📋 Getting order details for:', orderId);
            const { data, error } = await database_1.supabase
                .from('orders')
                .select(`
          *,
          merchants!inner (
            name,
            shop_address,
            shop_location,
            contact_phone
          ),
          drivers!inner (
            name,
            phone
          )
        `)
                .eq('id', orderId)
                .single();
            if (error) {
                console.error('❌ Error getting order details:', error);
                return null;
            }
            console.log('✅ Order details retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getOrderDetails:', error);
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
                case 'assigned':
                    statusMessage = `🚗 *Driver Assigned*\n\nYour order #${shortOrderId} has been assigned to a driver.\n\nThe driver is on the way to pick up your order.\n\nType "track ${shortOrderId}" to check your order status.`;
                    break;
                case 'out_for_delivery':
                    statusMessage = `🚚 *Out for Delivery*\n\nYour order #${shortOrderId} is out for delivery.\n\nThe driver is on the way to your location.\n\nType "track ${shortOrderId}" to check your order status.`;
                    break;
                case 'delivered':
                    statusMessage = `🎉 *Order Delivered*\n\nYour order #${shortOrderId} has been delivered!\n\nThank you for your order. We hope you enjoy it!\n\nType "track ${shortOrderId}" to check your order status.`;
                    break;
                default:
                    statusMessage = `📋 *Order Status Update*\n\nYour order #${shortOrderId} status has been updated to: ${status}\n\nType "track ${shortOrderId}" to check your order status.`;
            }
            await whatsappBotService.sendMessageToCustomer(formattedPhone, statusMessage);
            console.log('✅ WhatsApp notification sent successfully');
        }
        catch (error) {
            console.error('❌ Error sending WhatsApp notification:', error);
        }
    }
}
exports.DriverService = DriverService;
//# sourceMappingURL=DriverService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DriverService = void 0;
const database_1 = require("./database");
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
    async getAvailableOrders() {
        try {
            console.log('📋 Getting available orders for drivers...');
            const { data, error } = await database_1.supabase
                .rpc('get_available_orders_for_drivers');
            if (error) {
                console.error('❌ Error getting available orders:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} available orders`);
            return data;
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
                .rpc('get_driver_active_delivery', {
                driver_id: driverId
            });
            if (error) {
                console.error('❌ Error getting active delivery:', error);
                return null;
            }
            if (!data || data.length === 0) {
                console.log('📭 No active delivery found');
                return null;
            }
            console.log('✅ Active delivery retrieved successfully');
            return data[0];
        }
        catch (error) {
            console.error('❌ Exception in getDriverActiveDelivery:', error);
            return null;
        }
    }
    async acceptOrder(orderId, driverId) {
        try {
            console.log('✅ Driver accepting order:', orderId);
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
            // Mark driver as available again
            await this.setDriverAvailability(driverId, true);
            console.log('✅ Delivery completed successfully');
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
            const { data, error } = await database_1.supabase
                .from('driver_dashboard_summary')
                .select('*')
                .eq('driver_id', driverId)
                .single();
            if (error) {
                console.error('❌ Error getting driver dashboard summary:', error);
                return null;
            }
            console.log('✅ Driver dashboard summary retrieved successfully');
            return data;
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
}
exports.DriverService = DriverService;
//# sourceMappingURL=DriverService.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const database_1 = require("./database");
class AdminService {
    async createAdminUser(email, passwordHash, name, role = 'admin') {
        try {
            console.log('👤 Creating new admin user...');
            const { data, error } = await database_1.supabase
                .from('admin_users')
                .insert({
                email: email,
                password_hash: passwordHash,
                name: name,
                role: role,
                is_active: true
            })
                .select()
                .single();
            if (error) {
                console.error('❌ Error creating admin user:', error);
                return null;
            }
            console.log('✅ Admin user created successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in createAdminUser:', error);
            return null;
        }
    }
    async getAdminUserById(adminId) {
        try {
            console.log('👤 Getting admin user by ID:', adminId);
            const { data, error } = await database_1.supabase
                .from('admin_users')
                .select('*')
                .eq('id', adminId)
                .single();
            if (error) {
                console.error('❌ Error getting admin user:', error);
                return null;
            }
            console.log('✅ Admin user retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getAdminUserById:', error);
            return null;
        }
    }
    async getAdminUserByEmail(email) {
        try {
            console.log('👤 Getting admin user by email:', email);
            const { data, error } = await database_1.supabase
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .single();
            if (error) {
                console.error('❌ Error getting admin user by email:', error);
                return null;
            }
            console.log('✅ Admin user retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getAdminUserByEmail:', error);
            return null;
        }
    }
    async getAllAdminUsers() {
        try {
            console.log('👥 Getting all admin users...');
            const { data, error } = await database_1.supabase
                .from('admin_users')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Error getting admin users:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} admin users`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getAllAdminUsers:', error);
            return [];
        }
    }
    async getPendingVendorRegistrations() {
        try {
            console.log('📋 Getting pending vendor registrations...');
            const { data, error } = await database_1.supabase
                .from('vendor_registration_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Error getting pending vendor registrations:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} pending vendor registrations`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getPendingVendorRegistrations:', error);
            return [];
        }
    }
    async getPendingDriverRegistrations() {
        try {
            console.log('📋 Getting pending driver registrations...');
            const { data, error } = await database_1.supabase
                .from('driver_registration_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Error getting pending driver registrations:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} pending driver registrations`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getPendingDriverRegistrations:', error);
            return [];
        }
    }
    async approveVendorRegistration(requestId, adminId) {
        try {
            console.log('✅ Approving vendor registration:', requestId);
            // First, get the registration request to find the merchant_id
            const { data: registration, error: regError } = await database_1.supabase
                .from('vendor_registration_requests')
                .select('*')
                .eq('id', requestId)
                .single();
            if (regError || !registration) {
                console.error('❌ Error getting vendor registration:', regError);
                return false;
            }
            // Update the registration request status
            const { error: updateRegError } = await database_1.supabase
                .from('vendor_registration_requests')
                .update({
                status: 'approved',
                reviewed_by: adminId || null,
                reviewed_at: new Date().toISOString()
            })
                .eq('id', requestId);
            if (updateRegError) {
                console.error('❌ Error updating registration request:', updateRegError);
                return false;
            }
            // Update the merchant status and transfer registration data
            const merchantUpdate = {
                registration_status: 'approved',
                approved_by: adminId || null,
                approved_at: new Date().toISOString(),
                active: true,
                password: registration.password || null,
                business_license_number: registration.business_license_number,
                tax_id: registration.tax_id,
                business_description: registration.business_description,
                operating_hours: registration.operating_hours,
                shop_address: registration.shop_address
            };
            // Only update these fields if they exist in the database
            if (registration.shop_location) {
                merchantUpdate.shop_location = registration.shop_location;
            }
            if (registration.category_id) {
                merchantUpdate.category_id = registration.category_id;
            }
            const { error: updateMerchantError } = await database_1.supabase
                .from('merchants')
                .update(merchantUpdate)
                .eq('id', registration.merchant_id);
            if (updateMerchantError) {
                console.error('❌ Error updating merchant:', updateMerchantError);
                return false;
            }
            console.log('✅ Vendor registration approved successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in approveVendorRegistration:', error);
            return false;
        }
    }
    async rejectVendorRegistration(requestId, adminId, reason) {
        try {
            console.log('❌ Rejecting vendor registration:', requestId);
            // First, get the registration request to find the merchant_id
            const { data: registration, error: regError } = await database_1.supabase
                .from('vendor_registration_requests')
                .select('*')
                .eq('id', requestId)
                .single();
            if (regError || !registration) {
                console.error('❌ Error getting vendor registration:', regError);
                return false;
            }
            // Update the registration request status
            const { error: updateRegError } = await database_1.supabase
                .from('vendor_registration_requests')
                .update({
                status: 'rejected',
                reviewed_by: adminId || null,
                reviewed_at: new Date().toISOString(),
                rejection_reason: reason || null
            })
                .eq('id', requestId);
            if (updateRegError) {
                console.error('❌ Error updating registration request:', updateRegError);
                return false;
            }
            // Update the merchant status
            const { error: updateMerchantError } = await database_1.supabase
                .from('merchants')
                .update({
                registration_status: 'rejected',
                approved_by: adminId || null,
                approved_at: new Date().toISOString(),
                rejection_reason: reason || null,
                active: false
            })
                .eq('id', registration.merchant_id);
            if (updateMerchantError) {
                console.error('❌ Error updating merchant:', updateMerchantError);
                return false;
            }
            console.log('✅ Vendor registration rejected successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in rejectVendorRegistration:', error);
            return false;
        }
    }
    async approveDriverRegistration(requestId, adminId) {
        try {
            console.log('✅ Approving driver registration:', requestId);
            // First, get the registration request to find the driver_id
            const { data: registration, error: regError } = await database_1.supabase
                .from('driver_registration_requests')
                .select('*')
                .eq('id', requestId)
                .single();
            if (regError || !registration) {
                console.error('❌ Error getting driver registration:', regError);
                return false;
            }
            // Update the registration request status
            const { error: updateRegError } = await database_1.supabase
                .from('driver_registration_requests')
                .update({
                status: 'approved',
                reviewed_by: adminId || null,
                reviewed_at: new Date().toISOString()
            })
                .eq('id', requestId);
            if (updateRegError) {
                console.error('❌ Error updating registration request:', updateRegError);
                return false;
            }
            // Update the driver status and transfer registration data
            const driverUpdate = {
                registration_status: 'approved',
                approved_by: adminId || null,
                approved_at: new Date().toISOString(),
                is_available: true,
                password: registration.password || null,
                driver_license_number: registration.driver_license_number,
                vehicle_type: registration.vehicle_type,
                vehicle_registration: registration.vehicle_registration,
                vehicle_color: registration.vehicle_color,
                home_address: registration.home_address
            };
            // Only update these fields if they exist in the database
            if (registration.emergency_contact_name) {
                driverUpdate.emergency_contact_name = registration.emergency_contact_name;
            }
            if (registration.emergency_contact_phone) {
                driverUpdate.emergency_contact_phone = registration.emergency_contact_phone;
            }
            if (registration.category_id) {
                driverUpdate.category_id = registration.category_id;
            }
            const { error: updateDriverError } = await database_1.supabase
                .from('drivers')
                .update(driverUpdate)
                .eq('id', registration.driver_id);
            if (updateDriverError) {
                console.error('❌ Error updating driver:', updateDriverError);
                return false;
            }
            console.log('✅ Driver registration approved successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in approveDriverRegistration:', error);
            return false;
        }
    }
    async rejectDriverRegistration(requestId, adminId, reason) {
        try {
            console.log('❌ Rejecting driver registration:', requestId);
            // First, get the registration request to find the driver_id
            const { data: registration, error: regError } = await database_1.supabase
                .from('driver_registration_requests')
                .select('*')
                .eq('id', requestId)
                .single();
            if (regError || !registration) {
                console.error('❌ Error getting driver registration:', regError);
                return false;
            }
            // Update the registration request status
            const { error: updateRegError } = await database_1.supabase
                .from('driver_registration_requests')
                .update({
                status: 'rejected',
                reviewed_by: adminId || null,
                reviewed_at: new Date().toISOString(),
                rejection_reason: reason || null
            })
                .eq('id', requestId);
            if (updateRegError) {
                console.error('❌ Error updating registration request:', updateRegError);
                return false;
            }
            // Delete the driver record
            const { error: deleteDriverError } = await database_1.supabase
                .from('drivers')
                .delete()
                .eq('id', registration.driver_id);
            if (deleteDriverError) {
                console.error('❌ Error deleting driver:', deleteDriverError);
                return false;
            }
            console.log('✅ Driver registration rejected successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in rejectDriverRegistration:', error);
            return false;
        }
    }
    async approveDriverDirectly(driverId, adminId) {
        try {
            console.log('✅ Approving driver directly:', driverId);
            const { error } = await database_1.supabase
                .from('drivers')
                .update({
                registration_status: 'approved',
                approved_by: adminId || null,
                approved_at: new Date().toISOString(),
                is_available: true
            })
                .eq('id', driverId);
            if (error) {
                console.error('❌ Error approving driver:', error);
                return false;
            }
            console.log('✅ Driver approved successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in approveDriverDirectly:', error);
            return false;
        }
    }
    async rejectDriverDirectly(driverId, adminId, reason) {
        try {
            console.log('❌ Rejecting driver directly:', driverId);
            const { error } = await database_1.supabase
                .from('drivers')
                .update({
                registration_status: 'rejected'
            })
                .eq('id', driverId);
            if (error) {
                console.error('❌ Error rejecting driver:', error);
                return false;
            }
            console.log('✅ Driver rejected successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in rejectDriverDirectly:', error);
            return false;
        }
    }
    async getDashboardSummary() {
        try {
            console.log('📊 Getting admin dashboard summary...');
            const { data, error } = await database_1.supabase
                .from('admin_dashboard_summary')
                .select('*')
                .single();
            if (error) {
                console.error('❌ Error getting dashboard summary:', error);
                return null;
            }
            console.log('✅ Dashboard summary retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getDashboardSummary:', error);
            return null;
        }
    }
    async getAllVendors() {
        try {
            console.log('🏪 Getting all vendors...');
            const { data, error } = await database_1.supabase
                .from('merchants')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Error getting vendors:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} vendors`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getAllVendors:', error);
            return [];
        }
    }
    async getAllDrivers() {
        try {
            console.log('🚗 Getting all drivers...');
            const { data, error } = await database_1.supabase
                .from('drivers')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('❌ Error getting drivers:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} drivers`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getAllDrivers:', error);
            return [];
        }
    }
    async suspendVendor(merchantId) {
        try {
            console.log('🔒 Suspending vendor:', merchantId);
            const { data, error } = await database_1.supabase
                .from('merchants')
                .update({
                registration_status: 'suspended',
                active: false,
                updated_at: new Date().toISOString()
            })
                .eq('id', merchantId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error suspending vendor:', error);
                return false;
            }
            console.log('✅ Vendor suspended successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in suspendVendor:', error);
            return false;
        }
    }
    async activateVendor(merchantId) {
        try {
            console.log('✅ Activating vendor:', merchantId);
            const { data, error } = await database_1.supabase
                .from('merchants')
                .update({
                registration_status: 'approved',
                active: true,
                updated_at: new Date().toISOString()
            })
                .eq('id', merchantId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error activating vendor:', error);
                return false;
            }
            console.log('✅ Vendor activated successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in activateVendor:', error);
            return false;
        }
    }
    async suspendDriver(driverId) {
        try {
            console.log('🔒 Suspending driver:', driverId);
            const { data, error } = await database_1.supabase
                .from('drivers')
                .update({
                registration_status: 'suspended',
                is_available: false,
                updated_at: new Date().toISOString()
            })
                .eq('id', driverId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error suspending driver:', error);
                return false;
            }
            console.log('✅ Driver suspended successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in suspendDriver:', error);
            return false;
        }
    }
    async activateDriver(driverId) {
        try {
            console.log('✅ Activating driver:', driverId);
            const { data, error } = await database_1.supabase
                .from('drivers')
                .update({
                registration_status: 'approved',
                is_available: true,
                updated_at: new Date().toISOString()
            })
                .eq('id', driverId)
                .select()
                .single();
            if (error) {
                console.error('❌ Error activating driver:', error);
                return false;
            }
            console.log('✅ Driver activated successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in activateDriver:', error);
            return false;
        }
    }
    async getAllOrders() {
        try {
            console.log('📋 Getting all orders...');
            const { data, error } = await database_1.supabase
                .from('orders')
                .select(`
          *,
          merchants!inner (
            name,
            shop_address
          ),
          drivers!inner (
            name,
            phone
          )
        `)
                .order('created_at', { ascending: false })
                .limit(100);
            if (error) {
                console.error('❌ Error getting orders:', error);
                return [];
            }
            console.log(`✅ Retrieved ${data.length} orders`);
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getAllOrders:', error);
            return [];
        }
    }
    async getVendorRegistrationDetails(requestId) {
        try {
            console.log('📋 Getting vendor registration details:', requestId);
            const { data, error } = await database_1.supabase
                .from('vendor_registration_requests')
                .select('*')
                .eq('id', requestId)
                .single();
            if (error) {
                console.error('❌ Error getting vendor registration details:', error);
                return null;
            }
            console.log('✅ Vendor registration details retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getVendorRegistrationDetails:', error);
            return null;
        }
    }
    async getDriverRegistrationDetails(requestId) {
        try {
            console.log('📋 Getting driver registration details:', requestId);
            const { data, error } = await database_1.supabase
                .from('driver_registration_requests')
                .select('*')
                .eq('id', requestId)
                .single();
            if (error) {
                console.error('❌ Error getting driver registration details:', error);
                return null;
            }
            console.log('✅ Driver registration details retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getDriverRegistrationDetails:', error);
            return null;
        }
    }
    async getVendorById(vendorId) {
        try {
            console.log('📋 Getting vendor by ID:', vendorId);
            const { data, error } = await database_1.supabase
                .from('merchants')
                .select('*')
                .eq('id', vendorId)
                .single();
            if (error) {
                console.error('❌ Error getting vendor:', error);
                return null;
            }
            console.log('✅ Vendor retrieved successfully');
            return data;
        }
        catch (error) {
            console.error('❌ Exception in getVendorById:', error);
            return null;
        }
    }
    async getDriverById(driverId) {
        try {
            console.log('📋 Getting driver by ID:', driverId);
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
}
exports.AdminService = AdminService;
//# sourceMappingURL=AdminService.js.map
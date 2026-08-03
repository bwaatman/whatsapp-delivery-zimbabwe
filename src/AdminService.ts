import { supabase } from './database';

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VendorRegistrationRequest {
  id: string;
  merchant_id: string;
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  business_license_number: string;
  tax_id: string;
  business_description: string;
  operating_hours: any;
  shop_location?: string;
  shop_address: string;
  registration_data: any;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface DriverRegistrationRequest {
  id: string;
  driver_id: string;
  full_name: string;
  phone: string;
  email?: string;
  driver_license_number: string;
  vehicle_type: string;
  vehicle_registration: string;
  vehicle_color: string;
  home_address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  registration_data: any;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminDashboardSummary {
  active_admins: number;
  pending_vendors: number;
  active_vendors: number;
  pending_drivers: number;
  active_drivers: number;
  pending_orders: number;
  active_deliveries: number;
  active_products: number;
}

export class AdminService {
  async createAdminUser(email: string, passwordHash: string, name: string, role: 'admin' | 'super_admin' = 'admin'): Promise<AdminUser | null> {
    try {
      console.log('👤 Creating new admin user...');

      const { data, error } = await supabase
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
      return data as AdminUser;
    } catch (error) {
      console.error('❌ Exception in createAdminUser:', error);
      return null;
    }
  }

  async getAdminUserById(adminId: string): Promise<AdminUser | null> {
    try {
      console.log('👤 Getting admin user by ID:', adminId);

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', adminId)
        .single();

      if (error) {
        console.error('❌ Error getting admin user:', error);
        return null;
      }

      console.log('✅ Admin user retrieved successfully');
      return data as AdminUser;
    } catch (error) {
      console.error('❌ Exception in getAdminUserById:', error);
      return null;
    }
  }

  async getAdminUserByEmail(email: string): Promise<AdminUser | null> {
    try {
      console.log('👤 Getting admin user by email:', email);

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        console.error('❌ Error getting admin user by email:', error);
        return null;
      }

      console.log('✅ Admin user retrieved successfully');
      return data as AdminUser;
    } catch (error) {
      console.error('❌ Exception in getAdminUserByEmail:', error);
      return null;
    }
  }

  async getAllAdminUsers(): Promise<AdminUser[]> {
    try {
      console.log('👥 Getting all admin users...');

      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting admin users:', error);
        return [];
      }

      console.log(`✅ Retrieved ${data.length} admin users`);
      return data as AdminUser[];
    } catch (error) {
      console.error('❌ Exception in getAllAdminUsers:', error);
      return [];
    }
  }

  async getPendingVendorRegistrations(): Promise<VendorRegistrationRequest[]> {
    try {
      console.log('📋 Getting pending vendor registrations...');

      const { data, error } = await supabase
        .from('vendor_registration_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting pending vendor registrations:', error);
        return [];
      }

      console.log(`✅ Retrieved ${data.length} pending vendor registrations`);
      return data as VendorRegistrationRequest[];
    } catch (error) {
      console.error('❌ Exception in getPendingVendorRegistrations:', error);
      return [];
    }
  }

  async getPendingDriverRegistrations(): Promise<DriverRegistrationRequest[]> {
    try {
      console.log('📋 Getting pending driver registrations...');

      const { data, error } = await supabase
        .from('driver_registration_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting pending driver registrations:', error);
        return [];
      }

      console.log(`✅ Retrieved ${data.length} pending driver registrations`);
      return data as DriverRegistrationRequest[];
    } catch (error) {
      console.error('❌ Exception in getPendingDriverRegistrations:', error);
      return [];
    }
  }

  async approveVendorRegistration(requestId: string, adminId?: string): Promise<boolean> {
    try {
      console.log('✅ Approving vendor registration:', requestId);

      // First, get the registration request to find the merchant_id
      const { data: registration, error: regError } = await supabase
        .from('vendor_registration_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (regError || !registration) {
        console.error('❌ Error getting vendor registration:', regError);
        return false;
      }

      // Update the registration request status
      const { error: updateRegError } = await supabase
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
      const merchantUpdate: any = {
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

      const { error: updateMerchantError } = await supabase
        .from('merchants')
        .update(merchantUpdate)
        .eq('id', registration.merchant_id);

      if (updateMerchantError) {
        console.error('❌ Error updating merchant:', updateMerchantError);
        return false;
      }

      console.log('✅ Vendor registration approved successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in approveVendorRegistration:', error);
      return false;
    }
  }

  async rejectVendorRegistration(requestId: string, adminId?: string, reason?: string): Promise<boolean> {
    try {
      console.log('❌ Rejecting vendor registration:', requestId);

      // First, get the registration request to find the merchant_id
      const { data: registration, error: regError } = await supabase
        .from('vendor_registration_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (regError || !registration) {
        console.error('❌ Error getting vendor registration:', regError);
        return false;
      }

      // Update the registration request status
      const { error: updateRegError } = await supabase
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
      const { error: updateMerchantError } = await supabase
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
    } catch (error) {
      console.error('❌ Exception in rejectVendorRegistration:', error);
      return false;
    }
  }

  async approveDriverRegistration(requestId: string, adminId?: string): Promise<boolean> {
    try {
      console.log('✅ Approving driver registration:', requestId);

      // First, get the registration request to find the driver_id
      const { data: registration, error: regError } = await supabase
        .from('driver_registration_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (regError || !registration) {
        console.error('❌ Error getting driver registration:', regError);
        return false;
      }

      // Update the registration request status
      const { error: updateRegError } = await supabase
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
      const driverUpdate: any = {
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

      const { error: updateDriverError } = await supabase
        .from('drivers')
        .update(driverUpdate)
        .eq('id', registration.driver_id);

      if (updateDriverError) {
        console.error('❌ Error updating driver:', updateDriverError);
        return false;
      }

      console.log('✅ Driver registration approved successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in approveDriverRegistration:', error);
      return false;
    }
  }

  async rejectDriverRegistration(requestId: string, adminId?: string, reason?: string): Promise<boolean> {
    try {
      console.log('❌ Rejecting driver registration:', requestId);

      // First, get the registration request to find the driver_id
      const { data: registration, error: regError } = await supabase
        .from('driver_registration_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (regError || !registration) {
        console.error('❌ Error getting driver registration:', regError);
        return false;
      }

      // Update the registration request status
      const { error: updateRegError } = await supabase
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
      const { error: deleteDriverError } = await supabase
        .from('drivers')
        .delete()
        .eq('id', registration.driver_id);

      if (deleteDriverError) {
        console.error('❌ Error deleting driver:', deleteDriverError);
        return false;
      }

      console.log('✅ Driver registration rejected successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in rejectDriverRegistration:', error);
      return false;
    }
  }

  async approveDriverDirectly(driverId: string, adminId?: string): Promise<boolean> {
    try {
      console.log('✅ Approving driver directly:', driverId);

      const { error } = await supabase
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
    } catch (error) {
      console.error('❌ Exception in approveDriverDirectly:', error);
      return false;
    }
  }

  async rejectDriverDirectly(driverId: string, adminId?: string, reason?: string): Promise<boolean> {
    try {
      console.log('❌ Rejecting driver directly:', driverId);

      const { error } = await supabase
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
    } catch (error) {
      console.error('❌ Exception in rejectDriverDirectly:', error);
      return false;
    }
  }

  async getDashboardSummary(): Promise<AdminDashboardSummary | null> {
    try {
      console.log('📊 Getting admin dashboard summary...');

      const { data, error } = await supabase
        .from('admin_dashboard_summary')
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error getting dashboard summary:', error);
        return null;
      }

      console.log('✅ Dashboard summary retrieved successfully');
      return data as AdminDashboardSummary;
    } catch (error) {
      console.error('❌ Exception in getDashboardSummary:', error);
      return null;
    }
  }

  async getAllVendors(): Promise<any[]> {
    try {
      console.log('🏪 Getting all vendors...');

      const { data, error } = await supabase
        .from('merchants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting vendors:', error);
        return [];
      }

      console.log(`✅ Retrieved ${data.length} vendors`);
      return data;
    } catch (error) {
      console.error('❌ Exception in getAllVendors:', error);
      return [];
    }
  }

  async getAllDrivers(): Promise<any[]> {
    try {
      console.log('🚗 Getting all drivers...');

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error getting drivers:', error);
        return [];
      }

      console.log(`✅ Retrieved ${data.length} drivers`);
      return data;
    } catch (error) {
      console.error('❌ Exception in getAllDrivers:', error);
      return [];
    }
  }

  async suspendVendor(merchantId: string): Promise<boolean> {
    try {
      console.log('🔒 Suspending vendor:', merchantId);

      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Exception in suspendVendor:', error);
      return false;
    }
  }

  async activateVendor(merchantId: string): Promise<boolean> {
    try {
      console.log('✅ Activating vendor:', merchantId);

      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Exception in activateVendor:', error);
      return false;
    }
  }

  async suspendDriver(driverId: string): Promise<boolean> {
    try {
      console.log('🔒 Suspending driver:', driverId);

      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Exception in suspendDriver:', error);
      return false;
    }
  }

  async activateDriver(driverId: string): Promise<boolean> {
    try {
      console.log('✅ Activating driver:', driverId);

      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Exception in activateDriver:', error);
      return false;
    }
  }

  async getAllOrders(): Promise<any[]> {
    try {
      console.log('📋 Getting all orders...');

      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Exception in getAllOrders:', error);
      return [];
    }
  }

  async getVendorRegistrationDetails(requestId: string): Promise<VendorRegistrationRequest | null> {
    try {
      console.log('📋 Getting vendor registration details:', requestId);

      const { data, error } = await supabase
        .from('vendor_registration_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('❌ Error getting vendor registration details:', error);
        return null;
      }

      console.log('✅ Vendor registration details retrieved successfully');
      return data as VendorRegistrationRequest;
    } catch (error) {
      console.error('❌ Exception in getVendorRegistrationDetails:', error);
      return null;
    }
  }

  async getDriverRegistrationDetails(requestId: string): Promise<DriverRegistrationRequest | null> {
    try {
      console.log('📋 Getting driver registration details:', requestId);

      const { data, error } = await supabase
        .from('driver_registration_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (error) {
        console.error('❌ Error getting driver registration details:', error);
        return null;
      }

      console.log('✅ Driver registration details retrieved successfully');
      return data as DriverRegistrationRequest;
    } catch (error) {
      console.error('❌ Exception in getDriverRegistrationDetails:', error);
      return null;
    }
  }

  async getVendorById(vendorId: string): Promise<any> {
    try {
      console.log('📋 Getting vendor by ID:', vendorId);

      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Exception in getVendorById:', error);
      return null;
    }
  }

  async getDriverById(driverId: string): Promise<any> {
    try {
      console.log('📋 Getting driver by ID:', driverId);

      const { data, error } = await supabase
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
    } catch (error) {
      console.error('❌ Exception in getDriverById:', error);
      return null;
    }
  }

  // Document review methods
  async updateDriverDocumentReviewStatus(
    registrationId: string,
    documentId: string,
    reviewStatus: 'approved' | 'rejected' | 'needs_resubmission',
    adminComments?: string
  ): Promise<boolean> {
    try {
      console.log(`📄 Updating driver document ${documentId} review status to ${reviewStatus}`);

      const { error } = await supabase
        .from('documents')
        .update({
          admin_review_status: reviewStatus,
          admin_comments: adminComments || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('❌ Error updating document review status:', error);
        return false;
      }

      // Update registration verification status if all documents are approved
      await this.updateDriverVerificationStatus(registrationId);

      console.log('✅ Document review status updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in updateDriverDocumentReviewStatus:', error);
      return false;
    }
  }

  async updateVendorDocumentReviewStatus(
    registrationId: string,
    documentId: string,
    reviewStatus: 'approved' | 'rejected' | 'needs_resubmission',
    adminComments?: string
  ): Promise<boolean> {
    try {
      console.log(`📄 Updating vendor document ${documentId} review status to ${reviewStatus}`);

      const { error } = await supabase
        .from('documents')
        .update({
          admin_review_status: reviewStatus,
          admin_comments: adminComments || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (error) {
        console.error('❌ Error updating document review status:', error);
        return false;
      }

      // Update registration verification status if all documents are approved
      await this.updateVendorVerificationStatus(registrationId);

      console.log('✅ Document review status updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in updateVendorDocumentReviewStatus:', error);
      return false;
    }
  }

  async approveDriverWithDocuments(registrationId: string, adminId?: string): Promise<boolean> {
    try {
      console.log('✅ Approving driver registration with documents:', registrationId);

      // Get registration details
      const { data: registration, error: regError } = await supabase
        .from('driver_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        console.error('❌ Error getting driver registration:', regError);
        return false;
      }

      // Update registration status
      const { error: updateRegError } = await supabase
        .from('driver_registration_requests')
        .update({
          status: 'approved',
          verification_status: 'approved',
          reviewed_by: adminId || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (updateRegError) {
        console.error('❌ Error updating registration request:', updateRegError);
        return false;
      }

      // Update driver status and set verified badge
      const { error: updateDriverError } = await supabase
        .from('drivers')
        .update({
          registration_status: 'approved',
          approved_by: adminId || null,
          approved_at: new Date().toISOString(),
          is_verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', registration.driver_id);

      if (updateDriverError) {
        console.error('❌ Error updating driver:', updateDriverError);
        return false;
      }

      console.log('✅ Driver registration approved with documents successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in approveDriverWithDocuments:', error);
      return false;
    }
  }

  async approveVendorWithDocuments(registrationId: string, adminId?: string): Promise<boolean> {
    try {
      console.log('✅ Approving vendor registration with documents:', registrationId);

      // Get registration details
      const { data: registration, error: regError } = await supabase
        .from('vendor_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        console.error('❌ Error getting vendor registration:', regError);
        return false;
      }

      // Update registration status
      const { error: updateRegError } = await supabase
        .from('vendor_registration_requests')
        .update({
          status: 'approved',
          verification_status: 'approved',
          reviewed_by: adminId || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (updateRegError) {
        console.error('❌ Error updating registration request:', updateRegError);
        return false;
      }

      // Update merchant status and set verified badge
      const { error: updateMerchantError } = await supabase
        .from('merchants')
        .update({
          registration_status: 'approved',
          approved_by: adminId || null,
          approved_at: new Date().toISOString(),
          active: true,
          is_verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', registration.merchant_id);

      if (updateMerchantError) {
        console.error('❌ Error updating merchant:', updateMerchantError);
        return false;
      }

      console.log('✅ Vendor registration approved with documents successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in approveVendorWithDocuments:', error);
      return false;
    }
  }

  async rejectDriverWithComments(registrationId: string, adminId?: string, comments?: string): Promise<boolean> {
    try {
      console.log('❌ Rejecting driver registration with comments:', registrationId);

      // Get registration details
      const { data: registration, error: regError } = await supabase
        .from('driver_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        console.error('❌ Error getting driver registration:', regError);
        return false;
      }

      // Update registration status
      const { error: updateRegError } = await supabase
        .from('driver_registration_requests')
        .update({
          status: 'rejected',
          verification_status: 'rejected',
          rejection_reason: comments,
          admin_review_comments: comments,
          reviewed_by: adminId || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (updateRegError) {
        console.error('❌ Error updating registration request:', updateRegError);
        return false;
      }

      // Update driver status
      const { error: updateDriverError } = await supabase
        .from('drivers')
        .update({
          registration_status: 'rejected',
          approved_by: adminId || null,
          approved_at: new Date().toISOString()
        })
        .eq('id', registration.driver_id);

      if (updateDriverError) {
        console.error('❌ Error updating driver:', updateDriverError);
        return false;
      }

      console.log('✅ Driver registration rejected successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in rejectDriverWithComments:', error);
      return false;
    }
  }

  async rejectVendorWithComments(registrationId: string, adminId?: string, comments?: string): Promise<boolean> {
    try {
      console.log('❌ Rejecting vendor registration with comments:', registrationId);

      // Get registration details
      const { data: registration, error: regError } = await supabase
        .from('vendor_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (regError || !registration) {
        console.error('❌ Error getting vendor registration:', regError);
        return false;
      }

      // Update registration status
      const { error: updateRegError } = await supabase
        .from('vendor_registration_requests')
        .update({
          status: 'rejected',
          verification_status: 'rejected',
          rejection_reason: comments,
          admin_review_comments: comments,
          reviewed_by: adminId || null,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', registrationId);

      if (updateRegError) {
        console.error('❌ Error updating registration request:', updateRegError);
        return false;
      }

      // Update merchant status
      const { error: updateMerchantError } = await supabase
        .from('merchants')
        .update({
          registration_status: 'rejected',
          approved_by: adminId || null,
          approved_at: new Date().toISOString()
        })
        .eq('id', registration.merchant_id);

      if (updateMerchantError) {
        console.error('❌ Error updating merchant:', updateMerchantError);
        return false;
      }

      console.log('✅ Vendor registration rejected successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in rejectVendorWithComments:', error);
      return false;
    }
  }

  async requestDriverResubmission(registrationId: string, comments?: string): Promise<boolean> {
    try {
      console.log('🔄 Requesting driver registration resubmission:', registrationId);

      const { error } = await supabase
        .from('driver_registration_requests')
        .update({
          verification_status: 'needs_resubmission',
          admin_review_comments: comments,
          status: 'pending'
        })
        .eq('id', registrationId);

      if (error) {
        console.error('❌ Error requesting resubmission:', error);
        return false;
      }

      console.log('✅ Driver resubmission requested successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in requestDriverResubmission:', error);
      return false;
    }
  }

  async requestVendorResubmission(registrationId: string, comments?: string): Promise<boolean> {
    try {
      console.log('🔄 Requesting vendor registration resubmission:', registrationId);

      const { error } = await supabase
        .from('vendor_registration_requests')
        .update({
          verification_status: 'needs_resubmission',
          admin_review_comments: comments,
          status: 'pending'
        })
        .eq('id', registrationId);

      if (error) {
        console.error('❌ Error requesting resubmission:', error);
        return false;
      }

      console.log('✅ Vendor resubmission requested successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in requestVendorResubmission:', error);
      return false;
    }
  }

  private async updateDriverVerificationStatus(registrationId: string): Promise<void> {
    try {
      // Get all documents for this registration
      const { data: registration } = await supabase
        .from('driver_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (!registration) return;

      const documentIds = [
        registration.national_id_front_doc_id,
        registration.national_id_back_doc_id,
        registration.selfie_with_id_doc_id,
        registration.profile_photo_doc_id,
        registration.driver_licence_doc_id,
        registration.vehicle_registration_book_doc_id
      ].filter(Boolean);

      if (documentIds.length === 0) return;

      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .in('id', documentIds);

      if (!documents || documents.length === 0) return;

      // Check if all documents are approved
      const allApproved = documents.every(doc => doc.admin_review_status === 'approved');
      const anyRejected = documents.some(doc => doc.admin_review_status === 'rejected');
      const anyNeedsResubmission = documents.some(doc => doc.admin_review_status === 'needs_resubmission');

      let newStatus = 'under_review';
      if (anyRejected) {
        newStatus = 'rejected';
      } else if (anyNeedsResubmission) {
        newStatus = 'needs_resubmission';
      } else if (allApproved) {
        newStatus = 'approved';
      }

 await supabase
        .from('driver_registration_requests')
        .update({ verification_status: newStatus })
        .eq('id', registrationId);
    } catch (error) {
      console.error('❌ Exception in updateDriverVerificationStatus:', error);
    }
  }

  private async updateVendorVerificationStatus(registrationId: string): Promise<void> {
    try {
      // Get all documents for this registration
      const { data: registration } = await supabase
        .from('vendor_registration_requests')
        .select('*')
        .eq('id', registrationId)
        .single();

      if (!registration) return;

      const documentIds = [
        registration.national_id_doc_id,
        registration.proof_of_address_doc_id,
        registration.certificate_of_incorporation_doc_id,
        registration.shop_front_photo_doc_id,
        registration.interior_photo_doc_id
      ].filter(Boolean);

      if (documentIds.length === 0) return;

      const { data: documents } = await supabase
        .from('documents')
        .select('*')
        .in('id', documentIds);

      if (!documents || documents.length === 0) return;

      // Check if all documents are approved
      const allApproved = documents.every(doc => doc.admin_review_status === 'approved');
      const anyRejected = documents.some(doc => doc.admin_review_status === 'rejected');
      const anyNeedsResubmission = documents.some(doc => doc.admin_review_status === 'needs_resubmission');

      let newStatus = 'under_review';
      if (anyRejected) {
        newStatus = 'rejected';
      } else if (anyNeedsResubmission) {
        newStatus = 'needs_resubmission';
      } else if (allApproved) {
        newStatus = 'approved';
      }

      await supabase
        .from('vendor_registration_requests')
        .update({ verification_status: newStatus })
        .eq('id', registrationId);
    } catch (error) {
      console.error('❌ Exception in updateVendorVerificationStatus:', error);
    }
  }
}

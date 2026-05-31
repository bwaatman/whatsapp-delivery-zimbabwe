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
export declare class AdminService {
    createAdminUser(email: string, passwordHash: string, name: string, role?: 'admin' | 'super_admin'): Promise<AdminUser | null>;
    getAdminUserById(adminId: string): Promise<AdminUser | null>;
    getAdminUserByEmail(email: string): Promise<AdminUser | null>;
    getAllAdminUsers(): Promise<AdminUser[]>;
    getPendingVendorRegistrations(): Promise<VendorRegistrationRequest[]>;
    getPendingDriverRegistrations(): Promise<DriverRegistrationRequest[]>;
    approveVendorRegistration(requestId: string, adminId?: string): Promise<boolean>;
    rejectVendorRegistration(requestId: string, adminId?: string, reason?: string): Promise<boolean>;
    approveDriverRegistration(requestId: string, adminId?: string): Promise<boolean>;
    rejectDriverRegistration(requestId: string, adminId?: string, reason?: string): Promise<boolean>;
    getDashboardSummary(): Promise<AdminDashboardSummary | null>;
    getAllVendors(): Promise<any[]>;
    getAllDrivers(): Promise<any[]>;
    suspendVendor(merchantId: string): Promise<boolean>;
    activateVendor(merchantId: string): Promise<boolean>;
    suspendDriver(driverId: string): Promise<boolean>;
    activateDriver(driverId: string): Promise<boolean>;
    getAllOrders(): Promise<any[]>;
    getVendorRegistrationDetails(requestId: string): Promise<VendorRegistrationRequest | null>;
    getDriverRegistrationDetails(requestId: string): Promise<DriverRegistrationRequest | null>;
}
//# sourceMappingURL=AdminService.d.ts.map
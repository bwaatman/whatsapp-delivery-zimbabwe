export declare function setWhatsAppBotService(service: any): void;
export interface Driver {
    id: string;
    name: string;
    phone: string;
    current_location?: string;
    is_available: boolean;
    registration_status?: 'pending' | 'approved' | 'rejected' | 'suspended';
    approved_by?: string;
    approved_at?: string;
    rejection_reason?: string;
    driver_license_number?: string;
    vehicle_type?: string;
    vehicle_registration?: string;
    category_id?: string;
    password?: string;
    registration_data?: any;
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
export interface AvailableOrder {
    id: string;
    customer_phone: string;
    order_details?: string;
    delivery_location: string;
    shop_location: string;
    shop_address: string;
    shop_name: string;
    created_at: string;
    estimated_preparation_time: number;
}
export interface ActiveDelivery {
    order_id: string;
    customer_phone: string;
    order_details?: string;
    delivery_location: string;
    shop_location: string;
    shop_address: string;
    shop_name: string;
    status: string;
    assigned_at: string;
}
export interface DriverDashboardSummary {
    driver_id: string;
    driver_name: string;
    is_available: boolean;
    active_deliveries: number;
    today_deliveries: number;
    current_location?: string;
}
export declare class DriverService {
    getDriverById(driverId: string): Promise<Driver | null>;
    getDriverByPhone(phone: string): Promise<Driver | null>;
    getAvailableOrders(driverId?: string): Promise<AvailableOrder[]>;
    getDriverActiveDelivery(driverId: string): Promise<ActiveDelivery | null>;
    acceptOrder(orderId: string, driverId: string, latitude?: number, longitude?: number): Promise<boolean>;
    startDelivery(orderId: string): Promise<boolean>;
    completeDelivery(orderId: string, driverId: string): Promise<boolean>;
    updateDriverLocation(driverId: string, latitude: number, longitude: number): Promise<boolean>;
    setDriverAvailability(driverId: string, isAvailable: boolean): Promise<boolean>;
    setDriverCategory(driverId: string, categoryId: string): Promise<boolean>;
    getDriverDashboardSummary(driverId: string): Promise<DriverDashboardSummary | null>;
    getDriverDeliveryHistory(driverId: string, limit?: number): Promise<any[]>;
    createDriver(name: string, phone: string): Promise<Driver | null>;
    submitDriverRegistration(registrationData: any): Promise<any>;
    getDriverRegistrationStatus(driverId: string): Promise<DriverRegistrationRequest | null>;
    updateDriverProfile(driverId: string, updates: Partial<Driver>): Promise<boolean>;
    getAllAvailableDrivers(): Promise<Driver[]>;
    getOrderDetails(orderId: string): Promise<any>;
    private sendOrderStatusNotification;
}
//# sourceMappingURL=DriverService.d.ts.map
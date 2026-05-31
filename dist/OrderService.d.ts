export interface Order {
    id?: string;
    customer_phone: string;
    status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'pending_dispatch' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
    delivery_location?: string;
    merchant_id?: string;
    change_requested_usd?: number;
    assigned_driver_id?: string;
    order_details?: string;
    created_at?: string;
    updated_at?: string;
    shop_confirmed_at?: string;
    ready_for_pickup_at?: string;
    driver_accepted_at?: string;
    estimated_delivery_time?: string;
}
export interface Driver {
    id: string;
    name: string;
    phone: string;
    current_location?: string;
    is_available: boolean;
    distance_km?: number;
}
export declare class OrderService {
    findPendingOrder(customerPhone: string): Promise<Order | null>;
    findActiveOrder(customerPhone: string): Promise<Order | null>;
    createOrder(customerPhone: string, merchantId?: string): Promise<Order | null>;
    updateOrderLocation(orderId: string, latitude: number, longitude: number): Promise<boolean>;
    updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean>;
    updateOrderDetails(orderId: string, orderDetails: string): Promise<boolean>;
    matchClosestDriver(customerLat: number, customerLng: number): Promise<Driver | null>;
    assignDriverToOrder(orderId: string, driverId: string): Promise<boolean>;
    updateDriverAvailability(driverId: string, isAvailable: boolean): Promise<boolean>;
    setOrderStatusPendingDispatch(orderId: string): Promise<boolean>;
    getOrderDetails(orderId: string): Promise<Order | null>;
}
//# sourceMappingURL=OrderService.d.ts.map
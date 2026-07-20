export interface OrderEconomics {
    food_amount: number;
    delivery_fee: number;
    service_fee: number;
    total: number;
    vendor_commission_rate: number;
    vendor_commission: number;
    vendor_earnings: number;
    driver_delivery_rate: number;
    driver_delivery_earnings: number;
    platform_delivery_margin: number;
    platform_revenue: number;
    total_driver_earnings: number;
    total_vendor_earnings: number;
}
export interface VehicleRestriction {
    max_distance_km: number;
    max_weight_kg: number;
    max_eta_minutes: number;
}
export interface PlatformConfig {
    vendor_commission_rate: number;
    driver_delivery_rate: number;
    payout_day: number;
    min_payout_amount: number;
    service_fee: number;
    vehicle_restrictions: Record<string, VehicleRestriction>;
    bicycle_pickup_radius_km: number;
}
export declare class OrderEconomicsService {
    /**
     * Get platform configuration
     */
    getPlatformConfig(): Promise<PlatformConfig>;
    /**
     * Calculate delivery fee based on distance between vendor and customer
     */
    calculateDeliveryFee(vendorLocation: any, customerLocation: any): Promise<number>;
    /**
     * Calculate order economics
     */
    calculateOrderEconomics(foodAmount: number, deliveryFee: number): Promise<OrderEconomics>;
    /**
     * Update order with economics data
     */
    updateOrderWithEconomics(orderId: string, economics: OrderEconomics): Promise<boolean>;
    /**
     * Process order completion - calculate and distribute earnings
     */
    processOrderCompletion(orderId: string, vendorId: string, driverId: string): Promise<boolean>;
    /**
     * Update platform configuration
     */
    updatePlatformConfig(key: string, value: string): Promise<boolean>;
}
//# sourceMappingURL=OrderEconomicsService.d.ts.map
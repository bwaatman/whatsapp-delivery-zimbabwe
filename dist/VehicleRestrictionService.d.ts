export interface OrderEligibilityResult {
    is_eligible: boolean;
    vehicle_type: string;
    distance_km: number;
    estimated_eta_minutes: number;
    reasons?: string[];
}
export declare class VehicleRestrictionService {
    private orderEconomicsService;
    constructor();
    /**
     * Calculate distance between two points using Haversine formula
     */
    calculateDistance(point1: any, point2: any): number;
    /**
     * Check if an order is eligible for a specific vehicle type
     */
    checkOrderEligibility(vendorLocation: any, customerLocation: any, vehicleType: string, estimatedPreparationTime?: number): Promise<OrderEligibilityResult>;
    /**
     * Get eligible vehicle types for an order
     */
    getEligibleVehicleTypes(vendorLocation: any, customerLocation: any, estimatedPreparationTime?: number): Promise<string[]>;
    /**
     * Check if a driver is eligible for an order based on their vehicle type
     */
    isDriverEligibleForOrder(driverId: string, vendorLocation: any, customerLocation: any, estimatedPreparationTime?: number): Promise<boolean>;
}
//# sourceMappingURL=VehicleRestrictionService.d.ts.map
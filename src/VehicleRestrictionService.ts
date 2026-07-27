import { supabase } from './database';
import { OrderEconomicsService, VehicleRestriction } from './OrderEconomicsService';

export interface OrderEligibilityResult {
  is_eligible: boolean;
  vehicle_type: string;
  distance_km: number;
  estimated_eta_minutes: number;
  reasons?: string[];
}

export class VehicleRestrictionService {
  private orderEconomicsService: OrderEconomicsService;

  constructor() {
    this.orderEconomicsService = new OrderEconomicsService();
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  public calculateDistance(point1: any, point2: any): number {
    try {
      const coords1 = point1?.coordinates || point1;
      const coords2 = point2?.coordinates || point2;

      if (!coords1 || !coords2 || coords1.length < 2 || coords2.length < 2) {
        return 0;
      }

      const lat1 = coords1[1];
      const lng1 = coords1[0];
      const lat2 = coords2[1];
      const lng2 = coords2[0];

      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      
      return R * c;
    } catch (error) {
      console.error('❌ Error calculating distance:', error);
      return 0;
    }
  }

  /**
   * Check if an order is eligible for a specific vehicle type
   */
  async checkOrderEligibility(
    vendorLocation: any,
    customerLocation: any,
    vehicleType: string,
    estimatedPreparationTime: number = 30
  ): Promise<OrderEligibilityResult> {
    try {
      console.log(`🚗 Checking order eligibility for vehicle type: ${vehicleType}`);

      // Get platform config with vehicle restrictions
      const config = await this.orderEconomicsService.getPlatformConfig();
      const restriction = config.vehicle_restrictions[vehicleType];

      if (!restriction) {
        console.warn(`⚠️ No restriction found for vehicle type: ${vehicleType} - assuming eligible`);
        return {
          is_eligible: true,
          vehicle_type: vehicleType,
          distance_km: 0,
          estimated_eta_minutes: 0
        };
      }

      // Calculate vendor to customer distance
      const distanceKm = this.calculateDistance(vendorLocation, customerLocation);
      console.log(`📍 Vendor to customer distance: ${distanceKm.toFixed(2)} km`);

      // Calculate estimated delivery time (preparation + travel)
      // Assume average speed of 20 km/h for travel time calculation
      const travelTimeMinutes = (distanceKm / 20) * 60;
      const estimatedEtaMinutes = estimatedPreparationTime + travelTimeMinutes;
      console.log(`⏱️ Estimated ETA: ${estimatedEtaMinutes.toFixed(0)} minutes (prep: ${estimatedPreparationTime}, travel: ${travelTimeMinutes.toFixed(0)})`);

      const reasons: string[] = [];

      // Check distance restriction
      if (distanceKm > restriction.max_distance_km) {
        reasons.push(`Distance ${distanceKm.toFixed(2)} km exceeds maximum ${restriction.max_distance_km} km`);
      }

      // Check ETA restriction
      if (estimatedEtaMinutes > restriction.max_eta_minutes) {
        reasons.push(`ETA ${estimatedEtaMinutes.toFixed(0)} minutes exceeds maximum ${restriction.max_eta_minutes} minutes`);
      }

      const isEligible = reasons.length === 0;

      console.log(`✅ Order eligibility result: ${isEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
      if (!isEligible) {
        console.log(`❌ Reasons: ${reasons.join(', ')}`);
      }

      return {
        is_eligible: isEligible,
        vehicle_type: vehicleType,
        distance_km: distanceKm,
        estimated_eta_minutes: estimatedEtaMinutes,
        reasons: isEligible ? undefined : reasons
      };
    } catch (error) {
      console.error('❌ Exception in checkOrderEligibility:', error);
      return {
        is_eligible: true, // Default to eligible on error
        vehicle_type: vehicleType,
        distance_km: 0,
        estimated_eta_minutes: 0
      };
    }
  }

  /**
   * Get eligible vehicle types for an order
   */
  async getEligibleVehicleTypes(
    vendorLocation: any,
    customerLocation: any,
    estimatedPreparationTime: number = 30
  ): Promise<string[]> {
    try {
      console.log('🚗 Getting eligible vehicle types for order');

      const config = await this.orderEconomicsService.getPlatformConfig();
      const vehicleTypes = Object.keys(config.vehicle_restrictions);

      const eligibleTypes: string[] = [];

      for (const vehicleType of vehicleTypes) {
        const result = await this.checkOrderEligibility(
          vendorLocation,
          customerLocation,
          vehicleType,
          estimatedPreparationTime
        );

        if (result.is_eligible) {
          eligibleTypes.push(vehicleType);
        }
      }

      console.log(`✅ Eligible vehicle types: ${eligibleTypes.join(', ')}`);
      return eligibleTypes;
    } catch (error) {
      console.error('❌ Exception in getEligibleVehicleTypes:', error);
      return [];
    }
  }

  /**
   * Check if a driver is eligible for an order based on their vehicle type
   */
  async isDriverEligibleForOrder(
    driverId: string,
    vendorLocation: any,
    customerLocation: any,
    estimatedPreparationTime: number = 30
  ): Promise<boolean> {
    try {
      console.log(`� [DIAGNOSTIC] isDriverEligibleForOrder called`);
      console.log(`🔍 [DIAGNOSTIC] driverId: ${driverId}`);
      console.log(`🔍 [DIAGNOSTIC] vendorLocation:`, JSON.stringify(vendorLocation));
      console.log(`🔍 [DIAGNOSTIC] customerLocation:`, JSON.stringify(customerLocation));

      // Get driver's vehicle type and current location
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('vehicle_type, current_location')
        .eq('id', driverId)
        .single();

      if (driverError || !driver) {
        console.error('❌ [DIAGNOSTIC] Error fetching driver:', driverError);
        console.log('🔍 [DIAGNOSTIC] RETURNING: TRUE (default on error)');
        return true; // Default to eligible on error
      }

      console.log(`🔍 [DIAGNOSTIC] Driver found in database`);
      console.log(`🔍 [DIAGNOSTIC] Driver vehicle_type: ${driver.vehicle_type}`);
      console.log(`🔍 [DIAGNOSTIC] Driver current_location:`, JSON.stringify(driver.current_location));

      const vehicleType = driver.vehicle_type?.toLowerCase();
      if (!vehicleType) {
        console.warn('⚠️ [DIAGNOSTIC] Driver has no vehicle type - assuming eligible');
        console.log('🔍 [DIAGNOSTIC] RETURNING: TRUE (no vehicle type)');
        return true;
      }

      // Get platform config for vehicle restrictions
      const config = await this.orderEconomicsService.getPlatformConfig();
      const restriction = config.vehicle_restrictions[vehicleType];

      if (!restriction) {
        console.warn(`⚠️ [DIAGNOSTIC] No restriction found for vehicle type: ${vehicleType} - assuming eligible`);
        console.log('🔍 [DIAGNOSTIC] RETURNING: TRUE (no restriction config)');
        return true;
      }

      console.log(`🔍 [DIAGNOSTIC] Vehicle restriction config: max_distance=${restriction.max_distance_km}km, max_eta=${restriction.max_eta_minutes}min`);

      // Check driver location and calculate distances
      if (!driver.current_location) {
        console.warn(`⚠️ [DIAGNOSTIC] Driver ${driverId} has no current location - NOT ELIGIBLE for any orders`);
        console.log('🔍 [DIAGNOSTIC] RETURNING: FALSE (no driver location)');
        return false; // Require location for order eligibility
      }

      if (!vendorLocation || !customerLocation) {
        console.warn(`⚠️ [DIAGNOSTIC] Order has missing location data - NOT ELIGIBLE`);
        console.log('🔍 [DIAGNOSTIC] RETURNING: FALSE (missing order location)');
        return false;
      }

      const driverToVendorDistance = this.calculateDistance(driver.current_location, vendorLocation);
      const vendorToCustomerDistance = this.calculateDistance(vendorLocation, customerLocation);
      const driverToCustomerDistance = this.calculateDistance(driver.current_location, customerLocation);

      const totalDistance = driverToVendorDistance + vendorToCustomerDistance;

      console.log(`🔍 [DIAGNOSTIC] Distance calculations:`);
      console.log(`� [DIAGNOSTIC] - Driver coordinates:`, JSON.stringify(driver.current_location));
      console.log(`🔍 [DIAGNOSTIC] - Vendor coordinates:`, JSON.stringify(vendorLocation));
      console.log(`🔍 [DIAGNOSTIC] - Customer coordinates:`, JSON.stringify(customerLocation));
      console.log(`🔍 [DIAGNOSTIC] - Driver to vendor: ${driverToVendorDistance.toFixed(2)} km`);
      console.log(`🔍 [DIAGNOSTIC] - Vendor to customer: ${vendorToCustomerDistance.toFixed(2)} km`);
      console.log(`🔍 [DIAGNOSTIC] - Driver to customer: ${driverToCustomerDistance.toFixed(2)} km`);
      console.log(`🔍 [DIAGNOSTIC] - Total distance: ${totalDistance.toFixed(2)} km`);
      console.log(`🔍 [DIAGNOSTIC] - Max allowed distance: ${restriction.max_distance_km} km`);
      console.log(`🔍 [DIAGNOSTIC] - Vehicle type: ${vehicleType}`);

      // Check if total distance exceeds vehicle's max distance
      if (totalDistance > restriction.max_distance_km) {
        console.log(`❌ [DIAGNOSTIC] REJECTED: Total distance ${totalDistance.toFixed(2)} km exceeds max ${restriction.max_distance_km} km`);
        console.log('🔍 [DIAGNOSTIC] RETURNING: FALSE (total distance too far)');
        return false;
      }

      // Additional check: driver to customer distance should not exceed max distance
      if (driverToCustomerDistance > restriction.max_distance_km) {
        console.log(`❌ [DIAGNOSTIC] REJECTED: Driver to customer distance ${driverToCustomerDistance.toFixed(2)} km exceeds max ${restriction.max_distance_km} km`);
        console.log('🔍 [DIAGNOSTIC] RETURNING: FALSE (driver to customer too far)');
        return false;
      }

      // Check bicycle pickup radius restriction
      if (vehicleType === 'bicycle') {
        const pickupRadius = config.bicycle_pickup_radius_km;
        if (driverToVendorDistance > pickupRadius) {
          console.log(`❌ [DIAGNOSTIC] REJECTED: Bicycle driver outside pickup radius (${driverToVendorDistance.toFixed(2)} km > ${pickupRadius} km)`);
          console.log('🔍 [DIAGNOSTIC] RETURNING: FALSE (bicycle pickup radius)');
          return false;
        }
      }

      // Check eligibility for the driver's vehicle type (vendor to customer distance and ETA)
      const result = await this.checkOrderEligibility(
        vendorLocation,
        customerLocation,
        vehicleType,
        estimatedPreparationTime
      );

      console.log(`🔍 [DIAGNOSTIC] checkOrderEligibility result:`, result);
      console.log(`🔍 [DIAGNOSTIC] Final eligibility: ${result.is_eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}`);
      if (!result.is_eligible) {
        console.log(`🔍 [DIAGNOSTIC] Rejection reasons:`, result.reasons);
      }
      console.log(`🔍 [DIAGNOSTIC] RETURNING: ${result.is_eligible}`);
      return result.is_eligible;
    } catch (error) {
      console.error('❌ [DIAGNOSTIC] Exception in isDriverEligibleForOrder:', error);
      console.log('🔍 [DIAGNOSTIC] RETURNING: TRUE (exception default)');
      return true; // Default to eligible on error
    }
  }
}

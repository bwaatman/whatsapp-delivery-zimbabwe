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
   * NEW ELIGIBILITY RULES:
   * - Driver → Vendor distance ≤ max_driver_to_vendor_distance_km
   * - Vendor → Customer distance ≤ max_vendor_to_customer_distance_km
   * - Total Journey distance ≤ max_total_journey_distance_km
   * - Vehicle type restrictions
   * - Driver availability
   * - Driver online status
   * ETA is informational only, not for eligibility
   */
  async isDriverEligibleForOrder(
    driverId: string,
    vendorLocation: any,
    customerLocation: any,
    estimatedPreparationTime: number = 30
  ): Promise<boolean> {
    try {
      console.log(`🔍 [DIAGNOSTIC] isDriverEligibleForOrder called`);
      console.log(`🔍 [DIAGNOSTIC] driverId: ${driverId}`);
      console.log(`🔍 [DIAGNOSTIC] vendorLocation:`, JSON.stringify(vendorLocation));
      console.log(`🔍 [DIAGNOSTIC] customerLocation:`, JSON.stringify(customerLocation));

      // Get driver's vehicle type, current location, and availability
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('vehicle_type, current_location, is_available')
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
      console.log(`🔍 [DIAGNOSTIC] Driver is_available: ${driver.is_available}`);

      // Check driver availability
      if (!driver.is_available) {
        console.log(`❌ [DIAGNOSTIC] REJECTED: Driver is not available`);
        console.log('🔍 [DIAGNOSTIC] RETURNING: FALSE (driver not available)');
        return false;
      }

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

      console.log(`🔍 [DIAGNOSTIC] Vehicle restriction config for ${vehicleType}:`);
      console.log(`🔍 [DIAGNOSTIC] - Driver→Vendor max: ${restriction.max_driver_to_vendor_distance_km} km`);
      console.log(`🔍 [DIAGNOSTIC] - Vendor→Customer max: ${restriction.max_vendor_to_customer_distance_km} km`);
      console.log(`🔍 [DIAGNOSTIC] - Total Journey max: ${restriction.max_total_journey_distance_km} km`);
      console.log(`🔍 [DIAGNOSTIC] - ETA Safety Limit: ${restriction.max_eta_safety_limit_minutes} min`);

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

      // Additional check: Verify vendor has valid GPS location (location_metadata exists and is fresh)
      // This prevents orders from shops that were opened before GPS system was implemented
      const { data: vendor } = await supabase
        .from('merchants')
        .select('location_metadata, is_temporarily_offline')
        .eq('id', (vendorLocation as any).merchant_id)
        .single();

      if (!vendor) {
        console.warn('[DIAGNOSTIC] Could not fetch vendor data - NOT ELIGIBLE');
        console.log('[DIAGNOSTIC] RETURNING: FALSE (vendor not found)');
        return false;
      }

      // Check if vendor is temporarily offline due to stale GPS
      if (vendor.is_temporarily_offline) {
        console.warn('[DIAGNOSTIC] Vendor is temporarily offline - NOT ELIGIBLE');
        console.log('[DIAGNOSTIC] RETURNING: FALSE (vendor offline)');
        return false;
      }

      // Check if vendor has location_metadata (GPS was captured)
      if (!vendor.location_metadata) {
        console.warn('[DIAGNOSTIC] Vendor has no GPS location metadata - NOT ELIGIBLE');
        console.log('[DIAGNOSTIC] RETURNING: FALSE (no GPS metadata)');
        return false;
      }

      // Check if vendor location is fresh
      const locationMetadata = typeof vendor.location_metadata === 'string' 
        ? JSON.parse(vendor.location_metadata) 
        : vendor.location_metadata;
      const lastUpdated = locationMetadata?.timestamp ? new Date(locationMetadata.timestamp) : null;
      
      if (!lastUpdated) {
        console.warn('[DIAGNOSTIC] Vendor location has no timestamp - NOT ELIGIBLE');
        console.log('[DIAGNOSTIC] RETURNING: FALSE (no location timestamp)');
        return false;
      }

      const gpsConfig = await this.orderEconomicsService.getPlatformConfig();
      const staleTimeoutMinutes = gpsConfig.gps_stale_timeout_minutes;
      const minutesSinceUpdate = (new Date().getTime() - lastUpdated.getTime()) / 60000;

      if (minutesSinceUpdate > staleTimeoutMinutes) {
        console.warn(`[DIAGNOSTIC] Vendor location is stale (${minutesSinceUpdate.toFixed(0)}m > ${staleTimeoutMinutes}m) - NOT ELIGIBLE`);
        console.log('[DIAGNOSTIC] RETURNING: FALSE (vendor location stale)');
        return false;
      }

      const driverToVendorDistance = this.calculateDistance(driver.current_location, vendorLocation);
      const vendorToCustomerDistance = this.calculateDistance(vendorLocation, customerLocation);
      const driverToCustomerDistance = this.calculateDistance(driver.current_location, customerLocation);

      const totalDistance = driverToVendorDistance + vendorToCustomerDistance;

      console.log(`🔍 [DIAGNOSTIC] Distance calculations:`);
      console.log(`🔍 [DIAGNOSTIC] - Driver coordinates:`, JSON.stringify(driver.current_location));
      console.log(`🔍 [DIAGNOSTIC] - Vendor coordinates:`, JSON.stringify(vendorLocation));
      console.log(`🔍 [DIAGNOSTIC] - Customer coordinates:`, JSON.stringify(customerLocation));
      console.log(`🔍 [DIAGNOSTIC] - Driver to vendor: ${driverToVendorDistance.toFixed(2)} km`);
      console.log(`🔍 [DIAGNOSTIC] - Vendor to customer: ${vendorToCustomerDistance.toFixed(2)} km`);
      console.log(`🔍 [DIAGNOSTIC] - Driver to customer: ${driverToCustomerDistance.toFixed(2)} km`);
      console.log(`🔍 [DIAGNOSTIC] - Total journey: ${totalDistance.toFixed(2)} km`);
      console.log(`🔍 [DIAGNOSTIC] - Vehicle type: ${vehicleType}`);

      // NEW RULE: Check Driver → Vendor distance
      if (driverToVendorDistance > restriction.max_driver_to_vendor_distance_km) {
        console.log(`❌ [DIAGNOSTIC] REJECTED: Driver→Vendor distance ${driverToVendorDistance.toFixed(2)} km exceeds max ${restriction.max_driver_to_vendor_distance_km} km`);
        console.log('🔍 [DIAGNOSTIC] RETURNING: FALSE (driver to vendor too far)');
        return false;
      }

      // NEW RULE: Check Vendor → Customer distance
      if (vendorToCustomerDistance > restriction.max_vendor_to_customer_distance_km) {
        console.log(`❌ [DIAGNOSTIC] REJECTED: Vendor→Customer distance ${vendorToCustomerDistance.toFixed(2)} km exceeds max ${restriction.max_vendor_to_customer_distance_km} km`);
        console.log('🔍 [DIAGNOSTIC] RETURNING: FALSE (vendor to customer too far)');
        return false;
      }

      // NEW RULE: Check Total Journey distance
      if (totalDistance > restriction.max_total_journey_distance_km) {
        console.log(`❌ [DIAGNOSTIC] REJECTED: Total journey ${totalDistance.toFixed(2)} km exceeds max ${restriction.max_total_journey_distance_km} km`);
        console.log('🔍 [DIAGNOSTIC] RETURNING: FALSE (total journey too far)');
        return false;
      }

      // Check bicycle pickup radius restriction (existing rule)
      if (vehicleType === 'bicycle') {
        const pickupRadius = config.bicycle_pickup_radius_km;
        if (driverToVendorDistance > pickupRadius) {
          console.log(`❌ [DIAGNOSTIC] REJECTED: Bicycle driver outside pickup radius (${driverToVendorDistance.toFixed(2)} km > ${pickupRadius} km)`);
          console.log('🔍 [DIAGNOSTIC] RETURNING: FALSE (bicycle pickup radius)');
          return false;
        }
      }

      // OPTIONAL: Check ETA safety limit for extreme cases
      if (restriction.max_eta_safety_limit_minutes) {
        const travelTimeMinutes = (totalDistance / 20) * 60; // Assume 20 km/h average speed
        const estimatedEtaMinutes = estimatedPreparationTime + travelTimeMinutes;
        
        if (estimatedEtaMinutes > restriction.max_eta_safety_limit_minutes) {
          console.log(`❌ [DIAGNOSTIC] REJECTED: ETA ${estimatedEtaMinutes.toFixed(0)} min exceeds safety limit ${restriction.max_eta_safety_limit_minutes} min`);
          console.log('🔍 [DIAGNOSTIC] RETURNING: FALSE (ETA safety limit exceeded)');
          return false;
        }
      }

      // Calculate ETA for informational purposes only
      const travelTimeMinutes = (totalDistance / 20) * 60;
      const estimatedEtaMinutes = estimatedPreparationTime + travelTimeMinutes;
      console.log(`⏱️ [INFO] Estimated ETA: ${estimatedEtaMinutes.toFixed(0)} minutes (prep: ${estimatedPreparationTime}, travel: ${travelTimeMinutes.toFixed(0)})`);

      console.log(`✅ [DIAGNOSTIC] ELIGIBLE: All distance rules passed`);
      console.log(`🔍 [DIAGNOSTIC] RETURNING: TRUE`);
      return true;
    } catch (error) {
      console.error('❌ [DIAGNOSTIC] Exception in isDriverEligibleForOrder:', error);
      console.log('🔍 [DIAGNOSTIC] RETURNING: TRUE (exception default)');
      return true; // Default to eligible on error
    }
  }
}

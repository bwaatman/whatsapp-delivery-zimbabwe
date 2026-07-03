import { supabase } from './database';

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

export class OrderEconomicsService {
  /**
   * Get platform configuration
   */
  async getPlatformConfig(): Promise<PlatformConfig> {
    try {
      console.log('💰 Fetching platform configuration');

      const { data: configs, error } = await supabase
        .from('platform_config')
        .select('key, value');

      if (error) {
        console.error('❌ Error fetching platform config:', error);
        // Return default values
        return {
          vendor_commission_rate: 12,
          driver_delivery_rate: 85,
          payout_day: 2,
          min_payout_amount: 100,
          service_fee: 10,
          vehicle_restrictions: {
            bicycle: { max_distance_km: 3, max_weight_kg: 5, max_eta_minutes: 25 },
            motorbike: { max_distance_km: 15, max_weight_kg: 25, max_eta_minutes: 45 },
            car: { max_distance_km: 999, max_weight_kg: 999, max_eta_minutes: 999 }
          },
          bicycle_pickup_radius_km: 2
        };
      }

      const configMap: Record<string, string> = {};
      if (configs) {
        configs.forEach(config => {
          configMap[config.key] = config.value;
        });
      }

      // Parse vehicle restrictions from config
      const vehicleRestrictions: Record<string, VehicleRestriction> = {
        bicycle: {
          max_distance_km: parseFloat(configMap['bicycle_max_distance'] || '3'),
          max_weight_kg: parseFloat(configMap['bicycle_max_weight'] || '5'),
          max_eta_minutes: parseFloat(configMap['bicycle_max_eta'] || '25')
        },
        motorbike: {
          max_distance_km: parseFloat(configMap['motorbike_max_distance'] || '15'),
          max_weight_kg: parseFloat(configMap['motorbike_max_weight'] || '25'),
          max_eta_minutes: parseFloat(configMap['motorbike_max_eta'] || '45')
        },
        car: {
          max_distance_km: parseFloat(configMap['car_max_distance'] || '999'),
          max_weight_kg: parseFloat(configMap['car_max_weight'] || '999'),
          max_eta_minutes: parseFloat(configMap['car_max_eta'] || '999')
        }
      };

      // Add any additional vehicle types from config
      Object.keys(configMap).forEach(key => {
        const match = key.match(/^(.+)_max_distance$/);
        if (match && !vehicleRestrictions[match[1]]) {
          const vehicleType = match[1];
          vehicleRestrictions[vehicleType] = {
            max_distance_km: parseFloat(configMap[`${vehicleType}_max_distance`] || '999'),
            max_weight_kg: parseFloat(configMap[`${vehicleType}_max_weight`] || '999'),
            max_eta_minutes: parseFloat(configMap[`${vehicleType}_max_eta`] || '999')
          };
        }
      });

      return {
        vendor_commission_rate: parseFloat(configMap['vendor_commission_rate'] || '12'),
        driver_delivery_rate: parseFloat(configMap['driver_delivery_rate'] || '85'),
        payout_day: parseInt(configMap['payout_day'] || '2'),
        min_payout_amount: parseFloat(configMap['min_payout_amount'] || '100'),
        service_fee: parseFloat(configMap['service_fee'] || '10'),
        vehicle_restrictions: vehicleRestrictions,
        bicycle_pickup_radius_km: parseFloat(configMap['bicycle_pickup_radius'] || '2')
      };
    } catch (error) {
      console.error('❌ Exception in getPlatformConfig:', error);
      return {
        vendor_commission_rate: 12,
        driver_delivery_rate: 85,
        payout_day: 2,
        min_payout_amount: 100,
        service_fee: 10,
        vehicle_restrictions: {
          bicycle: { max_distance_km: 3, max_weight_kg: 5, max_eta_minutes: 25 },
          motorbike: { max_distance_km: 15, max_weight_kg: 25, max_eta_minutes: 45 },
          car: { max_distance_km: 999, max_weight_kg: 999, max_eta_minutes: 999 }
        },
        bicycle_pickup_radius_km: 2
      };
    }
  }

  /**
   * Calculate delivery fee based on distance between vendor and customer
   */
  async calculateDeliveryFee(vendorLocation: any, customerLocation: any): Promise<number> {
    try {
      console.log('💰 Calculating delivery fee based on distance');

      // Extract coordinates from PostGIS geometry
      const vendorCoords = vendorLocation?.coordinates || vendorLocation;
      const customerCoords = customerLocation?.coordinates || customerLocation;

      if (!vendorCoords || !customerCoords || vendorCoords.length < 2 || customerCoords.length < 2) {
        console.warn('⚠️ Invalid coordinates, using default delivery fee');
        return 5.00; // Default delivery fee
      }

      // Calculate distance using Haversine formula (in km)
      const vendorLat = vendorCoords[1];
      const vendorLng = vendorCoords[0];
      const customerLat = customerCoords[1];
      const customerLng = customerCoords[0];

      const R = 6371; // Earth's radius in km
      const dLat = (customerLat - vendorLat) * Math.PI / 180;
      const dLng = (customerLng - vendorLng) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(vendorLat * Math.PI / 180) * Math.cos(customerLat * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distanceKm = R * c;

      console.log(`📍 Distance calculated: ${distanceKm.toFixed(2)} km`);

      // Calculate delivery fee: $2 base + $0.50 per km
      const baseFee = 2.00;
      const perKmFee = 0.50;
      const deliveryFee = baseFee + (distanceKm * perKmFee);

      // Cap maximum delivery fee at $15
      const maxFee = 15.00;
      const finalFee = Math.min(deliveryFee, maxFee);

      console.log(`💰 Delivery fee calculated: $${finalFee.toFixed(2)}`);
      return finalFee;
    } catch (error) {
      console.error('❌ Error calculating delivery fee:', error);
      return 5.00; // Default delivery fee on error
    }
  }

  /**
   * Calculate order economics
   */
  async calculateOrderEconomics(foodAmount: number, deliveryFee: number): Promise<OrderEconomics> {
    try {
      console.log(`💰 Calculating order economics: Food=${foodAmount}, Delivery=${deliveryFee}`);

      const config = await this.getPlatformConfig();

      // Calculate totals
      const serviceFee = config.service_fee;
      const total = foodAmount + deliveryFee + serviceFee;

      // Calculate vendor commission
      const vendorCommissionRate = config.vendor_commission_rate / 100;
      const vendorCommission = foodAmount * vendorCommissionRate;
      const vendorEarnings = foodAmount - vendorCommission;

      // Calculate driver delivery split
      const driverDeliveryRate = config.driver_delivery_rate / 100;
      const driverDeliveryEarnings = deliveryFee * driverDeliveryRate;
      const platformDeliveryMargin = deliveryFee - driverDeliveryEarnings;

      // Calculate platform revenue
      const platformRevenue = vendorCommission + platformDeliveryMargin + serviceFee;

      const economics: OrderEconomics = {
        food_amount: foodAmount,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        total: total,
        
        vendor_commission_rate: config.vendor_commission_rate,
        vendor_commission: vendorCommission,
        vendor_earnings: vendorEarnings,
        
        driver_delivery_rate: config.driver_delivery_rate,
        driver_delivery_earnings: driverDeliveryEarnings,
        platform_delivery_margin: platformDeliveryMargin,
        
        platform_revenue: platformRevenue,
        
        total_driver_earnings: driverDeliveryEarnings,
        total_vendor_earnings: vendorEarnings
      };

      console.log('✅ Order economics calculated:', economics);
      return economics;
    } catch (error) {
      console.error('❌ Exception in calculateOrderEconomics:', error);
      throw error;
    }
  }

  /**
   * Update order with economics data
   */
  async updateOrderWithEconomics(orderId: string, economics: OrderEconomics): Promise<boolean> {
    try {
      console.log(`💰 Updating order ${orderId} with economics`);

      const { error } = await supabase
        .from('orders')
        .update({
          food_amount: economics.food_amount,
          delivery_fee: economics.delivery_fee,
          service_fee: economics.service_fee,
          vendor_commission: economics.vendor_commission,
          vendor_earnings: economics.vendor_earnings,
          driver_earnings: economics.driver_delivery_earnings,
          platform_revenue: economics.platform_revenue
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Error updating order with economics:', error);
        return false;
      }

      console.log('✅ Order updated with economics successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in updateOrderWithEconomics:', error);
      return false;
    }
  }

  /**
   * Process order completion - calculate and distribute earnings
   */
  async processOrderCompletion(orderId: string, vendorId: string, driverId: string): Promise<boolean> {
    try {
      console.log(`💰 Processing order completion for order ${orderId}`);

      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('❌ Error fetching order:', orderError);
        return false;
      }

      // Calculate economics if not already calculated
      let economics: OrderEconomics;
      if (order.food_amount && order.delivery_fee) {
        economics = {
          food_amount: order.food_amount,
          delivery_fee: order.delivery_fee,
          service_fee: order.service_fee || 0,
          total: (order.food_amount || 0) + (order.delivery_fee || 0) + (order.service_fee || 0),
          vendor_commission_rate: 12, // Will be fetched from config
          vendor_commission: order.vendor_commission || 0,
          vendor_earnings: order.vendor_earnings || 0,
          driver_delivery_rate: 85, // Will be fetched from config
          driver_delivery_earnings: order.driver_earnings || 0,
          platform_delivery_margin: 0,
          platform_revenue: order.platform_revenue || 0,
          total_driver_earnings: order.driver_earnings || 0,
          total_vendor_earnings: order.vendor_earnings || 0
        };
      } else {
        // Calculate from order details
        const orderDetails = JSON.parse(order.order_details || '[]');
        const foodAmount = orderDetails.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
        economics = await this.calculateOrderEconomics(foodAmount, order.delivery_fee || 40);
        
        // Update order with economics
        await this.updateOrderWithEconomics(orderId, economics);
      }

      // Import WalletService dynamically to avoid circular dependency
      const { WalletService } = await import('./WalletService');
      const walletService = new WalletService();

      // Import CashReconciliationService for cash order handling
      const { CashReconciliationService } = await import('./CashReconciliationService');
      const cashReconciliationService = new CashReconciliationService();

      // Create wallet transactions for vendor
      const vendorWallet = await walletService.getOrCreateWallet(vendorId, 'vendor');
      if (vendorWallet && vendorWallet.id) {
        await walletService.recordTransaction({
          wallet_id: vendorWallet.id,
          transaction_type: 'earning',
          amount: economics.total_vendor_earnings,
          balance_after: 0, // Will be calculated by the method
          reference_id: orderId,
          reference_type: 'order',
          description: `Order ${orderId.substring(0, 8)} - Food sales`,
          status: 'completed'
        });
      }

      // Handle driver earnings based on payment method
      if (driverId) {
        const driverWallet = await walletService.getOrCreateWallet(driverId, 'driver');
        
        if (order.payment_method === 'cash' || order.payment_method === 'ecocash') {
          // For cash/ecocash orders, driver owes platform the order total minus their earnings
          const orderTotal = economics.total;
          const driverEarnings = economics.driver_delivery_earnings;
          const amountOwed = orderTotal - driverEarnings;
          
          console.log(`💵 ${order.payment_method.toUpperCase()} order: Driver owes platform $${amountOwed.toFixed(2)}`);
          
          // Record driver debt
          const { error: debtError } = await supabase
            .from('driver_debts')
            .insert({
              driver_id: driverId,
              order_id: orderId,
              amount_owed: amountOwed,
              status: 'pending',
              created_at: new Date().toISOString()
            });

          if (debtError) {
            console.error('❌ Error creating driver debt:', debtError);
          } else {
            console.log('✅ Driver debt recorded successfully');
          }

          // Record cash collected by driver
          await supabase
            .from('orders')
            .update({
              cash_collected: orderTotal,
              cash_collected_at: new Date().toISOString()
            })
            .eq('id', orderId);

        } else {
          // For card orders, driver gets their earnings directly
          if (driverWallet && driverWallet.id) {
            await walletService.recordTransaction({
              wallet_id: driverWallet.id,
              transaction_type: 'earning',
              amount: economics.total_driver_earnings,
              balance_after: 0, // Will be calculated by the method
              reference_id: orderId,
              reference_type: 'order',
              description: `Order ${orderId.substring(0, 8)} - Delivery`,
              status: 'completed'
            });
          }
        }
      }

      // Record platform revenue
      const platformWallet = await walletService.getOrCreateWallet('platform', 'platform');
      if (platformWallet && platformWallet.id) {
        await walletService.recordTransaction({
          wallet_id: platformWallet.id,
          transaction_type: 'earning',
          amount: economics.platform_revenue,
          balance_after: 0, // Will be calculated by the method
          reference_id: orderId,
          reference_type: 'order',
          description: `Order ${orderId.substring(0, 8)} - Platform revenue`,
          status: 'completed'
        });
      }

      console.log('✅ Order completion processed successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in processOrderCompletion:', error);
      return false;
    }
  }

  /**
   * Update platform configuration
   */
  async updatePlatformConfig(key: string, value: string): Promise<boolean> {
    try {
      console.log(`💰 Updating platform config: ${key} = ${value}`);

      const { error } = await supabase
        .from('platform_config')
        .update({ value: value, updated_at: new Date().toISOString() })
        .eq('key', key);

      if (error) {
        console.error('❌ Error updating platform config:', error);
        return false;
      }

      console.log('✅ Platform config updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in updatePlatformConfig:', error);
      return false;
    }
  }
}

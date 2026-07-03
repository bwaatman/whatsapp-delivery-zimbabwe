import { supabase } from './database';

export interface DriverSettlement {
  driver_id: string;
  driver_name: string;
  driver_phone: string;
  period_start: string;
  period_end: string;
  
  // Earnings
  total_deliveries: number;
  delivery_earnings: number;
  
  // Cash handling
  cash_collected: number;
  cash_debts: number;
  cash_owed_to_platform: number;
  
  // Net settlement
  net_payout: number;
  
  // Breakdown
  card_orders: number;
  cash_orders: number;
  card_earnings: number;
  cash_earnings: number;
}

export class DriverSettlementService {
  /**
   * Calculate weekly settlement for a driver
   */
  async calculateWeeklySettlement(driverId: string, weekStart: Date, weekEnd: Date): Promise<DriverSettlement | null> {
    try {
      console.log(`💰 Calculating weekly settlement for driver ${driverId} from ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

      // Get driver details
      const { data: driver, error: driverError } = await supabase
        .from('drivers')
        .select('id, name, phone')
        .eq('id', driverId)
        .single();

      if (driverError || !driver) {
        console.error('❌ Error fetching driver:', driverError);
        return null;
      }

      // Get completed orders for the period
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('assigned_driver_id', driverId)
        .eq('status', 'delivered')
        .gte('actual_delivery_time', weekStart.toISOString())
        .lte('actual_delivery_time', weekEnd.toISOString());

      if (ordersError) {
        console.error('❌ Error fetching orders:', ordersError);
        return null;
      }

      if (!orders || orders.length === 0) {
        console.log('ℹ️ No completed orders for this period');
        return null;
      }

      // Calculate earnings
      let totalDeliveries = orders.length;
      let deliveryEarnings = 0;
      let cashCollected = 0;
      let cardOrders = 0;
      let cashOrders = 0;
      let cardEarnings = 0;
      let cashEarnings = 0;

      orders.forEach(order => {
        const earnings = order.driver_earnings || 0;
        deliveryEarnings += earnings;

        if (order.payment_method === 'cash') {
          cashOrders++;
          cashCollected += order.cash_collected || 0;
          cashEarnings += earnings;
        } else {
          cardOrders++;
          cardEarnings += earnings;
        }
      });

      // Get driver debts for the period
      const { data: debts, error: debtsError } = await supabase
        .from('driver_debts')
        .select('*')
        .eq('driver_id', driverId)
        .in('status', ['pending', 'partially_paid'])
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString());

      let cashDebts = 0;
      if (debts) {
        cashDebts = debts.reduce((sum, debt) => sum + parseFloat(String(debt.amount_owed)), 0);
      }

      // Calculate cash owed to platform (order total - driver earnings for cash orders)
      const cashOwedToPlatform = cashDebts;

      // Calculate net payout
      // For card orders: driver gets earnings directly
      // For cash orders: driver keeps earnings but owes platform the rest
      const netPayout = cardEarnings + cashEarnings - cashOwedToPlatform;

      const settlement: DriverSettlement = {
        driver_id: driver.id,
        driver_name: driver.name,
        driver_phone: driver.phone,
        period_start: weekStart.toISOString(),
        period_end: weekEnd.toISOString(),
        
        total_deliveries: totalDeliveries,
        delivery_earnings: deliveryEarnings,
        
        cash_collected: cashCollected,
        cash_debts: cashDebts,
        cash_owed_to_platform: cashOwedToPlatform,
        
        net_payout: netPayout,
        
        card_orders: cardOrders,
        cash_orders: cashOrders,
        card_earnings: cardEarnings,
        cash_earnings: cashEarnings
      };

      console.log('✅ Weekly settlement calculated:', settlement);
      return settlement;
    } catch (error) {
      console.error('❌ Exception in calculateWeeklySettlement:', error);
      return null;
    }
  }

  /**
   * Get settlement summary for all drivers for a week
   */
  async getWeeklySettlements(weekStart: Date, weekEnd: Date): Promise<DriverSettlement[]> {
    try {
      console.log(`💰 Getting weekly settlements for all drivers from ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);

      // Get all drivers who had completed orders in the period
      const { data: drivers, error: driversError } = await supabase
        .from('orders')
        .select('assigned_driver_id')
        .eq('status', 'delivered')
        .gte('actual_delivery_time', weekStart.toISOString())
        .lte('actual_delivery_time', weekEnd.toISOString())
        .not('assigned_driver_id', 'is', null);

      if (driversError) {
        console.error('❌ Error fetching drivers:', driversError);
        return [];
      }

      if (!drivers || drivers.length === 0) {
        console.log('ℹ️ No drivers with completed orders for this period');
        return [];
      }

      // Get unique driver IDs
      const uniqueDriverIds = [...new Set(drivers.map(d => d.assigned_driver_id))];

      // Calculate settlement for each driver
      const settlements: DriverSettlement[] = [];
      for (const driverId of uniqueDriverIds) {
        const settlement = await this.calculateWeeklySettlement(driverId, weekStart, weekEnd);
        if (settlement) {
          settlements.push(settlement);
        }
      }

      console.log(`✅ Retrieved ${settlements.length} driver settlements`);
      return settlements;
    } catch (error) {
      console.error('❌ Exception in getWeeklySettlements:', error);
      return [];
    }
  }

  /**
   * Get driver settlement report with order details
   */
  async getDriverSettlementReport(driverId: string, weekStart: Date, weekEnd: Date): Promise<any> {
    try {
      console.log(`💰 Getting detailed settlement report for driver ${driverId}`);

      // Get basic settlement
      const settlement = await this.calculateWeeklySettlement(driverId, weekStart, weekEnd);
      if (!settlement) {
        return null;
      }

      // Get detailed order information
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          merchants (
            name,
            shop_address
          )
        `)
        .eq('assigned_driver_id', driverId)
        .eq('status', 'delivered')
        .gte('actual_delivery_time', weekStart.toISOString())
        .lte('actual_delivery_time', weekEnd.toISOString())
        .order('actual_delivery_time', { ascending: true });

      if (ordersError) {
        console.error('❌ Error fetching order details:', ordersError);
      }

      // Get debt details
      const { data: debts, error: debtsError } = await supabase
        .from('driver_debts')
        .select('*')
        .eq('driver_id', driverId)
        .in('status', ['pending', 'partially_paid'])
        .gte('created_at', weekStart.toISOString())
        .lte('created_at', weekEnd.toISOString())
        .order('created_at', { ascending: true });

      if (debtsError) {
        console.error('❌ Error fetching debt details:', debtsError);
      }

      return {
        settlement,
        orders: orders || [],
        debts: debts || []
      };
    } catch (error) {
      console.error('❌ Exception in getDriverSettlementReport:', error);
      return null;
    }
  }
}

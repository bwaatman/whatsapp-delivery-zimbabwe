import { supabase } from './database';

export interface DriverDebt {
  id?: string;
  driver_id: string;
  order_id: string;
  amount_owed: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'written_off';
  created_at?: string;
  settled_at?: string;
  settlement_payout_id?: string;
}

export class CashReconciliationService {
  /**
   * Get total debt for a driver
   */
  async getDriverTotalDebt(driverId: string): Promise<number> {
    try {
      console.log(`💰 Getting total debt for driver ${driverId}`);

      const { data: debts, error } = await supabase
        .from('driver_debts')
        .select('amount_owed')
        .eq('driver_id', driverId)
        .in('status', ['pending', 'partially_paid']);

      if (error) {
        console.error('❌ Error fetching driver debts:', error);
        return 0;
      }

      const totalDebt = debts?.reduce((sum, debt) => sum + parseFloat(String(debt.amount_owed)), 0) || 0;

      console.log(`✅ Total debt for driver ${driverId}: ${totalDebt}`);
      return totalDebt;
    } catch (error) {
      console.error('❌ Exception in getDriverTotalDebt:', error);
      return 0;
    }
  }

  /**
   * Get all pending debts for a driver
   */
  async getDriverDebts(driverId: string): Promise<DriverDebt[]> {
    try {
      console.log(`💰 Getting debts for driver ${driverId}`);

      const { data: debts, error } = await supabase
        .from('driver_debts')
        .select('*')
        .eq('driver_id', driverId)
        .in('status', ['pending', 'partially_paid'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching driver debts:', error);
        return [];
      }

      console.log(`✅ Retrieved ${debts?.length || 0} debts for driver ${driverId}`);
      return (debts || []) as DriverDebt[];
    } catch (error) {
      console.error('❌ Exception in getDriverDebts:', error);
      return [];
    }
  }

  /**
   * Settle debt during payout
   */
  async settleDebt(debtId: string, payoutId: string, amount: number): Promise<boolean> {
    try {
      console.log(`💰 Settling debt ${debtId} with payout ${payoutId}: ${amount}`);

      // Get debt details
      const { data: debt, error: debtError } = await supabase
        .from('driver_debts')
        .select('*')
        .eq('id', debtId)
        .single();

      if (debtError || !debt) {
        console.error('❌ Error fetching debt:', debtError);
        return false;
      }

      const amountOwed = parseFloat(String(debt.amount_owed));
      const remainingDebt = amountOwed - amount;

      if (remainingDebt <= 0) {
        // Debt fully paid
        const { error: updateError } = await supabase
          .from('driver_debts')
          .update({
            status: 'paid',
            settled_at: new Date().toISOString(),
            settlement_payout_id: payoutId
          })
          .eq('id', debtId);

        if (updateError) {
          console.error('❌ Error settling debt:', updateError);
          return false;
        }
      } else {
        // Partial payment
        const { error: updateError } = await supabase
          .from('driver_debts')
          .update({
            amount_owed: remainingDebt,
            status: 'partially_paid'
          })
          .eq('id', debtId);

        if (updateError) {
          console.error('❌ Error updating debt:', updateError);
          return false;
        }
      }

      console.log('✅ Debt settled successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in settleDebt:', error);
      return false;
    }
  }

  /**
   * Write off debt
   */
  async writeOffDebt(debtId: string, reason: string): Promise<boolean> {
    try {
      console.log(`💰 Writing off debt ${debtId}: ${reason}`);

      const { error } = await supabase
        .from('driver_debts')
        .update({
          status: 'written_off',
          settled_at: new Date().toISOString()
        })
        .eq('id', debtId);

      if (error) {
        console.error('❌ Error writing off debt:', error);
        return false;
      }

      console.log('✅ Debt written off successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in writeOffDebt:', error);
      return false;
    }
  }

  /**
   * Get all pending debts for all drivers
   */
  async getAllPendingDebts(): Promise<DriverDebt[]> {
    try {
      console.log('💰 Getting all pending debts');

      const { data: debts, error } = await supabase
        .from('driver_debts')
        .select('*')
        .in('status', ['pending', 'partially_paid'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching pending debts:', error);
        return [];
      }

      console.log(`✅ Retrieved ${debts?.length || 0} pending debts`);
      return (debts || []) as DriverDebt[];
    } catch (error) {
      console.error('❌ Exception in getAllPendingDebts:', error);
      return [];
    }
  }

  /**
   * Reconcile cash for a period
   */
  async reconcileCashForPeriod(startDate: Date, endDate: Date): Promise<{ reconciled: number; unreconciled: number; debts: number }> {
    try {
      console.log(`💰 Reconciling cash for period ${startDate} to ${endDate}`);

      // Get all COD orders in the period
      const { data: orders, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('payment_method', 'cod')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (orderError) {
        console.error('❌ Error fetching orders:', orderError);
        return { reconciled: 0, unreconciled: 0, debts: 0 };
      }

      let reconciled = 0;
      let unreconciled = 0;
      let totalDebts = 0;

      if (orders) {
        orders.forEach(order => {
          if (order.cash_collected !== null) {
            reconciled++;
          } else {
            unreconciled++;
          }
        });
      }

      // Get total debts for the period
      const { data: debts, error: debtError } = await supabase
        .from('driver_debts')
        .select('amount_owed')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .in('status', ['pending', 'partially_paid']);

      if (!debtError && debts) {
        totalDebts = debts.reduce((sum, debt) => sum + parseFloat(String(debt.amount_owed)), 0);
      }

      console.log(`✅ Cash reconciliation: Reconciled=${reconciled}, Unreconciled=${unreconciled}, Debts=${totalDebts}`);
      return { reconciled, unreconciled, debts: totalDebts };
    } catch (error) {
      console.error('❌ Exception in reconcileCashForPeriod:', error);
      return { reconciled: 0, unreconciled: 0, debts: 0 };
    }
  }

  /**
   * Get debt summary for admin dashboard
   */
  async getDebtSummary(): Promise<{ totalDebt: number; pendingDebts: number; writtenOffDebts: number; driverCount: number }> {
    try {
      console.log('💰 Getting debt summary');

      // Get total pending debt
      const { data: pendingDebts, error: pendingError } = await supabase
        .from('driver_debts')
        .select('amount_owed')
        .in('status', ['pending', 'partially_paid']);

      // Get total written off debt
      const { data: writtenOffDebts, error: writtenOffError } = await supabase
        .from('driver_debts')
        .select('amount_owed')
        .eq('status', 'written_off');

      // Get unique drivers with debt
      const { data: driversWithDebt, error: driverError } = await supabase
        .from('driver_debts')
        .select('driver_id')
        .in('status', ['pending', 'partially_paid']);

      const totalDebt = pendingDebts?.reduce((sum, debt) => sum + parseFloat(String(debt.amount_owed)), 0) || 0;
      const writtenOffTotal = writtenOffDebts?.reduce((sum, debt) => sum + parseFloat(String(debt.amount_owed)), 0) || 0;
      const pendingCount = pendingDebts?.length || 0;
      const driverCount = new Set(driversWithDebt?.map(d => d.driver_id)).size;

      console.log('✅ Debt summary retrieved');
      return {
        totalDebt,
        pendingDebts: pendingCount,
        writtenOffDebts: writtenOffTotal,
        driverCount
      };
    } catch (error) {
      console.error('❌ Exception in getDebtSummary:', error);
      return { totalDebt: 0, pendingDebts: 0, writtenOffDebts: 0, driverCount: 0 };
    }
  }
}

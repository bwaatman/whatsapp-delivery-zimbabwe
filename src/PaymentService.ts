import { supabase } from './database';

export interface PaymentIntent {
  id?: string;
  order_id: string;
  payment_method: 'online' | 'cod';
  payment_status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  amount: number;
  payment_gateway_reference?: string;
  created_at?: string;
  updated_at?: string;
}

export class PaymentService {
  /**
   * Initialize payment for an order
   */
  async initializePayment(orderId: string, paymentMethod: 'online' | 'cod', amount: number): Promise<PaymentIntent | null> {
    try {
      console.log(`💳 Initializing payment for order ${orderId}: ${paymentMethod}, ${amount}`);

      // Update order with payment method and status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({
          payment_method: paymentMethod,
          payment_status: 'pending'
        })
        .eq('id', orderId)
        .select()
        .single();

      if (orderError) {
        console.error('❌ Error initializing payment:', orderError);
        return null;
      }

      const paymentIntent: PaymentIntent = {
        order_id: orderId,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'completed' : 'pending',
        amount: amount
      };

      // For COD, payment is considered "completed" (cash will be collected later)
      // For online payment, payment status remains "pending" until payment gateway confirms

      console.log('✅ Payment initialized successfully');
      return paymentIntent;
    } catch (error) {
      console.error('❌ Exception in initializePayment:', error);
      return null;
    }
  }

  /**
   * Process online payment (placeholder for payment gateway integration)
   */
  async processOnlinePayment(orderId: string, paymentDetails: any): Promise<boolean> {
    try {
      console.log(`💳 Processing online payment for order ${orderId}`);

      // TODO: Integrate with payment gateway (Stripe, PayPal, etc.)
      // For now, we'll simulate payment processing

      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update order payment status
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          payment_gateway_reference: paymentDetails.reference || 'simulated'
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Error processing online payment:', error);
        return false;
      }

      console.log('✅ Online payment processed successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in processOnlinePayment:', error);
      return false;
    }
  }

  /**
   * Record cash collection by driver
   */
  async recordCashCollection(orderId: string, driverId: string, cashCollected: number): Promise<boolean> {
    try {
      console.log(`💵 Recording cash collection for order ${orderId}: ${cashCollected}`);

      // Update order with cash collection details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({
          cash_collected: cashCollected,
          cash_collected_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (orderError) {
        console.error('❌ Error recording cash collection:', orderError);
        return false;
      }

      // Calculate debt/credit for driver
      const driverEarnings = order?.driver_earnings || 0;
      const difference = cashCollected - driverEarnings;

      if (difference < 0) {
        // Driver owes platform money
        await this.createDriverDebt(driverId, orderId, Math.abs(difference));
      } else if (difference > 0) {
        // Platform owes driver money (credit)
        await this.createDriverCredit(driverId, orderId, difference);
      }

      console.log('✅ Cash collection recorded successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in recordCashCollection:', error);
      return false;
    }
  }

  /**
   * Create driver debt
   */
  private async createDriverDebt(driverId: string, orderId: string, amount: number): Promise<void> {
    try {
      console.log(`💰 Creating driver debt: ${amount} for driver ${driverId}`);

      const { error } = await supabase
        .from('driver_debts')
        .insert({
          driver_id: driverId,
          order_id: orderId,
          amount_owed: amount,
          status: 'pending'
        });

      if (error) {
        console.error('❌ Error creating driver debt:', error);
      }

      console.log('✅ Driver debt created successfully');
    } catch (error) {
      console.error('❌ Exception in createDriverDebt:', error);
    }
  }

  /**
   * Create driver credit
   */
  private async createDriverCredit(driverId: string, orderId: string, amount: number): Promise<void> {
    try {
      console.log(`💰 Creating driver credit: ${amount} for driver ${driverId}`);

      // Import WalletService dynamically
      const { WalletService } = await import('./WalletService');
      const walletService = new WalletService();

      // Add credit to driver wallet
      await walletService.addEarnings(
        driverId,
        'driver',
        amount,
        orderId,
        `Cash over-collection credit for order ${orderId.substring(0, 8)}...`
      );

      console.log('✅ Driver credit created successfully');
    } catch (error) {
      console.error('❌ Exception in createDriverCredit:', error);
    }
  }

  /**
   * Process refund
   */
  async processRefund(orderId: string, refundAmount: number, reason: string): Promise<boolean> {
    try {
      console.log(`💳 Processing refund for order ${orderId}: ${refundAmount}`);

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

      // Check if payment was online
      if (order.payment_method === 'online') {
        // TODO: Process refund via payment gateway
        // For now, we'll just update the order status
      }

      // Update order payment status
      const { error } = await supabase
        .from('orders')
        .update({
          payment_status: 'refunded'
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Error processing refund:', error);
        return false;
      }

      // Adjust vendor and driver earnings if order was completed
      if (order.status === 'completed' || order.status === 'delivered') {
        await this.adjustEarningsForRefund(orderId, order.merchant_id, refundAmount, reason);
      }

      console.log('✅ Refund processed successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in processRefund:', error);
      return false;
    }
  }

  /**
   * Adjust earnings for refund
   */
  private async adjustEarningsForRefund(orderId: string, vendorId: string, refundAmount: number, reason: string): Promise<void> {
    try {
      console.log(`💰 Adjusting earnings for refund: ${refundAmount}`);

      // Import WalletService dynamically
      const { WalletService } = await import('./WalletService');
      const walletService = new WalletService();

      // Deduct refund from vendor wallet
      await walletService.deductCommission(
        vendorId,
        'vendor',
        refundAmount,
        orderId,
        `Refund for order ${orderId.substring(0, 8)}...: ${reason}`
      );

      console.log('✅ Earnings adjusted for refund successfully');
    } catch (error) {
      console.error('❌ Exception in adjustEarningsForRefund:', error);
    }
  }

  /**
   * Handle order cancellation
   */
  async handleOrderCancellation(orderId: string, cancellationReason: string): Promise<boolean> {
    try {
      console.log(`❌ Handling order cancellation for order ${orderId}`);

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

      // If payment was already completed, process refund
      if (order.payment_status === 'completed') {
        await this.processRefund(orderId, order.food_amount || 0, `Order cancelled: ${cancellationReason}`);
      }

      // Update order status
      const { error } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          payment_status: 'refunded'
        })
        .eq('id', orderId);

      if (error) {
        console.error('❌ Error handling order cancellation:', error);
        return false;
      }

      console.log('✅ Order cancellation handled successfully');
      return true;
    } catch (error) {
      console.error('❌ Exception in handleOrderCancellation:', error);
      return false;
    }
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: string): Promise<PaymentIntent | null> {
    try {
      console.log(`💳 Getting payment status for order ${orderId}`);

      const { data: order, error } = await supabase
        .from('orders')
        .select('payment_method, payment_status, payment_gateway_reference')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        console.error('❌ Error fetching payment status:', error);
        return null;
      }

      const paymentIntent: PaymentIntent = {
        order_id: orderId,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        amount: 0, // Would need to calculate from order details
        payment_gateway_reference: order.payment_gateway_reference
      };

      console.log('✅ Payment status retrieved successfully');
      return paymentIntent;
    } catch (error) {
      console.error('❌ Exception in getPaymentStatus:', error);
      return null;
    }
  }
}

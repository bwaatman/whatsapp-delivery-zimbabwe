"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const database_1 = require("./database");
class PaymentService {
    /**
     * Initialize payment for an order
     */
    async initializePayment(orderId, paymentMethod, amount) {
        try {
            console.log(`💳 Initializing payment for order ${orderId}: ${paymentMethod}, ${amount}`);
            // Update order with payment method and status
            const { data: order, error: orderError } = await database_1.supabase
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
            const paymentIntent = {
                order_id: orderId,
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'cod' ? 'completed' : 'pending',
                amount: amount
            };
            // For COD, payment is considered "completed" (cash will be collected later)
            // For online payment, payment status remains "pending" until payment gateway confirms
            console.log('✅ Payment initialized successfully');
            return paymentIntent;
        }
        catch (error) {
            console.error('❌ Exception in initializePayment:', error);
            return null;
        }
    }
    /**
     * Process online payment (placeholder for payment gateway integration)
     */
    async processOnlinePayment(orderId, paymentDetails) {
        try {
            console.log(`💳 Processing online payment for order ${orderId}`);
            // TODO: Integrate with payment gateway (Stripe, PayPal, etc.)
            // For now, we'll simulate payment processing
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            // Update order payment status
            const { error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in processOnlinePayment:', error);
            return false;
        }
    }
    /**
     * Record cash collection by driver
     */
    async recordCashCollection(orderId, driverId, cashCollected) {
        try {
            console.log(`💵 Recording cash collection for order ${orderId}: ${cashCollected}`);
            // Update order with cash collection details
            const { data: order, error: orderError } = await database_1.supabase
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
            }
            else if (difference > 0) {
                // Platform owes driver money (credit)
                await this.createDriverCredit(driverId, orderId, difference);
            }
            console.log('✅ Cash collection recorded successfully');
            return true;
        }
        catch (error) {
            console.error('❌ Exception in recordCashCollection:', error);
            return false;
        }
    }
    /**
     * Create driver debt
     */
    async createDriverDebt(driverId, orderId, amount) {
        try {
            console.log(`💰 Creating driver debt: ${amount} for driver ${driverId}`);
            const { error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in createDriverDebt:', error);
        }
    }
    /**
     * Create driver credit
     */
    async createDriverCredit(driverId, orderId, amount) {
        try {
            console.log(`💰 Creating driver credit: ${amount} for driver ${driverId}`);
            // Import WalletService dynamically
            const { WalletService } = await Promise.resolve().then(() => __importStar(require('./WalletService')));
            const walletService = new WalletService();
            // Add credit to driver wallet
            await walletService.addEarnings(driverId, 'driver', amount, orderId, `Cash over-collection credit for order ${orderId.substring(0, 8)}...`);
            console.log('✅ Driver credit created successfully');
        }
        catch (error) {
            console.error('❌ Exception in createDriverCredit:', error);
        }
    }
    /**
     * Process refund
     */
    async processRefund(orderId, refundAmount, reason) {
        try {
            console.log(`💳 Processing refund for order ${orderId}: ${refundAmount}`);
            // Get order details
            const { data: order, error: orderError } = await database_1.supabase
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
            const { error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in processRefund:', error);
            return false;
        }
    }
    /**
     * Adjust earnings for refund
     */
    async adjustEarningsForRefund(orderId, vendorId, refundAmount, reason) {
        try {
            console.log(`💰 Adjusting earnings for refund: ${refundAmount}`);
            // Import WalletService dynamically
            const { WalletService } = await Promise.resolve().then(() => __importStar(require('./WalletService')));
            const walletService = new WalletService();
            // Deduct refund from vendor wallet
            await walletService.deductCommission(vendorId, 'vendor', refundAmount, orderId, `Refund for order ${orderId.substring(0, 8)}...: ${reason}`);
            console.log('✅ Earnings adjusted for refund successfully');
        }
        catch (error) {
            console.error('❌ Exception in adjustEarningsForRefund:', error);
        }
    }
    /**
     * Handle order cancellation
     */
    async handleOrderCancellation(orderId, cancellationReason) {
        try {
            console.log(`❌ Handling order cancellation for order ${orderId}`);
            // Get order details
            const { data: order, error: orderError } = await database_1.supabase
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
            const { error } = await database_1.supabase
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
        }
        catch (error) {
            console.error('❌ Exception in handleOrderCancellation:', error);
            return false;
        }
    }
    /**
     * Get payment status for an order
     */
    async getPaymentStatus(orderId) {
        try {
            console.log(`💳 Getting payment status for order ${orderId}`);
            const { data: order, error } = await database_1.supabase
                .from('orders')
                .select('payment_method, payment_status, payment_gateway_reference')
                .eq('id', orderId)
                .single();
            if (error || !order) {
                console.error('❌ Error fetching payment status:', error);
                return null;
            }
            const paymentIntent = {
                order_id: orderId,
                payment_method: order.payment_method,
                payment_status: order.payment_status,
                amount: 0, // Would need to calculate from order details
                payment_gateway_reference: order.payment_gateway_reference
            };
            console.log('✅ Payment status retrieved successfully');
            return paymentIntent;
        }
        catch (error) {
            console.error('❌ Exception in getPaymentStatus:', error);
            return null;
        }
    }
}
exports.PaymentService = PaymentService;
//# sourceMappingURL=PaymentService.js.map
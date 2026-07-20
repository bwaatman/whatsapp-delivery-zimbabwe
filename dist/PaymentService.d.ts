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
export declare class PaymentService {
    /**
     * Initialize payment for an order
     */
    initializePayment(orderId: string, paymentMethod: 'online' | 'cod', amount: number): Promise<PaymentIntent | null>;
    /**
     * Process online payment (placeholder for payment gateway integration)
     */
    processOnlinePayment(orderId: string, paymentDetails: any): Promise<boolean>;
    /**
     * Record cash collection by driver
     */
    recordCashCollection(orderId: string, driverId: string, cashCollected: number): Promise<boolean>;
    /**
     * Create driver debt
     */
    private createDriverDebt;
    /**
     * Create driver credit
     */
    private createDriverCredit;
    /**
     * Process refund
     */
    processRefund(orderId: string, refundAmount: number, reason: string): Promise<boolean>;
    /**
     * Adjust earnings for refund
     */
    private adjustEarningsForRefund;
    /**
     * Handle order cancellation
     */
    handleOrderCancellation(orderId: string, cancellationReason: string): Promise<boolean>;
    /**
     * Get payment status for an order
     */
    getPaymentStatus(orderId: string): Promise<PaymentIntent | null>;
}
//# sourceMappingURL=PaymentService.d.ts.map
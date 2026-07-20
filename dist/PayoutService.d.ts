export interface PayoutBatch {
    id?: string;
    batch_number: number;
    period_start: string;
    period_end: string;
    total_amount: number;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    created_at?: string;
    processed_at?: string;
    processed_by?: string;
}
export interface Payout {
    id?: string;
    batch_id?: string;
    user_id: string;
    user_type: 'driver' | 'vendor';
    gross_amount: number;
    debt_deductions: number;
    credit_additions: number;
    net_amount: number;
    status: 'pending' | 'approved' | 'processing' | 'completed' | 'failed' | 'rejected';
    bank_account_details?: any;
    created_at?: string;
    processed_at?: string;
    transaction_reference?: string;
    notes?: string;
}
export declare class PayoutService {
    /**
     * Generate a payout batch for a period
     */
    generatePayoutBatch(startDate: Date, endDate: Date): Promise<PayoutBatch | null>;
    /**
     * Get payout batch by ID
     */
    getPayoutBatch(batchId: string): Promise<PayoutBatch | null>;
    /**
     * Get all payouts for a batch
     */
    getPayoutsForBatch(batchId: string): Promise<Payout[]>;
    /**
     * Approve a payout
     */
    approvePayout(payoutId: string, approvedBy: string): Promise<boolean>;
    /**
     * Reject a payout
     */
    rejectPayout(payoutId: string, reason: string): Promise<boolean>;
    /**
     * Process payout batch
     */
    processPayoutBatch(batchId: string, processedBy: string): Promise<boolean>;
    /**
     * Get payout history for a user
     */
    getUserPayoutHistory(userId: string, userType: 'driver' | 'vendor', limit?: number): Promise<Payout[]>;
    /**
     * Get all pending payout batches
     */
    getPendingBatches(): Promise<PayoutBatch[]>;
    /**
     * Cancel a payout batch
     */
    cancelPayoutBatch(batchId: string): Promise<boolean>;
}
//# sourceMappingURL=PayoutService.d.ts.map
export interface Wallet {
    id?: string;
    user_id: string;
    user_type: 'driver' | 'vendor' | 'platform';
    available_balance: number;
    pending_balance: number;
    withheld_balance: number;
    created_at?: string;
    updated_at?: string;
}
export interface TransactionLedger {
    id?: string;
    wallet_id: string;
    transaction_type: 'earning' | 'deduction' | 'payout' | 'deposit' | 'refund' | 'debt' | 'credit' | 'adjustment' | 'withhold' | 'release';
    amount: number;
    balance_after: number;
    reference_id?: string;
    reference_type?: string;
    description?: string;
    status: 'pending' | 'completed' | 'failed';
    metadata?: any;
    created_at?: string;
}
export declare class WalletService {
    /**
     * Get or create a wallet for a user
     */
    getOrCreateWallet(userId: string, userType: 'driver' | 'vendor' | 'platform'): Promise<Wallet | null>;
    /**
     * Get wallet balance (recalculated from ledger)
     */
    getWalletBalance(walletId: string): Promise<{
        available: number;
        pending: number;
        withheld: number;
        total: number;
    } | null>;
    /**
     * Record a transaction in the ledger
     */
    recordTransaction(transaction: Omit<TransactionLedger, 'id' | 'created_at'>): Promise<TransactionLedger | null>;
    /**
     * Add earnings to wallet
     */
    addEarnings(userId: string, userType: 'driver' | 'vendor', amount: number, referenceId: string, description: string): Promise<boolean>;
    /**
     * Deduct commission from wallet
     */
    deductCommission(userId: string, userType: 'driver' | 'vendor', amount: number, referenceId: string, description: string): Promise<boolean>;
    /**
     * Process payout
     */
    processPayout(userId: string, userType: 'driver' | 'vendor', amount: number, referenceId: string, description: string): Promise<boolean>;
    /**
     * Get transaction history for a wallet
     */
    getTransactionHistory(walletId: string, limit?: number): Promise<TransactionLedger[]>;
}
//# sourceMappingURL=WalletService.d.ts.map
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
export declare class CashReconciliationService {
    /**
     * Get total debt for a driver
     */
    getDriverTotalDebt(driverId: string): Promise<number>;
    /**
     * Get all pending debts for a driver
     */
    getDriverDebts(driverId: string): Promise<DriverDebt[]>;
    /**
     * Settle debt during payout
     */
    settleDebt(debtId: string, payoutId: string, amount: number): Promise<boolean>;
    /**
     * Write off debt
     */
    writeOffDebt(debtId: string, reason: string): Promise<boolean>;
    /**
     * Get all pending debts for all drivers
     */
    getAllPendingDebts(): Promise<DriverDebt[]>;
    /**
     * Reconcile cash for a period
     */
    reconcileCashForPeriod(startDate: Date, endDate: Date): Promise<{
        reconciled: number;
        unreconciled: number;
        debts: number;
    }>;
    /**
     * Get debt summary for admin dashboard
     */
    getDebtSummary(): Promise<{
        totalDebt: number;
        pendingDebts: number;
        writtenOffDebts: number;
        driverCount: number;
    }>;
}
//# sourceMappingURL=CashReconciliationService.d.ts.map
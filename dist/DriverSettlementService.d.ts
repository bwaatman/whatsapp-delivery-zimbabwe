export interface DriverSettlement {
    driver_id: string;
    driver_name: string;
    driver_phone: string;
    period_start: string;
    period_end: string;
    total_deliveries: number;
    delivery_earnings: number;
    cash_collected: number;
    cash_debts: number;
    cash_owed_to_platform: number;
    net_payout: number;
    card_orders: number;
    cash_orders: number;
    card_earnings: number;
    cash_earnings: number;
}
export declare class DriverSettlementService {
    /**
     * Calculate weekly settlement for a driver
     */
    calculateWeeklySettlement(driverId: string, weekStart: Date, weekEnd: Date): Promise<DriverSettlement | null>;
    /**
     * Get settlement summary for all drivers for a week
     */
    getWeeklySettlements(weekStart: Date, weekEnd: Date): Promise<DriverSettlement[]>;
    /**
     * Get driver settlement report with order details
     */
    getDriverSettlementReport(driverId: string, weekStart: Date, weekEnd: Date): Promise<any>;
}
//# sourceMappingURL=DriverSettlementService.d.ts.map
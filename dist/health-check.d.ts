export declare function runHealthCheck(): Promise<{
    timestamp: string;
    database: {
        connection: boolean;
        schema: {
            merchants: boolean;
            drivers: boolean;
            orders: boolean;
            postgis: boolean;
        };
        operations: {
            insert: boolean;
            select: boolean;
            update: boolean;
            spatial: boolean;
        };
    };
    overall: string;
}>;
//# sourceMappingURL=health-check.d.ts.map
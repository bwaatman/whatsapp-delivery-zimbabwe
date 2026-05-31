import { SupabaseClient } from '@supabase/supabase-js';
export declare const supabase: SupabaseClient;
export declare function testDatabaseConnection(): Promise<{
    success: boolean;
    error: string;
    message?: undefined;
} | {
    success: boolean;
    message: string;
    error?: undefined;
}>;
export declare function verifyDatabaseSchema(): Promise<{
    merchants: boolean;
    drivers: boolean;
    orders: boolean;
    postgis: boolean;
}>;
export declare function testDatabaseOperations(): Promise<{
    insert: boolean;
    select: boolean;
    update: boolean;
    spatial: boolean;
}>;
//# sourceMappingURL=database.d.ts.map
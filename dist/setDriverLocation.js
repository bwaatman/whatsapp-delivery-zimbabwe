"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
async function testLocationUpdate() {
    const driverId = '7158c912-c5df-48e9-a90e-15eb3ffab9be';
    console.log('🔍 Testing location update for driver:', driverId);
    // Try the exact same method used in DriverService
    const latitude = -26.2041;
    const longitude = 28.0473;
    const locationQuery = `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;
    console.log('🔍 Using locationQuery:', locationQuery);
    const { data, error } = await supabase
        .from('drivers')
        .update({
        current_location: locationQuery,
        updated_at: new Date().toISOString()
    })
        .eq('id', driverId)
        .select()
        .single();
    console.log('🔍 Update result data:', data);
    console.log('🔍 Update result error:', error);
    if (error) {
        console.error('❌ Update failed with error:', error);
        // Try with a simple JSON geometry instead
        console.log('🔍 Trying with JSON geometry instead...');
        const { data: data2, error: error2 } = await supabase
            .from('drivers')
            .update({
            current_location: { type: 'Point', coordinates: [longitude, latitude] },
            updated_at: new Date().toISOString()
        })
            .eq('id', driverId)
            .select()
            .single();
        console.log('🔍 JSON geometry result data:', data2);
        console.log('🔍 JSON geometry result error:', error2);
    }
    else {
        console.log('✅ Update succeeded');
    }
    // Check final state
    const { data: finalState } = await supabase
        .from('drivers')
        .select('id, current_location, updated_at')
        .eq('id', driverId)
        .single();
    console.log('🔍 Final driver state:', finalState);
}
testLocationUpdate();
//# sourceMappingURL=setDriverLocation.js.map
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
async function checkDriverState() {
    const driverId = '7158c912-c5df-48e9-a90e-15eb3ffab9be';
    console.log('🔍 Checking driver state for:', driverId);
    const { data, error } = await supabase
        .from('drivers')
        .select('id, name, current_location, is_available, vehicle_type, updated_at')
        .eq('id', driverId)
        .single();
    if (error) {
        console.error('❌ Error fetching driver:', error);
        return;
    }
    console.log('✅ Driver record:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n📊 Analysis:');
    console.log('- current_location:', data.current_location ? 'HAS VALUE' : 'NULL');
    console.log('- is_available:', data.is_available);
    console.log('- vehicle_type:', data.vehicle_type || 'NULL');
    console.log('- updated_at:', data.updated_at);
}
checkDriverState();
//# sourceMappingURL=checkDriverState.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const driverId = '7158c912-c5df-48e9-a90e-15eb3ffab9be';
const url = `https://whatsapp-delivery-zimbabwe.onrender.com/api/driver/${driverId}/availability`;
async function testAvailabilityEndpoint() {
    console.log('🔍 Testing PUT /availability endpoint');
    console.log('🔍 URL:', url);
    const requestBody = {
        isAvailable: true,
        latitude: -26.059611761019845,
        longitude: 28.06096862196612
    };
    console.log('🔍 Request body:', requestBody);
    try {
        const response = await axios_1.default.put(url, requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Response status:', response.status);
        console.log('✅ Response data:', response.data);
    }
    catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}
testAvailabilityEndpoint();
//# sourceMappingURL=testAvailabilityEndpoint.js.map
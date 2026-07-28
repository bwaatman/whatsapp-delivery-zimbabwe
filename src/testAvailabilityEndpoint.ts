import axios from 'axios';

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
    const response = await axios.put(url, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data:', response.data);
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAvailabilityEndpoint();

import axios from 'axios';

async function testNewToken() {
  console.log('🔧 TESTING NEW WHATSAPP TOKEN\n');

  // Use the new token from your environment
  const phoneNumberId = '1169872976198533';
  const accessToken = process.env.WHATSAPP_TOKEN || '';
  const testNumber = '263700000000';

  console.log('📋 Configuration:');
  console.log('  Phone Number ID:', phoneNumberId);
  console.log('  Test Number:', testNumber);
  console.log('  Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : '❌ MISSING');
  console.log('  Token Length:', accessToken.length);

  if (!accessToken) {
    console.error('❌ WHATSAPP_TOKEN not found in environment variables');
    console.log('💡 Make sure WHATSAPP_TOKEN is set in your .env file');
    return;
  }

  const testPayload = {
    messaging_product: 'whatsapp',
    to: testNumber.replace(/[^\d]/g, ''),
    text: {
      body: '🎉 NEW TOKEN TEST - If you receive this, the token is working!'
    },
    type: 'text'
  };

  try {
    console.log('\n📤 Testing WhatsApp API with new token...');
    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    console.log('🌐 Request URL:', url);
    console.log('📋 Payload:', JSON.stringify(testPayload, null, 2));

    const response = await axios.post(url, testPayload, { headers });
    
    console.log('\n✅ SUCCESS! WhatsApp API test passed!');
    console.log('📬 Response:', JSON.stringify(response.data, null, 2));
    console.log('📱 Check your WhatsApp NOW - you should receive the test message!');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. If you received the test message → Token is working!');
    console.log('2. Send a real WhatsApp message: "I want 2 pizzas"');
    console.log('3. You should get an automated response');
    console.log('4. Your WhatsApp Delivery Platform is now working! 🚀');
    
  } catch (error: any) {
    console.error('\n❌ WhatsApp API test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📬 Error Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n💡 Still getting 401 - Token might still be expired or invalid');
        console.error('🛠️ Try generating a fresh token from Meta Developers');
      } else if (error.response.status === 400) {
        console.error('\n💡 400 Bad Request - Check phone number format or payload');
      } else if (error.response.status === 403) {
        console.error('\n💡 403 Forbidden - Check app permissions');
      }
    }
  }
}

testNewToken();

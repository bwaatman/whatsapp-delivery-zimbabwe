import axios from 'axios';

async function testRealNewToken() {
  console.log('🔧 TESTING YOUR REAL NEW TOKEN\n');

  const phoneNumberId = '1169872976198533';
  const newToken = 'EAAtLDXi1ZBYQBRlizonitn6j0VVF82dJ2CZCmbWB3HGKbOCCDnrjzA3YBlVqW7ZBlZAGHM4SzCXDY9u9GbVxZAvq5C8z1kCQeIU6TendyZBZAd86Ecb25NZCivFSgecAHmzM6ZAsisyUs059YhnncBEc9miPvOhbh6vpqB2nymmAdkyL4UiSHWKF2TjnCthZCCZB9svUuxDaedH5gczcVncS0oI76vcIc1imqoxpFHrYbEE9lY0DgqP8yzyeAZAcby1PCZA2SZBw3Lrf6mHtxSB0k1d4rZBRwZDZD';
  const testNumber = '263700000000';

  console.log('📋 Configuration:');
  console.log('  Phone Number ID:', phoneNumberId);
  console.log('  Test Number:', testNumber);
  console.log('  New Token Length:', newToken.length);
  console.log('  Token starts with:', newToken.substring(0, 20) + '...');

  const testPayload = {
    messaging_product: 'whatsapp',
    to: testNumber.replace(/[^\d]/g, ''),
    text: {
      body: '🎉 NEW TOKEN WORKS! - If you receive this, your WhatsApp Delivery Platform is FIXED! 🚀🇿🇼'
    },
    type: 'text'
  };

  try {
    console.log('\n📤 Testing WhatsApp API with your NEW token...');
    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    const headers = {
      'Authorization': `Bearer ${newToken}`,
      'Content-Type': 'application/json'
    };

    console.log('🌐 Request URL:', url);

    const response = await axios.post(url, testPayload, { headers });
    
    console.log('\n🎉🎉🎉 SUCCESS! WHATSAPP API IS WORKING! 🎉🎉🎉');
    console.log('📬 Response:', JSON.stringify(response.data, null, 2));
    console.log('📱 Check your WhatsApp RIGHT NOW - You should receive the test message!');
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. ✅ Your new token is working!');
    console.log('2. 📝 Update your .env file with this new token');
    console.log('3. 🌐 Update WHATSAPP_ACCESS_TOKEN in Render Dashboard');
    console.log('4. 🚀 Redeploy on Render');
    console.log('5. 📱 Test with real message: "I want 2 pizzas"');
    
    console.log('\n🎉 YOUR WHATSAPP DELIVERY PLATFORM IS ABOUT TO WORK! 🚀📱🇿🇼');
    
  } catch (error: any) {
    console.error('\n❌ WhatsApp API test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📬 Error Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n💡 Still getting 401 - There might be another issue');
        console.error('🛠️ Check if the token was copied correctly');
        console.error('🛠️ Verify phone number ID is correct');
      } else if (error.response.status === 400) {
        console.error('\n💡 400 Bad Request - Check phone number format');
      }
    }
  }
}

testRealNewToken();

import axios from 'axios';

async function testTokenDirect() {
  console.log('🔧 TESTING TOKEN DIRECTLY\n');

  // Please paste your new token here
  const newToken = 'PASTE_YOUR_NEW_TOKEN_HERE'; // Replace this with your actual new token
  
  const phoneNumberId = '1169872976198533';
  const testNumber = '263700000000';

  console.log('📋 Configuration:');
  console.log('  Phone Number ID:', phoneNumberId);
  console.log('  Test Number:', testNumber);
  console.log('  New Token:', newToken.substring(0, 20) + '...');
  console.log('  Token Length:', newToken.length);

  if (newToken === 'PASTE_YOUR_NEW_TOKEN_HERE') {
    console.error('❌ Please paste your new token in the script');
    console.log('💡 Edit this file and replace PASTE_YOUR_NEW_TOKEN_HERE with your actual token');
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
      'Authorization': `Bearer ${newToken}`,
      'Content-Type': 'application/json'
    };

    console.log('🌐 Request URL:', url);
    console.log('📋 Payload:', JSON.stringify(testPayload, null, 2));

    const response = await axios.post(url, testPayload, { headers });
    
    console.log('\n✅ SUCCESS! WhatsApp API test passed!');
    console.log('📬 Response:', JSON.stringify(response.data, null, 2));
    console.log('📱 Check your WhatsApp NOW - you should receive the test message!');
    
    console.log('\n🎯 IF SUCCESSFUL:');
    console.log('1. Update your .env file with this token');
    console.log('2. Update WHATSAPP_TOKEN in Render Dashboard');
    console.log('3. Redeploy on Render');
    console.log('4. Test with real WhatsApp message');
    
  } catch (error: any) {
    console.error('\n❌ WhatsApp API test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📬 Error Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n💡 Token is still invalid or expired');
        console.error('🛠️ Generate a fresh token from Meta Developers Dashboard');
      }
    }
  }
}

testTokenDirect();

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testCurrentToken() {
  console.log('🔧 TESTING CURRENT WHATSAPP_ACCESS_TOKEN\n');

  const phoneNumberId = '1169872976198533';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
  const testNumber = '263700000000';

  console.log('📋 Configuration:');
  console.log('  Phone Number ID:', phoneNumberId);
  console.log('  Test Number:', testNumber);
  console.log('  Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : '❌ MISSING');
  console.log('  Token Length:', accessToken.length);

  if (!accessToken) {
    console.error('❌ WHATSAPP_ACCESS_TOKEN not found in environment variables');
    return;
  }

  const testPayload = {
    messaging_product: 'whatsapp',
    to: testNumber.replace(/[^\d]/g, ''),
    text: {
      body: '🎉 CURRENT TOKEN TEST - If you receive this, it\'s working!'
    },
    type: 'text'
  };

  try {
    console.log('\n📤 Testing WhatsApp API with current token...');
    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    console.log('🌐 Request URL:', url);

    const response = await axios.post(url, testPayload, { headers });
    
    console.log('\n✅ SUCCESS! WhatsApp API test passed!');
    console.log('📬 Response:', JSON.stringify(response.data, null, 2));
    console.log('📱 Check your WhatsApp NOW - you should receive the test message!');
    
    console.log('\n🎯 IF YOU RECEIVED THE MESSAGE:');
    console.log('✅ Your new token is working!');
    console.log('✅ Your WhatsApp Delivery Platform should now work!');
    console.log('📱 Try sending: "I want 2 pizzas"');
    
  } catch (error: any) {
    console.error('\n❌ WhatsApp API test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📬 Error Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n💡 401 Unauthorized - Token is still expired');
        console.error('🛠️ Generate a fresh token from Meta Developers Dashboard');
        console.error('🛠️ Update WHATSAPP_ACCESS_TOKEN in your .env file');
      }
    }
  }
}

testCurrentToken();

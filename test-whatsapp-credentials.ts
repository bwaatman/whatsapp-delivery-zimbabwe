import axios from 'axios';

async function testWhatsAppCredentials() {
  console.log('🔍 TESTING WHATSAPP API CREDENTIALS ON RENDER\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com/health';
  
  try {
    // First check if Render is healthy
    const healthResponse = await axios.get(renderUrl);
    console.log('✅ Render server is healthy');
    console.log('📊 Health status:', healthResponse.data.status);
  } catch (error: any) {
    console.error('❌ Render health check failed:', error.message);
    return;
  }

  // Test WhatsApp API directly
  console.log('\n📱 Testing WhatsApp API credentials...');
  
  const phoneNumberId = '1169872976198533';
  const accessToken = 'EAAtLDXi1ZBYQBRSdx68W1RlvJ4xHGLRMRVauhCawA1nvW6UzhsF0l5ksNL5HCxeVe42gkR9mWBNZAFWOQpfcIjURBFpEdbEoU1ad0dtynnQb1avdTXc2humI0YNatFilZCCNezc8htdySSAMijDYP7qs946os80PRsVcXRwcaaPXjoCJBWSJooykk9jpZAxtCYKZBGxZBwV8rJ0TVruDQ9eeEiHsvLJZCQmngNMhMF3Eiv9hZAC69WGvT82vKZCHkmKOil56I1wfXWKGBg4HNqNVi';
  const testNumber = '27730210062'; // Your test number
  
  const payload = {
    messaging_product: 'whatsapp',
    to: testNumber.replace(/[^\d]/g, ''),
    text: {
      body: '🧪 Render Credential Test - This is a test message from your WhatsApp Delivery Platform!'
    },
    type: 'text'
  };

  console.log('📋 Test payload:', JSON.stringify(payload, null, 2));
  console.log('📞 Phone Number ID:', phoneNumberId);
  console.log('🔑 Access Token:', accessToken.substring(0, 20) + '...');

  try {
    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    console.log('🌐 Testing API call to:', url);
    
    const response = await axios.post(url, payload, { headers });
    
    console.log('✅ WhatsApp API call successful!');
    console.log('📬 Response:', JSON.stringify(response.data, null, 2));
    console.log('📱 You should receive a test message on WhatsApp now!');
    
  } catch (error: any) {
    console.error('❌ WhatsApp API test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📬 Error Response:', JSON.stringify(error.response.data, null, 2));
      
      switch (error.response.status) {
        case 400:
          console.error('💡 Bad Request - Check payload format');
          break;
        case 401:
          console.error('💡 Unauthorized - Check access token');
          break;
        case 403:
          console.error('💡 Forbidden - Check permissions');
          break;
        case 404:
          console.error('💡 Not Found - Check phone number ID');
          break;
        case 429:
          console.error('💡 Rate Limited - Too many requests');
          break;
        case 500:
          console.error('💡 Server Error - Meta API issue');
          break;
      }
    }
    
    console.error('\n🔍 If API test fails, check:');
    console.error('1. Access token is valid and not expired');
    console.error('2. Phone number ID is correct');
    console.error('3. WhatsApp Business API is approved');
    console.error('4. Test number is valid and can receive messages');
  }

  console.log('\n📋 NEXT STEPS:');
  console.log('1. If this test succeeds - credentials are good');
  console.log('2. Check Render logs for WhatsAppService logging');
  console.log('3. Look for "📤 Sending WhatsApp message..." in logs');
  console.log('4. Look for "❌ Failed to send WhatsApp message" errors');
}

testWhatsAppCredentials();

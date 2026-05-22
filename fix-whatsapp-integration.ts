import axios from 'axios';

async function testWhatsAppTokenAndSubscribe() {
  console.log('🔧 TESTING WHATSAPP TOKEN AND SUBSCRIPTION\n');

  // Test with a fresh token - you'll need to update this
  const phoneNumberId = '1169872976198533';
  const businessAccountId = '1291275779782158';
  let accessToken = 'EAAtLDXi1ZBYQBRSdx68W1RlvJ4xHGLRMRVauhCawA1nvW6UzhsF0l5ksNL5HCxeVe42gkR9mWBNZAFWOQpfcIjURBFpEdbEoU1ad0dtynnQb1avdTXc2humI0YNatFilZCCNezc8htdySSAMijDYP7qs946os80PRsVcXRwcaaPXjoCJBWSJooykk9jpZAxtCYKZBGxZBwV8rJ0TVruDQ9eeEiHsvLJZCQmngNMhMF3Eiv9hZAC69WGvT82vKZCHkmKOil56I1wfXWKGBg4HNqNVi';

  console.log('📋 Current configuration:');
  console.log('  Phone Number ID:', phoneNumberId);
  console.log('  Business Account ID:', businessAccountId);
  console.log('  Access Token:', accessToken.substring(0, 20) + '...');

  // Step 1: Test token validity
  console.log('\n1️⃣ Testing access token validity...');
  try {
    const testUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`
    };

    const response = await axios.get(testUrl, { headers });
    console.log('✅ Access token is valid');
    console.log('📬 Phone Number Info:', JSON.stringify(response.data, null, 2));

  } catch (error: any) {
    console.error('❌ Access token test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📬 Error:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('\n💡 ACCESS TOKEN IS EXPIRED OR INVALID!');
        console.error('🛠️ STEPS TO FIX:');
        console.error('1. Go to Meta Developers Dashboard');
        console.error('2. Select your WhatsApp app');
        console.error('3. Go to WhatsApp → App Settings');
        console.error('4. Generate new access token');
        console.error('5. Update WHATSAPP_ACCESS_TOKEN in Render Dashboard');
        console.error('6. Update WHATSAPP_ACCESS_TOKEN in local .env file');
        return;
      }
    }
  }

  // Step 2: Subscribe the app to messages
  console.log('\n2️⃣ Subscribing app to messages...');
  try {
    const subscribeUrl = `https://graph.facebook.com/v21.0/${businessAccountId}/subscribed_apps`;
    const payload = {
      subscribed_fields: 'messages'
    };
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(subscribeUrl, payload, { headers });
    console.log('✅ App subscribed successfully!');
    console.log('📬 Response:', JSON.stringify(response.data, null, 2));

  } catch (error: any) {
    console.error('❌ Subscription failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📬 Error:', error.response.data);
    }
  }

  // Step 3: Test sending a message
  console.log('\n3️⃣ Testing message sending...');
  try {
    const testNumber = '263700000000';
    const messageUrl = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: testNumber.replace(/[^\d]/g, ''),
      text: {
        body: '🧪 Integration Test - WhatsApp API is working!'
      },
      type: 'text'
    };
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(messageUrl, payload, { headers });
    console.log('✅ Test message sent successfully!');
    console.log('📬 Response:', JSON.stringify(response.data, null, 2));
    console.log('📱 Check your WhatsApp for the test message!');

  } catch (error: any) {
    console.error('❌ Test message failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📬 Error:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('💡 Still getting 401 - token is definitely expired');
      }
    }
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. If token test failed: Get new access token from Meta Developers');
  console.log('2. Update WHATSAPP_ACCESS_TOKEN in Render Dashboard');
  console.log('3. Update WHATSAPP_ACCESS_TOKEN in local .env');
  console.log('4. Redeploy on Render (or restart local server)');
  console.log('5. Test with real WhatsApp message');
}

testWhatsAppTokenAndSubscribe();

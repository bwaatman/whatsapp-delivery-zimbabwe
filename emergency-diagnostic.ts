import axios from 'axios';

async function emergencyDiagnostic() {
  console.log('🚨 EMERGENCY DIAGNOSTIC - FINDING THE EXACT ISSUE\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com';

  // Step 1: Check if server is running
  console.log('1️⃣ Testing server health...');
  try {
    const healthResponse = await axios.get(`${renderUrl}/health`);
    console.log('✅ Server is healthy');
    console.log('📊 Health status:', healthResponse.data.status);
  } catch (error: any) {
    console.error('❌ Server health check failed:', error.message);
    console.error('💡 This means your Render server is DOWN or not responding');
    return;
  }

  // Step 2: Test webhook verification (this should work)
  console.log('\n2️⃣ Testing webhook verification...');
  try {
    const verifyResponse = await axios.get(
      `${renderUrl}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=emergency-test-123`
    );
    console.log('✅ Webhook verification works');
    console.log('📋 Challenge response:', verifyResponse.data);
  } catch (error: any) {
    console.error('❌ Webhook verification failed:', error.message);
    console.error('💡 This means your webhook URL is wrong in Meta');
    return;
  }

  // Step 3: Test incoming message processing (this should work)
  console.log('\n3️⃣ Testing incoming message processing...');
  
  const incomingPayload = {
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "1291275779782158",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15556394766",
            "phone_number_id": "1169872976198533"
          },
          "contacts": [{
            "profile": {
              "name": "Emergency Test"
            },
            "wa_id": "263700000000"
          }],
          "messages": [{
            "from": "263700000000",
            "id": "wamid.emergency." + Date.now(),
            "timestamp": Date.now().toString(),
            "text": {
              "body": "Test message"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Sending test incoming message...');
    const response = await axios.post(`${renderUrl}/api/whatsapp/webhook`, incomingPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    console.log('✅ Incoming message processed');
    console.log('📬 Response:', response.data);
  } catch (error: any) {
    console.error('❌ Incoming message processing failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📬 Error details:', error.response.data);
    }
    return;
  }

  // Step 4: Test WhatsApp API directly (THIS IS LIKELY THE ISSUE)
  console.log('\n4️⃣ Testing WhatsApp API directly (MOST LIKELY CULPRIT)...');
  
  const phoneNumberId = '1169872976198533';
  const accessToken = 'EAAtLDXi1ZBYQBRSd1ZBnNjgZAnVOGZCWFxcBc4CbqxbMFFZCgpGHUMHg10mei4rgP1fUxgyNn0DloFEQHSREwJGbAPx4KpSkrJ3LffJ8FEIKunN2ZBpQcjBm6SrexD5ezrlkZCVvDyZATzAmNhNKt4TmWpFNmWfxfyGXPZBxVoMFjOcVmgnTcxZCZA3vXRi81m9dcM2xdzXeYNrhuVyZCin4SsE9iZBwT10QLzrWp0mZC27OgFUHeako1n3ynOr7ENOyJtby6CLHKmjfQFgPUh5qwHEEFM';
  const testNumber = '263700000000';
  
  const testPayload = {
    messaging_product: 'whatsapp',
    to: testNumber.replace(/[^\d]/g, ''),
    text: {
      body: '🚨 Emergency Diagnostic Test - If you receive this, WhatsApp API works!'
    },
    type: 'text'
  };

  try {
    console.log('📤 Testing WhatsApp API...');
    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(url, testPayload, { headers });
    
    console.log('✅ WhatsApp API test successful!');
    console.log('📬 Response:', JSON.stringify(response.data, null, 2));
    console.log('📱 Check your WhatsApp NOW - you should receive the test message!');
    
  } catch (error: any) {
    console.error('❌ WhatsApp API test failed - THIS IS THE ROOT CAUSE!');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📬 Error Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n💡 401 UNAUTHORIZED - ACCESS TOKEN ISSUE!');
        console.error('🛠️ SOLUTION:');
        console.error('1. Go to Meta Developers Dashboard');
        console.error('2. Select your WhatsApp app');
        console.error('3. Go to WhatsApp → App Settings');
        console.error('4. Generate NEW access token');
        console.error('5. Update WHATSAPP_TOKEN in Render Dashboard');
        console.error('6. Update WHATSAPP_TOKEN in your .env file');
      } else if (error.response.status === 400) {
        console.error('\n💡 400 BAD REQUEST - PAYLOAD OR PHONE NUMBER ISSUE!');
        console.error('🛠️ SOLUTION:');
        console.error('1. Check phone number format');
        console.error('2. Verify phone number ID');
        console.error('3. Check message payload structure');
      } else if (error.response.status === 403) {
        console.error('\n💡 403 FORBIDDEN - PERMISSIONS ISSUE!');
        console.error('🛠️ SOLUTION:');
        console.error('1. Check app permissions');
        console.error('2. Verify phone number is in test recipients');
        console.error('3. Check WhatsApp Business Account verification');
      }
    }
  }

  console.log('\n🎯 DIAGNOSTIC SUMMARY:');
  console.log('1. ✅ Server health: Working');
  console.log('2. ✅ Webhook verification: Working');
  console.log('3. ✅ Incoming message processing: Working');
  console.log('4. ❓ WhatsApp API: Check above results');
  
  console.log('\n🔍 IF WhatsApp API FAILED:');
  console.log('• That\'s why you don\'t get replies - your server processes messages but can\'t send responses');
  console.log('• Fix the WhatsApp API issue and replies will work');
  
  console.log('\n🔍 IF WhatsApp API WORKED:');
  console.log('• Check your WhatsApp for the test message');
  console.log('• If you received it, the issue is elsewhere');
  console.log('• If you didn\'t receive it, check your phone number');
}

emergencyDiagnostic();

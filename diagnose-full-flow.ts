import axios from 'axios';

async function diagnoseFullWhatsAppFlow() {
  console.log('🔍 COMPREHENSIVE WHATSAPP FLOW DIAGNOSTIC\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com';

  // Step 1: Verify server is running
  console.log('1️⃣ Testing server health...');
  try {
    const healthResponse = await axios.get(`${renderUrl}/health`);
    console.log('✅ Server is healthy');
    console.log('📊 Health status:', healthResponse.data.status);
  } catch (error: any) {
    console.error('❌ Server health check failed:', error.message);
    return;
  }

  // Step 2: Test webhook verification
  console.log('\n2️⃣ Testing webhook verification...');
  try {
    const verifyResponse = await axios.get(
      `${renderUrl}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=diagnostic-test-123`
    );
    console.log('✅ Webhook verification works');
    console.log('📋 Challenge response:', verifyResponse.data);
  } catch (error: any) {
    console.error('❌ Webhook verification failed:', error.message);
    return;
  }

  // Step 3: Test complete new customer flow (Case 1)
  console.log('\n3️⃣ Testing new customer flow (Case 1)...');
  
  const newCustomerPayload = {
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
              "name": "Diagnostic Test"
            },
            "wa_id": "263700000000"
          }],
          "messages": [{
            "from": "263700000000",
            "id": "wamid.diagnostic.new." + Date.now(),
            "timestamp": Date.now().toString(),
            "text": {
              "body": "I want 2 pizzas"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Sending new customer message...');
    const response = await axios.post(`${renderUrl}/api/whatsapp/webhook`, newCustomerPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    console.log('✅ New customer message processed');
    console.log('📬 Response:', response.data);
  } catch (error: any) {
    console.error('❌ New customer flow failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📬 Error details:', error.response.data);
    }
    return;
  }

  // Wait 3 seconds
  console.log('\n⏳ Waiting 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 4: Test follow-up message (Case 3)
  console.log('\n4️⃣ Testing follow-up message (Case 3)...');
  
  const followUpPayload = {
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
              "name": "Diagnostic Test"
            },
            "wa_id": "263700000000"
          }],
          "messages": [{
            "from": "263700000000",
            "id": "wamid.diagnostic.followup." + Date.now(),
            "timestamp": (Date.now() + 1000).toString(),
            "text": {
              "body": "Make one vegetarian"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Sending follow-up message...');
    const response = await axios.post(`${renderUrl}/api/whatsapp/webhook`, followUpPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    console.log('✅ Follow-up message processed');
    console.log('📬 Response:', response.data);
  } catch (error: any) {
    console.error('❌ Follow-up flow failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📬 Error details:', error.response.data);
    }
    return;
  }

  // Step 5: Test WhatsApp API directly
  console.log('\n5️⃣ Testing WhatsApp API directly...');
  
  const phoneNumberId = '1169872976198533';
  const accessToken = 'EAAtLDXi1ZBYQBRSdx68W1RlvJ4xHGLRMRVauhCawA1nvW6UzhsF0l5ksNL5HCxeVe42gkR9mWBNZAFWOQpfcIjURBFpEdbEoU1ad0dtynnQb1avdTXc2humI0YNatFilZCCNezc8htdySSAMijDYP7qs946os80PRsVcXRwcaaPXjoCJBWSJooykk9jpZAxtCYKZBGxZBwV8rJ0TVruDQ9eeEiHsvLJZCQmngNMhMF3Eiv9hZAC69WGvT82vKZCHkmKOil56I1wfXWKGBg4HNqNVi';
  const testNumber = '263700000000';
  
  const testPayload = {
    messaging_product: 'whatsapp',
    to: testNumber.replace(/[^\d]/g, ''),
    text: {
      body: '🧪 Diagnostic Test - If you receive this, the WhatsApp API is working!'
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
    
  } catch (error: any) {
    console.error('❌ WhatsApp API test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📬 Error Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('💡 ACCESS TOKEN EXPIRED - This is likely the root cause!');
      }
    }
  }

  console.log('\n🎉 DIAGNOSTIC COMPLETE!');
  console.log('\n📋 Check Render Dashboard Logs for:');
  console.log('  🔍 RAW WEBHOOK BODY RECEIVED');
  console.log('  🎯 WhatsAppFlowService.processWhatsAppMessage() ENTRY POINT');
  console.log('  🆕 CASE 1: New customer - creating order...');
  console.log('  📤 Sending WhatsApp message...');
  console.log('  🔍 Checking for active orders...');
  console.log('  💬 CASE 3: Pending order - text message received...');
  
  console.log('\n🔍 If you see all logs but no WhatsApp responses:');
  console.log('  - WhatsApp API token is expired (401 error)');
  console.log('  - Phone number is not in test recipients list');
  console.log('  - Meta app permissions are insufficient');
  
  console.log('\n🔍 If you see NO logs at all:');
  console.log('  - Meta is not sending requests to your webhook');
  console.log('  - Callback URL is wrong in Meta configuration');
  console.log('  - Webhook is not properly subscribed');
}

diagnoseFullWhatsAppFlow();

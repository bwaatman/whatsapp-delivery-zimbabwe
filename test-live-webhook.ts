import axios from 'axios';

async function testLiveWebhook() {
  console.log('🚀 FIRING LIVE WEBHOOK TO RENDER SERVER\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com/api/whatsapp/webhook';
  
  // Use the verified US number (replace with actual US number from +1XXXXXXXXXX)
  const usNumber = '1XXXXXXXXXX'; // Replace with your actual verified US number
  
  // WhatsApp Business Account and Phone details from your config
  const wabaId = '1291275779782158';
  const sandboxNumber = '15556394766';
  const phoneNumberId = '1169872976198533';

  const webhookPayload = {
    "object": "whatsapp_business_account",
    "entry": [{
      "id": wabaId,
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": { 
            "display_phone_number": sandboxNumber, 
            "phone_number_id": phoneNumberId 
          },
          "messages": [{
            "from": usNumber,
            "id": `wamid.HBgL${Date.now()}ABCD`,
            "timestamp": Date.now().toString(),
            "text": { 
              "body": "Order Pizza" 
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  console.log('📋 WEBHOOK PAYLOAD:');
  console.log('🌐 Target URL:', renderUrl);
  console.log('📱 From (US Number):', usNumber);
  console.log('📱 To (Sandbox):', sandboxNumber);
  console.log('🆔 WABA ID:', wabaId);
  console.log('📞 Phone ID:', phoneNumberId);
  console.log('📦 Message: "Order Pizza"');
  console.log('⏰ Timestamp:', Date.now().toString());

  try {
    console.log('\n🔥 FIRING WEBHOOK REQUEST...');
    console.log('⏳ Waiting for Render server response...\n');

    const response = await axios.post(renderUrl, webhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'WhatsApp-Webhook-Test/1.0'
      },
      timeout: 30000
    });

    console.log('✅ WEBHOOK SUCCESS!');
    console.log('📬 Status Code:', response.status);
    console.log('📬 Status Text:', response.statusText);
    console.log('📬 Response Body:', response.data);
    console.log('📬 Response Headers:', JSON.stringify(response.headers, null, 2));

  } catch (error: any) {
    console.error('❌ WEBHOOK FAILED:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📬 Response Data:', JSON.stringify(error.response.data, null, 2));
      console.error('📬 Response Headers:', JSON.stringify(error.response.headers, null, 2));
      
      // Common error analysis
      switch (error.response.status) {
        case 200:
          console.log('✅ Actually succeeded - Meta returns 200 for webhook processing');
          break;
        case 400:
          console.error('💡 Bad Request - Check payload structure');
          break;
        case 403:
          console.error('💡 Forbidden - Webhook verification failed');
          break;
        case 404:
          console.error('💡 Not Found - URL or endpoint not found');
          break;
        case 500:
          console.error('💡 Server Error - Render server issue');
          break;
        case 502:
          console.error('💡 Bad Gateway - Render server down');
          break;
        case 503:
          console.error('💡 Service Unavailable - Render server busy');
          break;
      }
    } else if (error.request) {
      console.error('📡 Network Error - Could not reach Render server');
      console.error('🔍 Check if Render URL is correct and server is running');
    } else {
      console.error('💥 Unknown Error:', error);
    }
  }

  console.log('\n🎯 NEXT STEPS:');
  console.log('1. Check your Render Dashboard logs immediately');
  console.log('2. Look for these log entries:');
  console.log('   🚨 WEBHOOK REQUEST INTERCEPTED');
  console.log('   👉 CLOUD API INBOUND EVENT');
  console.log('   🎯 MULTI-TYPE MESSAGE EXTRACTION');
  console.log('   🎯 Normalized Intent: "Order Pizza"');
  console.log('3. Verify the message processing completes successfully');
  console.log('4. Check if WhatsApp response is sent (after fixing access token)');

  console.log('\n📱 EXPECTED FLOW:');
  console.log('📥 Webhook → 🎯 Extraction → 🔄 Routing → 💾 Database → 📤 WhatsApp Response');
}

testLiveWebhook();

import axios from 'axios';

async function testRenderWebhook() {
  console.log('🧪 TESTING RENDER WEBHOOK DIRECTLY\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com/api/whatsapp/webhook';
  console.log('📡 Testing Render URL:', renderUrl);

  // Mock WhatsApp payload for "Hello" message
  const mockWhatsAppPayload = {
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123456789",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "27730210062",
            "phone_number_id": "1169872976198533"
          },
          "contacts": [{
            "profile": {
              "name": "Direct Test Customer"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.direct.test." + Date.now(),
            "timestamp": Date.now().toString(),
            "text": {
              "body": "Hello"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  console.log('\n📤 Sending mock WhatsApp payload:');
  console.log('📱 From: 27730210062');
  console.log('📝 Message: "Hello"');
  console.log('🆔 Message ID:', mockWhatsAppPayload.entry[0].changes[0].value.messages[0].id);

  try {
    console.log('\n🔄 Sending POST request to Render...');
    const response = await axios.post(renderUrl, mockWhatsAppPayload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Direct-Webhook-Test/1.0'
      },
      timeout: 30000 // 30 second timeout
    });

    console.log('✅ SUCCESS! Render webhook responded:');
    console.log('📊 Status Code:', response.status);
    console.log('📬 Response Body:', response.data);
    console.log('📋 Response Headers:', response.headers);

    if (response.status === 200) {
      console.log('\n🎉 RENDER WEBHOOK IS WORKING PERFECTLY!');
      console.log('📱 Check your Render Dashboard Logs now - you should see:');
      console.log('  🔍 RAW WEBHOOK BODY RECEIVED');
      console.log('  🎯 WhatsAppFlowService.processWhatsAppMessage() ENTRY POINT');
      console.log('  📝 Text content: "Hello"');
      console.log('\n💡 If you see the logs, the issue is Meta\'s Callback URL configuration!');
    }

  } catch (error: any) {
    console.error('❌ ERROR TESTING RENDER WEBHOOK:');
    
    if (error.response) {
      // Server responded with error status
      console.error('📊 Error Status:', error.response.status);
      console.error('📬 Error Body:', error.response.data);
      console.error('📋 Error Headers:', error.response.headers);
      
      switch (error.response.status) {
        case 400:
          console.error('💡 Bad Request - Check payload format');
          break;
        case 403:
          console.error('💡 Forbidden - Check webhook verification');
          break;
        case 404:
          console.error('💡 Not Found - Check URL path');
          break;
        case 500:
          console.error('💡 Server Error - Check Render logs for crash');
          break;
        case 503:
          console.error('💡 Service Unavailable - Render might be starting up');
          break;
        default:
          console.error('💡 Unknown error - Check Render logs');
      }
    } else if (error.request) {
      // No response received
      console.error('📡 No Response - Render might be down or network issue');
      console.error('🔍 Check if Render service is running');
    } else {
      // Request setup error
      console.error('💥 Request Error:', error.message);
    }
    
    console.error('\n🔍 Next Steps:');
    console.error('1. Check Render Dashboard: https://dashboard.render.com');
    console.error('2. Verify service is running: https://whatsapp-delivery-zimbabwe.onrender.com/health');
    console.error('3. Check Render logs for errors');
  }

  console.log('\n📋 TEST SUMMARY:');
  console.log('✅ If this test succeeded: Meta Callback URL is wrong');
  console.log('❌ If this test failed: Render deployment has issues');
}

testRenderWebhook();

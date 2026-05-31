import axios from 'axios';

async function testCase3Scenario() {
  console.log('🧪 TESTING CASE 3 SCENARIO: Pending Order + Text Message\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com/api/whatsapp/webhook';

  // Step 1: Send initial message (creates order - Case 1)
  console.log('1️⃣ Step 1: Creating new order with "I want to order 2 pizzas"...');
  
  const orderPayload = {
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
              "name": "Case 3 Test"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.case3.test.1." + Date.now(),
            "timestamp": Date.now().toString(),
            "text": {
              "body": "I want to order 2 pizzas"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    const orderResponse = await axios.post(renderUrl, orderPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    console.log('✅ Order created successfully');
    console.log('📬 Response:', orderResponse.data);
  } catch (error: any) {
    console.error('❌ Order creation failed:', error.response?.data || error.message);
    return;
  }

  // Wait 3 seconds to simulate real timing
  console.log('\n⏳ Waiting 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Step 2: Send follow-up message (should trigger Case 3)
  console.log('\n2️⃣ Step 2: Sending follow-up message "Make one vegetarian"...');
  
  const followUpPayload = {
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
              "name": "Case 3 Test"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.case3.test.2." + Date.now(),
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
    const followUpResponse = await axios.post(renderUrl, followUpPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    console.log('✅ Follow-up message processed');
    console.log('📬 Response:', followUpResponse.data);
  } catch (error: any) {
    console.error('❌ Follow-up message failed:', error.response?.data || error.message);
    return;
  }

  console.log('\n🎉 CASE 3 TEST COMPLETED!');
  console.log('\n📱 Check your WhatsApp for responses:');
  console.log('1. Welcome message (from Step 1)');
  console.log('2. Order details confirmation (from Step 2)');
  
  console.log('\n🔍 Check Render Dashboard Logs for:');
  console.log('  🔍 RAW WEBHOOK BODY RECEIVED (twice)');
  console.log('  🎯 WhatsAppFlowService.processWhatsAppMessage() ENTRY POINT (twice)');
  console.log('  📊 Active order result: FOUND (for Step 2)');
  console.log('  🔄 Routing message by state...');
  
  console.log('\n💡 If Step 2 logs show but no WhatsApp response:');
  console.log('  - Check WhatsAppService.sendMessage() errors');
  console.log('  - Check WhatsApp API credentials');
  console.log('  - Check order_details update logic');
}

testCase3Scenario();

import axios from 'axios';

async function traceReplyProcessing() {
  console.log('🔍 TRACING YOUR REPLY PROCESSING STEP BY STEP\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com';

  // Simulate your reply with detailed logging
  const replyPayload = {
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
              "name": "Test User"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.trace." + Date.now(),
            "timestamp": Date.now().toString(),
            "text": {
              "body": "i want 2 pizzas"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Sending your reply to trace processing...');
    console.log('📱 Message: "i want 2 pizzas"');
    console.log('📱 From: 27730210062');
    
    const response = await axios.post(`${renderUrl}/api/whatsapp/webhook`, replyPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('\n✅ Webhook processed!');
    console.log('📬 Response:', response.data);
    
    console.log('\n🔍 WHAT SHOULD HAVE HAPPENED:');
    console.log('1. 📥 Webhook received message');
    console.log('2. 🎯 Message extracted: "i want 2 pizzas"');
    console.log('3. 🔍 Checked for active orders (should be NONE)');
    console.log('4. 🆕 Created new order in database');
    console.log('5. 📤 Sent welcome message via WhatsApp API');
    console.log('6. 📱 You should receive response');
    
    console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
    console.log('Did you receive the welcome message?');
    
    console.log('\n🔍 IF YOU DID NOT RECEIVE:');
    console.log('Check your Render Dashboard logs for:');
    console.log('👉 CLOUD API INBOUND EVENT');
    console.log('🎯 WhatsAppFlowService.processWhatsAppMessage() ENTRY POINT');
    console.log('🆕 CASE 1: New customer - creating order...');
    console.log('📤 Sending WhatsApp message...');
    console.log('✅ WhatsApp message sent successfully! OR ❌ Failed to send');
    
  } catch (error: any) {
    console.error('\n❌ Webhook failed:', error.message);
  }

  console.log('\n🛠️ DEBUGGING CHECKLIST:');
  console.log('1. ✅ Check Render logs for inbound processing');
  console.log('2. ✅ Check if order was created in database');
  console.log('3. ✅ Check if WhatsApp API call was attempted');
  console.log('4. ✅ Check WhatsApp API response (success/failure)');
  
  console.log('\n📱 If you see ALL logs but no WhatsApp response:');
  console.log('• Database issue - orders not being saved');
  console.log('• WhatsApp API issue - token still invalid on Render');
  console.log('• Routing issue - message not being processed correctly');
  
  console.log('\n📱 If you see NO logs at all:');
  console.log('• Meta is not sending webhooks to your Render URL');
  console.log('• Webhook is not properly configured in Meta');
}

traceReplyProcessing();

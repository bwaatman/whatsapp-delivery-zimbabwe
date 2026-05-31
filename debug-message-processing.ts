import axios from 'axios';

async function debugMessageProcessing() {
  console.log('🔍 DEBUGGING MESSAGE PROCESSING AFTER FIX\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com';

  // Test the exact message you're sending
  const debugPayload = {
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
              "name": "Debug Test"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.debug." + Date.now(),
            "timestamp": Date.now().toString(),
            "text": {
              "body": "yes"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Sending debug message: "yes"');
    console.log('📱 This should trigger the fixed handlePendingOrderTextFlow');
    
    const response = await axios.post(`${renderUrl}/api/whatsapp/webhook`, debugPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('\n✅ Webhook processed successfully!');
    console.log('📬 Response:', response.data);
    
    console.log('\n🔍 CHECK YOUR RENDER DASHBOARD LOGS FOR:');
    console.log('1. 👉 CLOUD API INBOUND EVENT');
    console.log('2. 🎯 WhatsAppFlowService.processWhatsAppMessage() ENTRY POINT');
    console.log('3. 📊 Active order result: FOUND (ID: ...)');
    console.log('4. 💬 CASE 3: Pending order - text message received...');
    console.log('5. 📝 Order details received: "yes"');
    console.log('6. 🔄 Attempting to update order details...');
    console.log('7. ✅ Order details updated successfully');
    console.log('8. 📤 Sending reminder message...');
    console.log('9. ✅ Reminder message sent successfully');
    
    console.log('\n📱 Expected WhatsApp Response:');
    console.log('"Got it! We\'ve added that to your order notes. Please don\'t forget to share your WhatsApp Location Pin next so we can route a driver."');
    
    console.log('\n🔍 IF YOU SEE LOGS 1-7 BUT NO 8-9:');
    console.log('• WhatsApp API call is failing');
    console.log('• Check WhatsApp API response in logs');
    
    console.log('\n🔍 IF YOU SEE LOGS 1-5 BUT NO 6-7:');
    console.log('• Database update is failing');
    console.log('• Check database error logs');
    
    console.log('\n🔍 IF YOU SEE LOGS 1-3 BUT NO 4-5:');
    console.log('• Message structure validation still failing');
    console.log('• Check for "Invalid or empty message content" error');
    
  } catch (error: any) {
    console.error('\n❌ Debug test failed:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📬 Error details:', error.response.data);
    }
  }

  console.log('\n🛠️ IMMEDIATE ACTION NEEDED:');
  console.log('1. 📋 Check your Render Dashboard logs RIGHT NOW');
  console.log('2. 🔍 Look for the specific log entries listed above');
  console.log('3. 📱 Tell me exactly which logs you see (or don\'t see)');
  console.log('4. 🎯 This will pinpoint the exact remaining issue');
}

debugMessageProcessing();

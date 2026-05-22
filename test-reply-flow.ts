import axios from 'axios';

async function testReplyFlow() {
  console.log('🔧 TESTING YOUR EXACT SCENARIO: Reply to WhatsApp\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com';

  // Simulate YOUR exact reply: "i want 2 pizzas"
  const incomingReplyPayload = {
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
              "name": "Your Name"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062", // Your phone number
            "id": "wamid.reply." + Date.now(),
            "timestamp": Date.now().toString(),
            "text": {
              "body": "i want 2 pizzas" // Your exact message
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Simulating your reply: "i want 2 pizzas"');
    console.log('📱 From: 27730210062 (your number)');
    console.log('📱 To: 15556394766 (WhatsApp number)');
    
    const response = await axios.post(`${renderUrl}/api/whatsapp/webhook`, incomingReplyPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('\n✅ Webhook processed successfully!');
    console.log('📬 Response:', response.data);
    
    console.log('\n🎯 WHAT SHOULD HAPPEN NEXT:');
    console.log('1. ✅ Your server received the message');
    console.log('2. 🔄 Server should process the message');
    console.log('3. 💾 Server should create/update an order');
    console.log('4. 📤 Server should send a WhatsApp reply');
    console.log('5. 📱 You should receive an automated response');
    
    console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
    console.log('You should receive a response like:');
    console.log('"Welcome to ZimDelivery! 🇿🇼 What are we delivering today?..."');
    
    console.log('\n🔍 IF YOU DID NOT RECEIVE A RESPONSE:');
    console.log('The issue is in the outbound WhatsApp API call');
    console.log('This means your server processes messages but cannot send replies');
    console.log('The fix is to update the WHATSAPP_ACCESS_TOKEN in your .env and Render');
    
  } catch (error: any) {
    console.error('\n❌ Webhook processing failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📬 Error details:', error.response.data);
    }
  }

  console.log('\n🛠️ NEXT STEPS:');
  console.log('1. 📱 Check if you received a WhatsApp response');
  console.log('2. ✅ If yes → Your platform is working!');
  console.log('3. ❌ If no → Update your .env file with the new token');
  console.log('4. 🌐 Update WHATSAPP_ACCESS_TOKEN in Render Dashboard');
  console.log('5. 🚀 Redeploy and test again');
}

testReplyFlow();

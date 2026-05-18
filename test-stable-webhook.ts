import axios from 'axios';

async function testStableWebhook() {
  console.log('🧪 Testing stable webhook URL...\n');

  const webhookUrl = 'https://zim-delivery-2024.loca.lt/api/whatsapp/webhook';
  
  const whatsappPayload = {
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
              "name": "Test Customer"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.stable123",
            "timestamp": "1642596789",
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
    console.log('📤 Sending test message to stable webhook...');
    const response = await axios.post(webhookUrl, whatsappPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Stable webhook works!');
    console.log('📬 Response:', response.data);
    
    console.log('\n🎯 UPDATE YOUR META WEBHOOK WITH THIS URL:');
    console.log('https://zim-delivery-2024.loca.lt/api/whatsapp/webhook');
    
  } catch (error: any) {
    console.error('❌ Stable webhook test failed:', error.message);
  }
}

testStableWebhook();

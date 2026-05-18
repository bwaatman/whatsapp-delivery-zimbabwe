import axios from 'axios';

async function testWebhookDirectly() {
  console.log('🧪 Testing webhook directly with simulated WhatsApp message...\n');

  const webhookUrl = 'https://compromise-christina-faster-villa.trycloudflare.com/api/whatsapp/webhook';
  
  // Simulate a WhatsApp text message payload
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
            "id": "wamid.test123",
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
    console.log('📤 Sending simulated WhatsApp message...');
    console.log('📋 Payload:', JSON.stringify(whatsappPayload, null, 2));

    const response = await axios.post(webhookUrl, whatsappPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Webhook call successful!');
    console.log('📬 Response:', response.data);
    console.log('📊 Status:', response.status);

  } catch (error: any) {
    console.error('❌ Webhook call failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testWebhookDirectly();

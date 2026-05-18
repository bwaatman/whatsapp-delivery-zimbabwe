import axios from 'axios';

async function testLiveWebhook() {
  console.log('🧪 Testing live webhook with your current URL...\n');

  const webhookUrl = 'https://capital-current-angle-exemption.trycloudflare.com/api/whatsapp/webhook';
  
  // Test the exact scenario that should work
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
    console.log('📤 Sending test message...');
    console.log('📱 From: 27730210062');
    console.log('💬 Message: "I want to order 2 pizzas"');

    const response = await axios.post(webhookUrl, whatsappPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Message processed successfully!');
    console.log('📬 Response:', response.data);
    console.log('📊 Status:', response.status);

    console.log('\n⏳ Waiting 3 seconds to see if WhatsApp response is sent...');

  } catch (error: any) {
    console.error('❌ Test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testLiveWebhook();

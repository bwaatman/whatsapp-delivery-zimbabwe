import axios from 'axios';

async function testRealMessage() {
  console.log('🧪 Testing real WhatsApp message...\n');

  const webhookUrl = 'https://wright-casey-freeware-estimated.trycloudflare.com/api/whatsapp/webhook';
  
  // Simulate your exact message
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
              "name": "CR Softwares"
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
    console.log('📤 Sending your exact message...');
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

    // Wait a moment to see if WhatsApp response is sent
    console.log('\n⏳ Waiting for WhatsApp response...');
    setTimeout(() => {
      console.log('🔍 Check your WhatsApp - you should have received a response!');
    }, 3000);

  } catch (error: any) {
    console.error('❌ Test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testRealMessage();

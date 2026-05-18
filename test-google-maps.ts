import axios from 'axios';

async function testGoogleMapsHandling() {
  console.log('🧪 Testing Google Maps location handling...\n');

  const webhookUrl = 'https://samples-actual-determined-unix.trycloudflare.com/api/whatsapp/webhook';
  
  // Simulate the exact message from your conversation
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
              "body": "https://maps.google.com/maps?q=-26.059612274169922%2C28.06102752685547&z=17&hl=en"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Sending Google Maps message...');
    console.log('📋 Coordinates: -26.059612274169922, 28.06102752685547');

    const response = await axios.post(webhookUrl, whatsappPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Google Maps message processed!');
    console.log('📬 Response:', response.data);
    console.log('📊 Status:', response.status);

  } catch (error: any) {
    console.error('❌ Test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testGoogleMapsHandling();

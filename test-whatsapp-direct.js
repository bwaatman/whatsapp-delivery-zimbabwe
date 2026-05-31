const axios = require('axios');

async function testWhatsAppDirect() {
  console.log('🧪 Testing WhatsApp API directly with your credentials...\n');

  const phoneNumberId = '1169872976198533';
  const accessToken = 'EAAtLDXi1ZBYQBRapOnZBUAVZBdng8Q1PEepccVnpvpQCOoZC5SZCPXXOhwPcsoryGQr3uDMoDnwOKxRMPZA0Rq8HD1jhrUvDVyI7FoZAwMmRRwhnjgdY7BVIJFApRDYvbaYBJZAFhgfyQAOQldIgFsEXJM1dp6zXKyzD3h0tSCTZA9GUtzvG4jpPOeCH4rIDkCoIlw2wFqQ5BCMO5P8E06qv55p5cSePDqIZCIXdAqZCFIv6U5jRNPZCm6PYUrVsGWBp2ZCKLjhZAm8TVyPqp0Ux3aqdZB7';
  const to = '27730210062';

  try {
    // Test 1: Simple text message
    console.log('1️⃣ Testing simple text message...');
    const textPayload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: '🇿🇼 Test from our delivery platform! Your WhatsApp integration is working!'
      }
    };

    const response1 = await axios.post(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
      textPayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Text message sent successfully!');
    console.log('📬 Response:', JSON.stringify(response1.data, null, 2));

    // Test 2: Template message (like your curl example)
    console.log('\n2️⃣ Testing template message...');
    const templatePayload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'template',
      template: {
        name: 'jaspers_market_order_confirmation_v1',
        language: {
          code: 'en_US'
        },
        components: [{
          type: 'body',
          parameters: [
            { type: 'text', text: 'John Doe' },
            { type: 'text', text: '123456' },
            { type: 'text', text: 'May 18, 2026' }
          ]
        }]
      }
    };

    const response2 = await axios.post(
      `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`,
      templatePayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Template message sent successfully!');
    console.log('📬 Response:', JSON.stringify(response2.data, null, 2));

    console.log('\n🎉 All WhatsApp API tests completed successfully!');

  } catch (error) {
    console.error('❌ WhatsApp API test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testWhatsAppDirect();

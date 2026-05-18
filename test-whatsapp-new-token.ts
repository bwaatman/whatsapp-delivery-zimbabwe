import axios from 'axios';

async function testWhatsAppWithNewToken() {
  console.log('🧪 Testing WhatsApp API with new token...\n');

  const phoneNumberId = '1169872976198533';
  const accessToken = 'EAAtLDXi1ZBYQBRSdx68W1RlvJ4xHGLRMRVauhCawA1nvW6UzhsF0l5ksNL5HCxeVe42gkR9mWBNZAFWOQpfcIjURBFpEdbEoU1ad0dtynnQb1avdTXc2humI0YNatFilZCCNezc8htdySSAMijDYP7qs946os80PRsVcXRwcaaPXjoCJBWSJooykk9jpZAxtCYKZBGxZBwV8rJ0TVruDQ9eeEiHsvLJZCQmngNMhMF3Eiv9hZAC69WGvT82vKZCHkmKOil56I1wfXWKGBg4HNqNVi';
  const to = '27730210062';

  try {
    // Test 1: Simple text message
    console.log('1️⃣ Testing simple text message...');
    const textPayload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: '🇿🇼 ZimDelivery test! Your WhatsApp integration is working with the new token!'
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

    console.log('\n🎉 WhatsApp API is working with your new token!');

  } catch (error: any) {
    console.error('❌ WhatsApp API test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testWhatsAppWithNewToken();

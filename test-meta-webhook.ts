import axios from 'axios';

async function testMetaWebhook() {
  console.log('🔍 TESTING META WEBHOOK DIRECTLY\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com/api/whatsapp/webhook';

  // Test 1: Webhook Verification (GET)
  console.log('1️⃣ Testing webhook verification...');
  try {
    const verifyResponse = await axios.get(
      `${renderUrl}?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=test-challenge-123`,
      { timeout: 10000 }
    );
    console.log('✅ Webhook verification works:', verifyResponse.data);
  } catch (error: any) {
    console.error('❌ Webhook verification failed:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Response:', error.response?.data);
  }

  // Test 2: Simple POST Request
  console.log('\n2️⃣ Testing simple POST request...');
  try {
    const simpleResponse = await axios.post(renderUrl, {
      test: 'simple webhook test'
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    console.log('✅ Simple POST works:', simpleResponse.data);
  } catch (error: any) {
    console.error('❌ Simple POST failed:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Response:', error.response?.data);
  }

  // Test 3: Exact Meta Format
  console.log('\n3️⃣ Testing exact Meta webhook format...');
  const metaPayload = {
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
            "id": "wamid.meta.test." + Date.now(),
            "timestamp": Date.now().toString(),
            "text": {
              "body": "meta webhook test"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Sending exact Meta format...');
    const metaResponse = await axios.post(renderUrl, metaPayload, {
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'Meta-Webhook/1.0'
      },
      timeout: 10000
    });
    console.log('✅ Meta format works:', metaResponse.data);
    console.log('📱 Check your WhatsApp for response!');
    
  } catch (error: any) {
    console.error('❌ Meta format failed:', error.message);
    console.error('Status:', error.response?.status);
    console.error('Response:', error.response?.data);
  }

  console.log('\n🎯 DIAGNOSIS:');
  console.log('If Test 1 fails → Webhook verification issue');
  console.log('If Test 2 fails → Server POST handling issue');
  console.log('If Test 3 fails → Meta format parsing issue');
  console.log('If ALL pass → Meta-to-Render network issue');
}

testMetaWebhook();

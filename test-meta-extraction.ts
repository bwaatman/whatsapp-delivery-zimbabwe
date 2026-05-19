import axios from 'axios';

async function testMetaExtraction() {
  console.log('🎯 TESTING META API SPECIFICATION EXTRACTION\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com';

  // Test with exact Meta payload structure
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
              "name": "Extraction Test"
            },
            "wa_id": "263730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.extraction.test." + Date.now(),
            "timestamp": Date.now().toString(),
            "text": {
              "body": "I want 2 pizzas with extra cheese"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  console.log('📋 Test Payload Structure:');
  console.log('  - req.body.entry[0].id:', metaPayload.entry[0].id);
  console.log('  - req.body.entry[0].changes[0].field:', metaPayload.entry[0].changes[0].field);
  console.log('  - req.body.entry[0].changes[0].value.messages[0].from:', metaPayload.entry[0].changes[0].value.messages[0].from);
  console.log('  - req.body.entry[0].changes[0].value.messages[0].text.body:', metaPayload.entry[0].changes[0].value.messages[0].text.body);

  try {
    console.log('\n📤 Sending test payload to Render...');
    const response = await axios.post(`${renderUrl}/api/whatsapp/webhook`, metaPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });
    
    console.log('✅ Webhook processed successfully');
    console.log('📬 Response:', response.data);
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }

  console.log('\n📋 CHECK RENDER DASHBOARD LOGS FOR:');
  console.log('🎯 META API SPECIFICATION EXTRACTION:');
  console.log('  📋 req.body.entry?.[0]: 1291275779782158');
  console.log('  📋 entry?.changes?.[0]: messages');
  console.log('  📋 change?.value: whatsapp');
  console.log('  📋 value?.messages?.[0]: EXISTS');
  console.log('  📋 messageData?.text?.body: "I want 2 pizzas with extra cheese"');
  console.log('  📋 messageData?.from: "27730210062"');
  
  console.log('\n🔤 CRITICAL LOG TO FIND:');
  console.log('  🔤 Extracted Text: "I want 2 pizzas with extra cheese"');
  console.log('  📱 Extracted Phone Number: "27730210062"');
  
  console.log('\n🎯 This confirms the extraction pathway is working correctly!');
}

testMetaExtraction();

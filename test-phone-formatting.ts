import axios from 'axios';

async function testPhoneFormatting() {
  console.log('🔍 TESTING PHONE NUMBER FORMATTING\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com';

  // Test different phone number formats that might come from webhook
  const testCases = [
    {
      name: "Format 1: With + sign",
      from: "+27730210062",
      expected: "27730210062"
    },
    {
      name: "Format 2: Without + sign", 
      from: "27730210062",
      expected: "27730210062"
    },
    {
      name: "Format 3: With leading zero",
      from: "0730210062",
      expected: "27730210062"
    },
    {
      name: "Format 4: With spaces",
      from: "27 730 210 062", 
      expected: "27730210062"
    },
    {
      name: "Format 5: With dashes",
      from: "27-730-210-062",
      expected: "27730210062"
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}`);
    console.log(`📱 Input: ${testCase.from}`);
    console.log(`🎯 Expected: ${testCase.expected}`);

    const payload = {
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
                "name": "Format Test"
              },
              "wa_id": testCase.from
            }],
            "messages": [{
              "from": testCase.from,
              "id": "wamid.format.test." + Date.now(),
              "timestamp": Date.now().toString(),
              "text": {
                "body": "Test format"
              },
              "type": "text"
            }]
          },
          "field": "messages"
        }]
      }]
    };

    try {
      const response = await axios.post(`${renderUrl}/api/whatsapp/webhook`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });
      
      console.log(`✅ Webhook processed: ${response.data}`);
      
    } catch (error: any) {
      console.error(`❌ Test failed:`, error.response?.data || error.message);
    }
  }

  console.log('\n📋 CHECK RENDER DASHBOARD LOGS FOR:');
  console.log('🔍 Phone number analysis for each test case:');
  console.log('  - Webhook from field');
  console.log('  - Normalization steps');
  console.log('  - Final normalized number');
  console.log('  - Outbound payload to Meta');
  console.log('  - WhatsApp API response');
  
  console.log('\n🎯 LOOK FOR:');
  console.log('✅ "WhatsApp message sent successfully!" - Format works');
  console.log('❌ "(#131030) Recipient phone number not in allowed list" - Format issue');
  
  console.log('\n💡 EXPECTED RESULT:');
  console.log('All formats should normalize to: 27730210062');
  console.log('This should match your approved test recipient in Meta Dashboard');
}

testPhoneFormatting();

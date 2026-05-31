import axios from 'axios';

async function testPendingOrderReply() {
  console.log('🔍 TESTING PENDING ORDER REPLY LOGIC\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com';

  // Simulate replying "yes" to an existing pending order
  const yesReplyPayload = {
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
            "id": "wamid.yes.reply." + Date.now(),
            "timestamp": Date.now().toString(),
            "text": {
              "body": "yes"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Simulating reply: "yes" to existing pending order');
    console.log('📱 Customer: 27730210062');
    console.log('📱 Should find existing order: 7f05a9cc-daaa-41d1-ae23-fde57fe9250a');
    
    const response = await axios.post(`${renderUrl}/api/whatsapp/webhook`, yesReplyPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('\n✅ Webhook processed!');
    console.log('📬 Response:', response.data);
    
    console.log('\n🎯 WHAT SHOULD HAPPEN:');
    console.log('1. 🔍 Find existing pending order');
    console.log('2. 💬 CASE 3: Pending order - text message received');
    console.log('3. 📝 Update order details with "yes"');
    console.log('4. 📤 Send confirmation message');
    console.log('5. 📱 You should receive a response');
    
    console.log('\n📱 CHECK YOUR WHATSAPP NOW!');
    console.log('Did you receive a response to "yes"?');
    
    // Also test "hello"
    console.log('\n📤 Now testing "hello" reply...');
    
    const helloReplyPayload = {
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
              "id": "wamid.hello.reply." + Date.now(),
              "timestamp": Date.now().toString(),
              "text": {
                "body": "hello"
              },
              "type": "text"
            }]
          },
          "field": "messages"
        }]
      }]
    };

    const helloResponse = await axios.post(`${renderUrl}/api/whatsapp/webhook`, helloReplyPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('✅ "hello" reply processed!');
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
  }

  console.log('\n🔍 CHECK YOUR RENDER LOGS FOR:');
  console.log('📊 Active order result: FOUND (ID: ...)');
  console.log('💬 CASE 3: Pending order - text message received...');
  console.log('📝 Updating order details...');
  console.log('📤 Sending WhatsApp message...');
  console.log('✅ WhatsApp message sent successfully! OR ❌ Failed');
  
  console.log('\n📱 IF YOU SEE LOGS BUT NO RESPONSE:');
  console.log('• Issue in handlePendingOrderTextFlow function');
  console.log('• Order details update failing');
  console.log('• WhatsApp API call failing');
}

testPendingOrderReply();

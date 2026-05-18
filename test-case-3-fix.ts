import axios from 'axios';

async function testCase3Fix() {
  console.log('🧪 Testing Case 3 Fix (pending order + text message)...\n');

  const webhookUrl = 'https://wright-casey-freeware-estimated.trycloudflare.com/api/whatsapp/webhook';
  
  // Step 1: Send initial message to create order
  console.log('1️⃣ Step 1: Creating new order...');
  const orderPayload = {
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
            "id": "wamid.test1",
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
    const response1 = await axios.post(webhookUrl, orderPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Order created successfully');
    console.log('📬 Response:', response1.data);

    // Wait 2 seconds before sending follow-up message
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 2: Send follow-up text message (Case 3)
    console.log('\n2️⃣ Step 2: Sending follow-up text message (Case 3)...');
    const followUpPayload = {
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
              "id": "wamid.test2",
              "timestamp": "1642596790",
              "text": {
                "body": "Make one vegetarian, extra cheese on both"
              },
              "type": "text"
            }]
        },
        "field": "messages"
      }]
    }]
  };

    const response2 = await axios.post(webhookUrl, followUpPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Case 3 message processed successfully');
    console.log('📬 Response:', response2.data);

    // Wait 2 seconds before sending another follow-up
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Send another follow-up to test appending
    console.log('\n3️⃣ Step 3: Sending another follow-up (testing order details append)...');
    const appendPayload = {
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
              "id": "wamid.test3",
              "timestamp": "1642596791",
              "text": {
                "body": "Add a coke and garlic bread"
              },
              "type": "text"
            }]
        },
        "field": "messages"
      }]
    }]
  };

    const response3 = await axios.post(webhookUrl, appendPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Append message processed successfully');
    console.log('📬 Response:', response3.data);

    console.log('\n🎉 Case 3 fix test completed!');
    console.log('📱 Check your WhatsApp - you should have received:');
    console.log('1. Welcome message');
    console.log('2. Reminder message (after first follow-up)');
    console.log('3. Another reminder message (after second follow-up)');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCase3Fix();

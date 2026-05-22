import axios from 'axios';

async function testCompleteSystem() {
  console.log('🧪 COMPLETE SYSTEM DIAGNOSTIC TEST\n');

  // Test 1: Check if server is accessible
  console.log('1️⃣ Testing server connectivity...');
  try {
    const healthResponse = await axios.get('https://silly-wasp-19.loca.lt/health');
    console.log('✅ Server is healthy');
    console.log('📊 Health status:', healthResponse.data.status);
  } catch (error: any) {
    console.error('❌ Server not accessible:', error.message);
    return;
  }

  // Test 2: Test webhook verification
  console.log('\n2️⃣ Testing webhook verification...');
  try {
    const verifyResponse = await axios.get(
      'https://silly-wasp-19.loca.lt/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=system-test-123'
    );
    console.log('✅ Webhook verification works');
    console.log('📋 Challenge response:', verifyResponse.data);
  } catch (error: any) {
    console.error('❌ Webhook verification failed:', error.message);
    return;
  }

  // Test 3: Test complete order flow
  console.log('\n3️⃣ Testing complete order flow...');
  
  // Step 3a: Create new order
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
              "name": "System Test"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.system.test.1",
            "timestamp": Date.now().toString(),
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
    console.log('📤 Creating new order...');
    const orderResponse = await axios.post('https://silly-wasp-19.loca.lt/api/whatsapp/webhook', orderPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Order created successfully');
    console.log('📬 Response:', orderResponse.data);
  } catch (error: any) {
    console.error('❌ Order creation failed:', error.message);
    return;
  }

  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3b: Add order details
  const detailsPayload = {
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
              "name": "System Test"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.system.test.2",
            "timestamp": (Date.now() + 1000).toString(),
            "text": {
              "body": "Make one vegetarian with extra cheese"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Adding order details...');
    const detailsResponse = await axios.post('https://silly-wasp-19.loca.lt/api/whatsapp/webhook', detailsPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Order details added successfully');
    console.log('📬 Response:', detailsResponse.data);
  } catch (error: any) {
    console.error('❌ Order details failed:', error.message);
    return;
  }

  // Wait 2 seconds
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3c: Send location
  const locationPayload = {
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
              "name": "System Test"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.system.test.3",
            "timestamp": (Date.now() + 2000).toString(),
            "location": {
              "latitude": -26.059612274169922,
              "longitude": 28.06102752685547,
              "name": "Customer Location",
              "address": "Harare, Zimbabwe"
            },
            "type": "location"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Sending location...');
    const locationResponse = await axios.post('https://silly-wasp-19.loca.lt/api/whatsapp/webhook', locationPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Location processed successfully');
    console.log('📬 Response:', locationResponse.data);
  } catch (error: any) {
    console.error('❌ Location processing failed:', error.message);
    return;
  }

  console.log('\n🎉 COMPLETE SYSTEM TEST FINISHED!');
  console.log('\n📱 Check your WhatsApp - you should have received:');
  console.log('1. Welcome message');
  console.log('2. Order details confirmation');
  console.log('3. Driver assignment message');
  
  console.log('\n🔍 If you received all messages, the system works perfectly!');
  console.log('The issue is that Meta is not forwarding your real WhatsApp messages to the webhook.');
}

testCompleteSystem();

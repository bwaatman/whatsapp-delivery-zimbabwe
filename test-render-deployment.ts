import axios from 'axios';

async function testRenderDeployment() {
  console.log('🧪 TESTING RENDER DEPLOYMENT\n');

  // Replace with your actual Render URL
  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com';
  
  console.log('📡 Testing Render URL:', renderUrl);

  // Test 1: Health check
  console.log('\n1️⃣ Testing health endpoint...');
  try {
    const healthResponse = await axios.get(`${renderUrl}/health`);
    console.log('✅ Render server is healthy');
    console.log('📊 Health status:', healthResponse.data.status);
  } catch (error: any) {
    console.error('❌ Render health check failed:', error.message);
    console.log('🔍 Make sure your Render URL is correct and the service is running');
    return;
  }

  // Test 2: Webhook verification
  console.log('\n2️⃣ Testing webhook verification...');
  try {
    const verifyResponse = await axios.get(
      `${renderUrl}/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=render-test-123`
    );
    console.log('✅ Render webhook verification works');
    console.log('📋 Challenge response:', verifyResponse.data);
  } catch (error: any) {
    console.error('❌ Render webhook verification failed:', error.message);
    return;
  }

  // Test 3: Message processing
  console.log('\n3️⃣ Testing message processing...');
  const testMessage = {
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
              "name": "Render Test"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.render.test",
            "timestamp": Date.now().toString(),
            "text": {
              "body": "I want to order 2 pizzas from Render"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Sending test message to Render...');
    const messageResponse = await axios.post(`${renderUrl}/api/whatsapp/webhook`, testMessage, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Render message processing works');
    console.log('📬 Response:', messageResponse.data);
  } catch (error: any) {
    console.error('❌ Render message processing failed:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
    return;
  }

  console.log('\n🎉 RENDER DEPLOYMENT TEST COMPLETE!');
  console.log('\n📱 Your Meta webhook should be:');
  console.log(`📡 Callback URL: ${renderUrl}/api/whatsapp/webhook`);
  console.log('🔑 Verify Token: test_verify_token');
  
  console.log('\n🔍 If this test worked but real messages dont work:');
  console.log('1. Update Meta webhook with the URL above');
  console.log('2. Make sure environment variables are set in Render');
  console.log('3. Check Render logs for any errors');
}

testRenderDeployment();

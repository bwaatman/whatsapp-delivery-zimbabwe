import axios from 'axios';

async function diagnoseWebhook() {
  console.log('🔍 COMPREHENSIVE WEBHOOK DIAGNOSTICS...\n');

  const webhookUrl = 'https://going-judicial-std-geology.trycloudflare.com/api/whatsapp/webhook';
  
  console.log('📋 Step 1: Testing tunnel connectivity...');
  try {
    const healthResponse = await axios.get('https://going-judicial-std-geology.trycloudflare.com/health');
    console.log('✅ Tunnel is healthy - Status:', healthResponse.status);
  } catch (error) {
    console.error('❌ Tunnel connectivity failed:', error);
    return;
  }

  console.log('\n📋 Step 2: Testing webhook verification...');
  try {
    const verifyResponse = await axios.get(
      `${webhookUrl}?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=test123`
    );
    console.log('✅ Webhook verification works - Response:', verifyResponse.data);
  } catch (error) {
    console.error('❌ Webhook verification failed:', error);
    return;
  }

  console.log('\n📋 Step 3: Testing message processing...');
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
              "name": "Diagnostic Test"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.diagnostic123",
            "timestamp": Date.now().toString(),
            "text": {
              "body": "DIAGNOSTIC TEST MESSAGE"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    const messageResponse = await axios.post(webhookUrl, testMessage, {
      headers: { 'Content-Type': 'application/json' }
    });
    console.log('✅ Message processing works - Response:', messageResponse.data);
  } catch (error) {
    console.error('❌ Message processing failed:', error);
    return;
  }

  console.log('\n📋 Step 4: Testing WhatsApp API credentials...');
  try {
    const whatsappTest = await axios.post(
      `https://graph.facebook.com/v25.0/1169872976198533/messages`,
      {
        messaging_product: 'whatsapp',
        to: '27730210062',
        type: 'text',
        text: {
          body: '🔧 Diagnostic test - WhatsApp API working!'
        }
      },
      {
        headers: {
          'Authorization': 'Bearer EAAtLDXi1ZBYQBRSdx68W1RlvJ4xHGLRMRVauhCawA1nvW6UzhsF0l5ksNL5HCxeVe42gkR9mWBNZAFWOQpfcIjURBFpEdbEoU1ad0dtynnQb1avdTXc2humI0YNatFilZCCNezc8htdySSAMijDYP7qs946os80PRsVcXRwcaaPXjoCJBWSJooykk9jpZAxtCYKZBGxZBwV8rJ0TVruDQ9eeEiHsvLJZCQmngNMhMF3Eiv9hZAC69WGvT82vKZCHkmKOil56I1wfXWKGBg4HNqNVi',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ WhatsApp API works - Message ID:', whatsappTest.data.messages?.[0]?.id);
  } catch (error: any) {
    console.error('❌ WhatsApp API failed:', error.response?.data || error.message);
  }

  console.log('\n🎯 DIAGNOSIS COMPLETE!');
  console.log('\nIf all tests above pass, the issue is:');
  console.log('1. Your Meta webhook is not configured correctly');
  console.log('2. You are messaging the wrong phone number');
  console.log('3. Meta is not forwarding messages to your webhook');
  
  console.log('\n📱 NEXT STEPS:');
  console.log('1. Check your Meta WhatsApp Configuration');
  console.log('2. Verify webhook URL is: https://going-judicial-std-geology.trycloudflare.com/api/whatsapp/webhook');
  console.log('3. Make sure you are messaging the correct WhatsApp number');
  console.log('4. Check Meta webhook logs for any delivery failures');
}

diagnoseWebhook();

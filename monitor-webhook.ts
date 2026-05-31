import axios from 'axios';

console.log('🔍 REAL-TIME WEBHOOK MONITOR');
console.log('============================');
console.log('Send a WhatsApp message now and I will check for webhook activity...\n');

async function monitorWebhook() {
  const webhookUrl = 'https://going-judicial-std-geology.trycloudflare.com/api/whatsapp/webhook';
  
  // Test that webhook is still working
  try {
    const response = await axios.get(`${webhookUrl}?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=monitor-test`);
    console.log('✅ Webhook is reachable:', response.data);
  } catch (error) {
    console.error('❌ Webhook not reachable:', error);
  }

  console.log('\n📱 NOW SEND THIS MESSAGE FROM YOUR PHONE:');
  console.log('"I want to order 2 pizzas"');
  console.log('\n⏳ Monitoring for incoming webhook calls...');
  
  // Keep monitoring
  let attempts = 0;
  const maxAttempts = 30; // 30 seconds of monitoring
  
  const checkInterval = setInterval(async () => {
    attempts++;
    
    // Check server health to see if there's any activity
    try {
      const healthResponse = await axios.get('https://going-judicial-std-geology.trycloudflare.com/health');
      const timestamp = healthResponse.data.timestamp;
      console.log(`⏰ Check ${attempts}: Server active at ${new Date(timestamp).toLocaleTimeString()}`);
    } catch (error) {
      console.log(`❌ Check ${attempts}: Server not responding`);
    }
    
    if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.log('\n⏹️ Monitoring stopped');
      console.log('\n🎯 ANALYSIS:');
      console.log('If you sent the message but didn\'t see any webhook activity in your server console, then:');
      console.log('1. Meta is not forwarding messages to your webhook URL');
      console.log('2. Your webhook configuration in Meta needs to be updated');
      console.log('3. You might be messaging the wrong phone number');
      
      console.log('\n📋 NEXT STEPS:');
      console.log('1. Go to Meta for Developers → WhatsApp → Configuration');
      console.log('2. Update webhook URL to: https://going-judicial-std-geology.trycloudflare.com/api/whatsapp/webhook');
      console.log('3. Save and verify the webhook');
      console.log('4. Try sending the message again');
    }
  }, 1000);
}

monitorWebhook();

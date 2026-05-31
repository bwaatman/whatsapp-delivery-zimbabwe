import axios from 'axios';

async function checkWhatsAppDelivery() {
  console.log('🔍 CHECKING WHATSAPP MESSAGE DELIVERY ISSUE\n');

  const phoneNumberId = '1169872976198533';
  const accessToken = 'EAAtLDXi1ZBYQBRlizonitn6j0VVF82dJ2CZCmbWB3HGKbOCCDnrjzA3YBlVqW7ZBlZAGHM4SzCXDY9u9GbVxZAvq5C8z1kCQeIU6TendyZBZAd86Ecb25NZCivFSgecAHmzM6ZAsisyUs059YhnncBEc9miPvOhbh6vpqB2nymmAdkyL4UiSHWKF2TjnCthZCCZB9svUuxDaedH5gczcVncS0oI76vcIc1imqoxpFHrYbEE9lY0DgqP8yzyeAZAcby1PCZA2SZBw3Lrf6mHtxSB0k1d4rZBRwZDZD';
  
  // Test with different message formats
  const testMessages = [
    {
      name: "Simple Test",
      body: "Test message - please reply if you receive this"
    },
    {
      name: "Unicode Test", 
      body: "🇿🇼 Zimbabwe Test - Do you see this message?"
    },
    {
      name: "Short Test",
      body: "Hello"
    }
  ];

  for (const test of testMessages) {
    console.log(`\n📤 Testing: ${test.name}`);
    
    const payload = {
      messaging_product: 'whatsapp',
      to: '27730210062',
      text: {
        body: test.body
      },
      type: 'text'
    };

    try {
      const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(url, payload, { headers });
      
      console.log(`✅ ${test.name} - API Success`);
      console.log(`📬 Message ID: ${response.data.messages[0].id}`);
      console.log(`📱 Check your WhatsApp for: "${test.body}"`);
      
    } catch (error: any) {
      console.error(`❌ ${test.name} - Failed:`, error.message);
    }

    // Wait 3 seconds between messages
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log('\n🔍 TROUBLESHOOTING DELIVERY ISSUES:');
  console.log('1. 📱 Check if you received ANY of the test messages');
  console.log('2. 📱 Check your WhatsApp spam/junk folder');
  console.log('3. 📱 Make sure you haven\'t blocked the WhatsApp number');
  console.log('4. 📱 Try replying to one of the messages if received');
  
  console.log('\n🛠️ POSSIBLE CAUSES:');
  console.log('• WhatsApp delivery delays (can take up to 5 minutes)');
  console.log('• Phone number format issues');
  console.log('• WhatsApp Business Account restrictions');
  console.log('• Network connectivity issues');
  console.log('• Rate limiting (too many messages too quickly)');
  
  console.log('\n📞 ALTERNATIVE TEST:');
  console.log('Try sending a message FROM your phone TO the WhatsApp number');
  console.log('If you receive a response, then outbound delivery has issues');
  console.log('If you don\'t receive a response, then the whole system has issues');
}

checkWhatsAppDelivery();

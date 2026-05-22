import axios from 'axios';

async function testCorrectNumbers() {
  console.log('🔧 TESTING WITH CORRECT PHONE NUMBERS\n');

  const phoneNumberId = '1169872976198533';
  const newToken = 'EAAtLDXi1ZBYQBRlizonitn6j0VVF82dJ2CZCmbWB3HGKbOCCDnrjzA3YBlVqW7ZBlZAGHM4SzCXDY9u9GbVxZAvq5C8z1kCQeIU6TendyZBZAd86Ecb25NZCivFSgecAHmzM6ZAsisyUs059YhnncBEc9miPvOhbh6vpqB2nymmAdkyL4UiSHWKF2TjnCthZCCZB9svUuxDaedH5gczcVncS0oI76vcIc1imqoxpFHrYbEE9lY0DgqP8yzyeAZAcby1PCZA2SZBw3Lrf6mHtxSB0k1d4rZBRwZDZD';
  
  // CORRECT NUMBERS:
  const testNumber = '+27730210062'; // Recipient
  const fromNumber = '+15556394766';  // Your WhatsApp number

  console.log('📋 Configuration:');
  console.log('  Phone Number ID:', phoneNumberId);
  console.log('  From (Your WhatsApp):', fromNumber);
  console.log('  To (Recipient):', testNumber);
  console.log('  Token Length:', newToken.length);

  const testPayload = {
    messaging_product: 'whatsapp',
    to: testNumber.replace(/[^\d]/g, ''), // Remove + and other chars: 27730210062
    text: {
      body: '🎉 CORRECT NUMBERS TEST! - If you receive this, your WhatsApp Delivery Platform is WORKING! 🚀🇿🇼'
    },
    type: 'text'
  };

  try {
    console.log('\n📤 Testing WhatsApp API with CORRECT numbers...');
    console.log('📱 To:', testNumber.replace(/[^\d]/g, ''));
    console.log('📱 From:', fromNumber);
    
    const url = `https://graph.facebook.com/v25.0/${phoneNumberId}/messages`;
    const headers = {
      'Authorization': `Bearer ${newToken}`,
      'Content-Type': 'application/json'
    };

    const response = await axios.post(url, testPayload, { headers });
    
    console.log('\n🎉🎉🎉 SUCCESS! WHATSAPP API IS WORKING! 🎉🎉🎉');
    console.log('📬 Response:', JSON.stringify(response.data, null, 2));
    console.log('📱 Check your WhatsApp RIGHT NOW - You should receive the test message!');
    
    console.log('\n🎯 IF YOU RECEIVED THE MESSAGE:');
    console.log('✅ Your new token is working!');
    console.log('✅ Phone numbers are correct!');
    console.log('✅ Your WhatsApp Delivery Platform is READY!');
    
    console.log('\n🛠️ FINAL STEPS:');
    console.log('1. 📝 Update your .env file with the new token');
    console.log('2. 🌐 Update WHATSAPP_ACCESS_TOKEN in Render Dashboard');
    console.log('3. 🚀 Redeploy on Render');
    console.log('4. 📱 Send real message: "I want 2 pizzas"');
    console.log('5. 🎉 Enjoy your working WhatsApp Delivery Platform!');
    
    console.log('\n🎉 YOUR WHATSAPP DELIVERY PLATFORM IS WORKING! 🚀📱🇿🇼');
    
  } catch (error: any) {
    console.error('\n❌ WhatsApp API test failed:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📬 Error Response:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 400) {
        console.error('\n💡 400 Bad Request - Check phone number format');
        console.error('📱 Current format:', testNumber.replace(/[^\d]/g, ''));
        console.error('💡 Make sure +27730210062 is in your test recipients list');
      } else if (error.response.status === 401) {
        console.error('\n💡 401 Unauthorized - Token issue');
      }
    }
  }
}

testCorrectNumbers();

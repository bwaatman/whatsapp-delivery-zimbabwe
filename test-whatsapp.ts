import { WhatsAppService } from './src/WhatsAppService';

async function testWhatsAppAPI() {
  console.log('🧪 Testing WhatsApp API with your credentials...\n');

  const whatsappService = new WhatsAppService();

  const testPhone = '27730210062'; // Your test phone number

  try {
    // Test 1: Send a simple text message
    console.log('1️⃣ Testing simple text message...');
    const textResult = await whatsappService.sendTextMessage(
      testPhone, 
      "🇿🇼 Welcome to ZimDelivery! Your WhatsApp integration is working perfectly!"
    );
    console.log('Text message result:', textResult ? '✅ Success' : '❌ Failed');

    // Test 2: Send template message (like your curl example)
    console.log('\n2️⃣ Testing template message...');
    const templateResult = await whatsappService.sendOrderConfirmationTemplate(
      testPhone,
      'John Doe',
      '123456',
      'May 18, 2026'
    );
    console.log('Template message result:', templateResult ? '✅ Success' : '❌ Failed');

    // Test 3: Send location request message
    console.log('\n3️⃣ Testing location request message...');
    const locationResult = await whatsappService.sendLocationRequest(testPhone);
    console.log('Location request result:', locationResult ? '✅ Success' : '❌ Failed');

    console.log('\n✅ WhatsApp API test completed!');

  } catch (error) {
    console.error('❌ WhatsApp API test failed:', error);
  }
}

// Run the test
testWhatsAppAPI();

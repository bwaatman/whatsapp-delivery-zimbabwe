import axios from 'axios';
import { WhatsAppService } from './src/WhatsAppService';

// Create a custom WhatsAppService with hardcoded credentials for testing
class TestWhatsAppService extends WhatsAppService {
  constructor() {
    super(); // Call parent constructor first
    // Override the properties with hardcoded credentials
    (this as any).phoneNumberId = '1169872976198533';
    (this as any).accessToken = 'EAAtLDXi1ZBYQBRapOnZBUAVZBdng8Q1PEepccVnpvpQCOoZC5SZCPXXOhwPcsoryGQr3uDMoDnwOKxRMPZA0Rq8HD1jhrUvDVyI7FoZAwMmRRwhnjgdY7BVIJFApRDYvbaYBJZAFhgfyQAOQldIgFsEXJM1dp6zXKyzD3h0tSCTZA9GUtzvG4jpPOeCH4rIDkCoIlw2wFqQ5BCMO5P8E06qv55p5cSePDqIZCIXdAqZCFIv6U5jRNPZCm6PYUrVsGWBp2ZCKLjhZAm8TVyPqp0Ux3aqdZB7';
    (this as any).baseUrl = 'https://graph.facebook.com/v25.0';
  }
}

async function testWorkingWhatsApp() {
  console.log('🧪 Testing WhatsApp Service with hardcoded credentials...\n');

  const whatsappService = new TestWhatsAppService();
  const testPhone = '27730210062';

  try {
    // Test 1: Send location request message (simulating new order)
    console.log('1️⃣ Testing location request message (new order workflow)...');
    const locationResult = await whatsappService.sendLocationRequest(testPhone);
    console.log('Location request result:', locationResult ? '✅ Success' : '❌ Failed');

    // Test 2: Send location confirmation message (simulating location received)
    console.log('\n2️⃣ Testing location confirmation message (location received workflow)...');
    const confirmationResult = await whatsappService.sendLocationConfirmation(testPhone);
    console.log('Location confirmation result:', confirmationResult ? '✅ Success' : '❌ Failed');

    // Test 3: Send template message (order confirmation)
    console.log('\n3️⃣ Testing order confirmation template...');
    const templateResult = await whatsappService.sendOrderConfirmationTemplate(
      testPhone,
      'John Doe',
      '123456',
      'May 18, 2026'
    );
    console.log('Template message result:', templateResult ? '✅ Success' : '❌ Failed');

    console.log('\n🎉 WhatsApp Service integration test completed!');

  } catch (error) {
    console.error('❌ WhatsApp Service test failed:', error);
  }
}

testWorkingWhatsApp();

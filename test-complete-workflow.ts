import { WhatsAppFlowService } from './src/WhatsAppFlowService';

// Test the complete WhatsApp workflow with simulated messages
async function testCompleteWorkflow() {
  console.log('🧪 Testing Complete WhatsApp Workflow...\n');

  const flowService = new WhatsAppFlowService();
  const testPhone = '+263123456789';

  try {
    // Step 1: New customer sends text message
    console.log('📱 Step 1: New customer sends order request...');
    const orderMessage = {
      type: 'text',
      text: {
        body: 'I want to order 2 pizzas and a coke for delivery'
      },
      timestamp: Date.now().toString()
    };

    await flowService.processWhatsAppMessage(testPhone, orderMessage);

    // Step 2: Check state after order creation
    console.log('\n📊 Step 2: Checking customer state...');
    const state1 = await flowService.getCustomerState(testPhone);
    console.log('State after order:', JSON.stringify(state1, null, 2));

    // Step 3: Customer sends additional order details
    console.log('\n📝 Step 3: Customer sends additional details...');
    const detailsMessage = {
      type: 'text',
      text: {
        body: 'Make one pizza vegetarian, extra cheese on both, no onions'
      },
      timestamp: Date.now().toString()
    };

    await flowService.processWhatsAppMessage(testPhone, detailsMessage);

    // Step 4: Customer sends location pin
    console.log('\n📍 Step 4: Customer sends location pin...');
    const locationMessage = {
      type: 'location',
      location: {
        latitude: -17.8292,
        longitude: 31.0539,
        name: 'Harare City Centre',
        address: 'Harare, Zimbabwe'
      },
      timestamp: Date.now().toString()
    };

    await flowService.processWhatsAppMessage(testPhone, locationMessage);

    // Step 5: Check final state
    console.log('\n📊 Step 5: Checking final state...');
    const finalState = await flowService.getCustomerState(testPhone);
    console.log('Final state:', JSON.stringify(finalState, null, 2));

    // Step 6: Try to modify completed order
    console.log('\n🔄 Step 6: Customer tries to modify assigned order...');
    const modifyMessage = {
      type: 'text',
      text: {
        body: 'Actually add a milkshake too'
      },
      timestamp: Date.now().toString()
    };

    await flowService.processWhatsAppMessage(testPhone, modifyMessage);

    console.log('\n✅ Complete workflow test finished!');

  } catch (error) {
    console.error('❌ Workflow test failed:', error);
  }
}

// Run the test
testCompleteWorkflow();

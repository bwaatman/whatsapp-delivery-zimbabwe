import { WhatsAppFlowService } from './src/WhatsAppFlowService';
import { OrderService } from './src/OrderService';

// Test the complete state management system
async function testStateManagement() {
  console.log('🧪 Testing WhatsApp State Management System...\n');

  const flowService = new WhatsAppFlowService();
  const orderService = new OrderService();

  const testPhone = '+263123456789'; // Test phone number

  try {
    // Test 1: Check initial state (no orders)
    console.log('1️⃣ Checking initial customer state...');
    const initialState = await flowService.getCustomerState(testPhone);
    console.log('Initial state:', JSON.stringify(initialState, null, 2));

    // Test 2: Simulate new customer text message (CASE 1)
    console.log('\n2️⃣ Testing CASE 1: New customer sends text message...');
    const textMessage = {
      type: 'text',
      text: {
        body: 'I want to order 2 pizzas and a coke'
      },
      timestamp: Date.now().toString()
    };

    await flowService.processWhatsAppMessage(testPhone, textMessage);

    // Test 3: Check state after order creation
    console.log('\n3️⃣ Checking state after order creation...');
    const afterOrderState = await flowService.getCustomerState(testPhone);
    console.log('State after order:', JSON.stringify(afterOrderState, null, 2));

    // Test 4: Simulate customer sending more order details (CASE 3)
    console.log('\n4️⃣ Testing CASE 3: Customer sends additional order details...');
    const additionalTextMessage = {
      type: 'text',
      text: {
        body: 'Make one pizza vegetarian, extra cheese on both'
      },
      timestamp: Date.now().toString()
    };

    await flowService.processWhatsAppMessage(testPhone, additionalTextMessage);

    // Test 5: Check order details
    console.log('\n5️⃣ Checking updated order details...');
    if (afterOrderState.order) {
      const orderDetails = await orderService.getOrderDetails(afterOrderState.order.id!);
      console.log('Order details:', JSON.stringify(orderDetails, null, 2));
    }

    // Test 6: Simulate customer sending location pin (CASE 2)
    console.log('\n6️⃣ Testing CASE 2: Customer sends location pin...');
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

    // Test 7: Check final state
    console.log('\n7️⃣ Checking final state after location...');
    const finalState = await flowService.getCustomerState(testPhone);
    console.log('Final state:', JSON.stringify(finalState, null, 2));

    // Test 8: Simulate customer trying to modify order (CASE 4)
    console.log('\n8️⃣ Testing CASE 4: Customer tries to modify in-progress order...');
    const modifyMessage = {
      type: 'text',
      text: {
        body: 'Actually, make it 3 pizzas instead'
      },
      timestamp: Date.now().toString()
    };

    await flowService.processWhatsAppMessage(testPhone, modifyMessage);

    console.log('\n✅ State management test completed!');

  } catch (error) {
    console.error('❌ State management test failed:', error);
  }
}

// Run the test
testStateManagement();

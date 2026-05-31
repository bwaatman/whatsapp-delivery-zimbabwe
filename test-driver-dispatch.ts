import { WhatsAppFlowService } from './src/WhatsAppFlowService';
import { OrderService } from './src/OrderService';

// Test the spatial driver dispatch system
async function testDriverDispatch() {
  console.log('🧪 Testing Spatial Driver Dispatch System...\n');

  const flowService = new WhatsAppFlowService();
  const orderService = new OrderService();

  const testPhone = '+263123456789'; // Test phone number

  try {
    // Test 1: Check initial state
    console.log('1️⃣ Checking initial customer state...');
    const initialState = await flowService.getCustomerState(testPhone);
    console.log('Initial state:', JSON.stringify(initialState, null, 2));

    // Test 2: Create a new order with text message
    console.log('\n2️⃣ Creating new order...');
    const textMessage = {
      type: 'text',
      text: {
        body: 'I want to order 2 pizzas and a coke for delivery'
      },
      timestamp: Date.now().toString()
    };

    await flowService.processWhatsAppMessage(testPhone, textMessage);

    // Test 3: Check order after creation
    console.log('\n3️⃣ Checking order after creation...');
    const afterOrderState = await flowService.getCustomerState(testPhone);
    console.log('State after order:', JSON.stringify(afterOrderState, null, 2));

    // Test 4: Test driver matching function directly
    console.log('\n4️⃣ Testing driver matching function directly...');
    const testLat = -17.8292; // Harare coordinates
    const testLng = 31.0539;
    
    const closestDriver = await orderService.matchClosestDriver(testLat, testLng);
    
    if (closestDriver) {
      console.log('✅ Driver found:', closestDriver.name);
      console.log('📍 Distance:', closestDriver.distance_km?.toFixed(2), 'km');
    } else {
      console.log('📭 No available drivers found (expected if no drivers in database)');
    }

    // Test 5: Simulate customer sending location pin
    console.log('\n5️⃣ Testing location pin with driver dispatch...');
    const locationMessage = {
      type: 'location',
      location: {
        latitude: testLat,
        longitude: testLng,
        name: 'Harare City Centre',
        address: 'Harare, Zimbabwe'
      },
      timestamp: Date.now().toString()
    };

    await flowService.processWhatsAppMessage(testPhone, locationMessage);

    // Test 6: Check final state after location
    console.log('\n6️⃣ Checking final state after location...');
    const finalState = await flowService.getCustomerState(testPhone);
    console.log('Final state:', JSON.stringify(finalState, null, 2));

    // Test 7: Check order details for driver assignment
    if (finalState.order) {
      console.log('\n7️⃣ Checking order details...');
      const orderDetails = await orderService.getOrderDetails(finalState.order.id!);
      console.log('Order details:', JSON.stringify(orderDetails, null, 2));
    }

    console.log('\n✅ Driver dispatch test completed!');

  } catch (error) {
    console.error('❌ Driver dispatch test failed:', error);
  }
}

// Helper function to create test drivers (if needed)
async function createTestDrivers() {
  console.log('🔧 Creating test drivers for spatial matching...');
  
  const orderService = new OrderService();
  
  // This would require adding a createDriver method to OrderService
  // For now, we'll just log what would be created
  console.log('Test drivers that should be created:');
  console.log('- Driver 1: John (+263111111111) at -17.8292, 31.0539 (Harare)');
  console.log('- Driver 2: Mary (+263222222222) at -17.8278, 31.0551 (2km away)');
  console.log('- Driver 3: James (+263333333333) at -17.8310, 31.0520 (1.5km away)');
}

// Run the test
testDriverDispatch();

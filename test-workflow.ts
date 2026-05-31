import { OrderService } from './src/OrderService';
import { WhatsAppService } from './src/WhatsAppService';

async function testWorkflow() {
  console.log('🧪 Testing WhatsApp Delivery Workflow...\n');

  const orderService = new OrderService();
  const whatsappService = new WhatsAppService();

  const testPhone = '+263123456789'; // Test phone number

  try {
    // Test 1: Check for existing order
    console.log('1️⃣ Checking for existing pending order...');
    const existingOrder = await orderService.findPendingOrder(testPhone);
    console.log('Result:', existingOrder ? 'Found existing order' : 'No existing order');

    // Test 2: Create new order (simulate text message)
    if (!existingOrder) {
      console.log('\n2️⃣ Creating new order (simulating text message)...');
      const newOrder = await orderService.createOrder(testPhone);
      
      if (newOrder) {
        console.log('✅ Order created successfully:', newOrder.id);

        // Test 3: Update order with location (simulate location message)
        console.log('\n3️⃣ Updating order with location (simulating location pin)...');
        const testLat = -17.8292; // Harare coordinates
        const testLng = 31.0539;
        
        const locationUpdated = await orderService.updateOrderLocation(
          newOrder.id!,
          testLat,
          testLng
        );
        
        console.log('Location update result:', locationUpdated ? '✅ Success' : '❌ Failed');

        // Test 4: Get final order details
        console.log('\n4️⃣ Getting final order details...');
        const finalOrder = await orderService.getOrderDetails(newOrder.id!);
        if (finalOrder) {
          console.log('📄 Final order status:', finalOrder.status);
          console.log('📍 Location saved:', finalOrder.delivery_location ? 'Yes' : 'No');
        }
      }
    }

    console.log('\n✅ Workflow test completed!');

  } catch (error) {
    console.error('❌ Workflow test failed:', error);
  }
}

// Run the test
testWorkflow();

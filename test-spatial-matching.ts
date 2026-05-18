import { OrderService } from './src/OrderService';

// Test the spatial driver matching function directly
async function testSpatialMatching() {
  console.log('🧪 Testing Spatial Driver Matching Function...\n');

  const orderService = new OrderService();

  try {
    // Test 1: Test matching from Harare city center
    console.log('1️⃣ Testing driver matching from Harare city center...');
    const harareLat = -17.8292;
    const harareLng = 31.0539;
    
    const closestDriver = await orderService.matchClosestDriver(harareLat, harareLng);
    
    if (closestDriver) {
      console.log('✅ Driver found:');
      console.log(`👤 Name: ${closestDriver.name}`);
      console.log(`📞 Phone: ${closestDriver.phone}`);
      console.log(`📍 Distance: ${closestDriver.distance_km?.toFixed(2)} km`);
      console.log(`🟢 Available: ${closestDriver.is_available}`);
    } else {
      console.log('❌ No drivers found - check if migrations were run');
    }

    // Test 2: Test matching from a different location
    console.log('\n2️⃣ Testing driver matching from 2km away...');
    const awayLat = -17.8310;
    const awayLng = 31.0520;
    
    const closestDriver2 = await orderService.matchClosestDriver(awayLat, awayLng);
    
    if (closestDriver2) {
      console.log('✅ Driver found:');
      console.log(`👤 Name: ${closestDriver2.name}`);
      console.log(`📞 Phone: ${closestDriver2.phone}`);
      console.log(`📍 Distance: ${closestDriver2.distance_km?.toFixed(2)} km`);
    } else {
      console.log('❌ No drivers found');
    }

    console.log('\n✅ Spatial matching test completed!');

  } catch (error) {
    console.error('❌ Spatial matching test failed:', error);
  }
}

// Run the test
testSpatialMatching();

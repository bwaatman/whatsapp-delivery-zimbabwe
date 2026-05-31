import axios from 'axios';

async function checkDatabaseOrders() {
  console.log('🔍 CHECKING WHATS IN YOUR DATABASE\n');

  const renderUrl = 'https://whatsapp-delivery-zimbabwe.onrender.com';

  // Test a message that should find existing orders
  const testPayload = {
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "1291275779782158",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "15556394766",
            "phone_number_id": "1169872976198533"
          },
          "contacts": [{
            "profile": {
              "name": "Database Test"
            },
            "wa_id": "27730210062"
          }],
          "messages": [{
            "from": "27730210062",
            "id": "wamid.db.test." + Date.now(),
            "timestamp": Date.now().toString(),
            "text": {
              "body": "database check"
            },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  };

  try {
    console.log('📤 Sending database check message...');
    console.log('📱 This will trigger the order lookup process');
    
    const response = await axios.post(`${renderUrl}/api/whatsapp/webhook`, testPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log('\n✅ Webhook processed!');
    console.log('📬 Response:', response.data);
    
    console.log('\n🔍 CHECK YOUR RENDER LOGS FOR:');
    console.log('🔍 Querying orders table for customer: 27730210062');
    console.log('📊 Active order result: FOUND (ID: ...) OR 📭 NONE');
    
    console.log('\n🎯 IF YOU SEE "NONE":');
    console.log('• Database has no orders for your phone number');
    console.log('• Orders might be stored with different phone format');
    console.log('• Database connection issue');
    
    console.log('\n🎯 IF YOU SEE "FOUND":');
    console.log('• Order exists but routing logic has issue');
    console.log('• Check the order status');
    
    console.log('\n📱 Expected Result:');
    console.log('If order exists → You should get reply message');
    console.log('If no order → You should get welcome message');
    
  } catch (error: any) {
    console.error('\n❌ Database check failed:', error.message);
  }

  console.log('\n🛠️ TELL ME WHAT YOUR RENDER LOGS SHOW:');
  console.log('1. 🔍 Querying orders table for customer: 27730210062');
  console.log('2. 📊 Active order result: ??? (what does it say?)');
  console.log('3. 📱 What message did you receive?');
  console.log('4. 🎯 This will tell us if the database query is working');
}

checkDatabaseOrders();

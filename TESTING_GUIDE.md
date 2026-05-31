# Testing Guide for WhatsApp Delivery Platform

## 🧪 Complete Testing Instructions

### **Step 1: Database Setup**

Run these migrations in Supabase SQL Editor **in order**:

1. `004_fix_delivery_location_nullable.sql`
2. `005_add_order_details_column.sql` 
3. `006_create_driver_matching_function.sql` (FIXED VERSION)
4. `007_add_test_drivers.sql`

### **Step 2: Start the Server**

```bash
npm run dev
```

Server should run on: `http://localhost:3000`

### **Step 3: Test Spatial Matching Function**

```bash
npx ts-node test-spatial-matching.ts
```

**Expected Output:**
```
🧪 Testing Spatial Driver Matching Function...
1️⃣ Testing driver matching from Harare city center...
🚗 Finding closest driver...
✅ Driver found:
👤 Name: John Moyo
📞 Phone: +263111111111
📍 Distance: 0.00 km
🟢 Available: true
```

### **Step 4: Test Complete Workflow**

```bash
npx ts-node test-complete-workflow.ts
```

**Expected Flow:**
1. ✅ Creates new order (status: pending)
2. ✅ Updates order details
3. ✅ Processes location pin
4. ✅ Assigns closest driver
5. ✅ Handles modification attempts

### **Step 5: Test with Real WhatsApp**

#### **Setup:**
1. Expose local server: `cloudflared tunnel --url http://localhost:3000`
2. Update WhatsApp webhook URL in Meta Dashboard
3. Send test messages from your phone

#### **Test Conversation:**

**Message 1:** "I want to order 2 pizzas"
**Expected Reply:** "Welcome to ZimDelivery! 🇿🇼 What are we delivering today?..."

**Message 2:** "Make one vegetarian, extra cheese"
**Expected Reply:** "Got it! We've added that to your order notes. Please don't forget to share your WhatsApp Location Pin next..."

**Message 3:** [Send WhatsApp Location Pin]
**Expected Reply:** "Location pinned! 📍 Your order has been assigned to our driver, John Moyo. They are heading your way now!"

**Message 4:** "Actually add a milkshake"
**Expected Reply:** "Your order is already being processed! Our driver is on the move..."

### **Step 6: Monitor Console Logs**

Watch for these log patterns:

```
🔄 Starting WhatsApp flow processing...
🔍 Checking for active orders...
🆕 CASE 1: New customer - creating order...
✅ New order created: [order-id]
📤 Welcome message sent successfully

📝 CASE 3: Pending order - text message received...
✅ Order details updated successfully
📤 Reminder message sent successfully

📍 CASE 2: Pending order - location received...
🚗 Starting spatial driver matching...
✅ Found closest driver: John Moyo (0.00 km away)
🔗 Assigning driver to order...
✅ Driver assignment completed successfully
📤 Driver assignment message sent successfully
```

### **Step 7: Database Verification**

Check your Supabase database:

```sql
-- Check orders table
SELECT * FROM orders WHERE customer_phone = '+263123456789';

-- Check drivers table  
SELECT * FROM drivers WHERE is_available = false;

-- Check spatial function works
SELECT * FROM match_closest_driver(-17.8292, 31.0539);
```

### **Troubleshooting:**

#### **❌ "No drivers found"**
- Check if migrations were run
- Verify drivers table has data
- Check `is_available = true` condition

#### **❌ "Function not found"**
- Run migration 006 again
- Check function exists: `\df match_closest_driver`

#### **❌ "Type mismatch error"**
- Use the fixed version of migration 006
- Drop and recreate the function if needed

#### **❌ WhatsApp messages not working**
- Check server is running
- Verify webhook URL is correct
- Check environment variables are loaded

### **Expected Test Results:**

✅ **Spatial Matching:** Finds closest driver within milliseconds  
✅ **Order Creation:** Creates orders with proper status flow  
✅ **Driver Assignment:** Assigns driver and updates availability  
✅ **WhatsApp Responses:** Sends appropriate messages for each state  
✅ **Error Handling:** Graceful fallback when no drivers available  

### **Performance Metrics:**

- **Spatial Query:** < 50ms with spatial index
- **Order Creation:** < 100ms
- **Driver Assignment:** < 200ms total
- **WhatsApp Response:** < 500ms end-to-end

Your platform is now ready for production testing! 🚀

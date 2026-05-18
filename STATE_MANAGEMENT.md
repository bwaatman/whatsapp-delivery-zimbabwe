# WhatsApp State Management System

## Overview

The WhatsApp Delivery Platform now implements sophisticated state management that dynamically handles customer interactions based on their current order status. This system ensures a seamless, context-aware conversation flow for each customer.

## State-Based Routing Logic

### CASE 1: New Customer (No Active Orders)
**Trigger:** Customer sends any message with no existing orders

**Flow:**
1. Query `orders` table for active orders (status not 'delivered' or 'cancelled')
2. No orders found → Create new order with `status = 'pending'`
3. Send WhatsApp message: *"Welcome to ZimDelivery! 🇿🇼 What are we delivering today? Please reply with your order details, followed by your WhatsApp Location Pin so our rider can find you."*

### CASE 2: Pending Order + Location Message
**Trigger:** Customer with `pending` order sends location pin

**Flow:**
1. Extract latitude and longitude from location message
2. Update order's `delivery_location` using PostGIS: `ST_SetSRID(ST_MakePoint(long, lat), 4326)`
3. Change order status to `assigned`
4. Send WhatsApp message: *"Location pinned! 📍 We have logged your delivery coordinates and a runner is being dispatched."*

### CASE 3: Pending Order + Text Message
**Trigger:** Customer with `pending` order sends text (not location)

**Flow:**
1. Update order's `order_details` column with the text content
2. Send WhatsApp message: *"Got it! We've added that to your order notes. Please don't forget to share your WhatsApp Location Pin next so we can route a driver."*

### CASE 4: In-Progress Order
**Trigger:** Customer with `assigned` or `out_for_delivery` order sends any message

**Flow:**
1. Send WhatsApp message: *"Your order is already being processed! Our driver is on the move. We will alert you the moment they approach your pin."*

## Database Schema Updates

### New Column Added
```sql
ALTER TABLE orders ADD COLUMN order_details TEXT;
```

### Order Status Flow
```
pending → assigned → out_for_delivery → delivered
    ↑
    └─ (customer can add order details)
```

## Implementation Details

### WhatsAppFlowService
The main orchestrator that handles:
- State detection via database queries
- Message routing based on current state
- WhatsApp response management
- Comprehensive logging

### Key Methods
- `processWhatsAppMessage()` - Main entry point
- `findActiveOrder()` - Queries for non-delivered orders
- `routeMessageByState()` - State-based routing logic
- `getCustomerState()` - Debug helper to check current state

### OrderService Updates
- Added `updateOrderDetails()` method
- Updated Order interface to include `order_details`
- Enhanced logging for all operations

## Message Flow Examples

### Example 1: Complete Order Flow
```
Customer: "I want to order 2 burgers and fries"
System: "Welcome to ZimDelivery! 🇿🇼 What are we delivering today?..."

Customer: "Make one burger spicy, extra ketchup"
System: "Got it! We've added that to your order notes..."

Customer: [Location Pin]
System: "Location pinned! 📍 We have logged your delivery coordinates..."
```

### Example 2: Modification Attempt
```
Customer: [After location] "Actually add a milkshake"
System: "Your order is already being processed! Our driver is on the move..."
```

## Logging & Monitoring

Every state transition includes comprehensive console logging:
- 🔄 Flow processing start
- 🔍 Database queries
- 🎯 Routing decisions
- 📤 WhatsApp message sending
- ✅ Success/❌ Error states

## Testing

Run the state management test:
```bash
npx ts-node test-state-management.ts
```

This test simulates all four cases and verifies the complete flow.

## Database Migrations Required

1. `004_fix_delivery_location_nullable.sql` - Makes location nullable
2. `005_add_order_details_column.sql` - Adds order details column

## Next Steps

- Implement driver assignment logic
- Add order tracking updates
- Implement delivery completion workflow
- Add customer notifications for driver proximity

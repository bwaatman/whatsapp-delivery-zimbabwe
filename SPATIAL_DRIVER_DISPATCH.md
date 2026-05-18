# Spatial Driver Dispatch Engine

## Overview

The WhatsApp Delivery Platform now implements a sophisticated spatial driver dispatch system that uses PostGIS to automatically find and assign the closest available driver to customer orders.

## Architecture

### PostGIS RPC Function
**File:** `migrations/006_create_driver_matching_function.sql`

The `match_closest_driver()` function:
- Accepts customer latitude and longitude
- Queries available drivers (`is_available = TRUE`)
- Uses PostGIS distance operator `<->` for efficient spatial matching
- Returns the closest driver with distance in kilometers
- Converts geographic distance (degrees) to kilometers (1° ≈ 111.32 km)

### Enhanced OrderService
**New Methods:**
- `matchClosestDriver()` - Calls the PostGIS RPC function
- `assignDriverToOrder()` - Assigns driver and updates order status
- `updateDriverAvailability()` - Marks driver as unavailable
- `setOrderStatusPendingDispatch()` - Sets order to pending_dispatch status

**New Order Status:**
```
pending → pending_dispatch → assigned → out_for_delivery → delivered
```

### WhatsAppFlowService Integration
**CASE 2 Enhancement:** When location pin is received:
1. Extract latitude and longitude
2. Call `matchClosestDriver()` with customer coordinates
3. **If driver found:**
   - Assign driver to order
   - Mark driver as unavailable
   - Set order status to `assigned`
   - Send: *"Location pinned! 📍 Your order has been assigned to our driver, [Driver Name]. They are heading your way now!"*
4. **If no driver available:**
   - Set order status to `pending_dispatch`
   - Send: *"Location pinned! 📍 We are currently pairing your order with a nearby delivery runner and will text you their details shortly."*

## Spatial Query Details

### PostGIS Function Implementation
```sql
CREATE OR REPLACE FUNCTION match_closest_driver(
  customer_lat NUMERIC,
  customer_lng NUMERIC
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  current_location GEOMETRY(Point, 4326),
  is_available BOOLEAN,
  distance_km NUMERIC
)
```

### Distance Calculation
```sql
-- Using PostGIS distance operator for efficiency
ORDER BY d.current_location <-> customer_point

-- Converting degrees to kilometers
(ST_Distance(d.current_location, customer_point) * 111.32) as distance_km
```

## Database Schema Updates

### New Migration Files
1. `006_create_driver_matching_function.sql` - PostGIS RPC function
2. `007_add_test_drivers.sql` - Sample drivers for testing

### Order Status Flow
```
pending (customer sends text)
    ↓
pending_dispatch (location received, no drivers available)
    ↓
assigned (driver found and assigned)
    ↓
out_for_delivery (driver picks up order)
    ↓
delivered (order completed)
```

## Testing

### Test Drivers Included
The system includes 4 test drivers positioned around Harare:
- **John Moyo** - City center (available)
- **Mary Chenje** - 1.5km away (available)
- **James Kuda** - 2km away (available)
- **Sarah Dube** - City center (unavailable - should not be matched)

### Test Scenarios
Run the driver dispatch test:
```bash
npx ts-node test-driver-dispatch.ts
```

**Expected Flow:**
1. Customer sends text message → Order created (status: pending)
2. Customer sends location pin → Spatial matching triggered
3. Closest driver found → Order assigned (status: assigned)
4. Customer receives driver name and confirmation

### Console Logging
Every step includes comprehensive logging:
- 🚗 Starting spatial driver matching
- ✅ Found closest driver: [Name] ([Distance] km away)
- 🔗 Assigning driver to order
- 🔄 Updating driver availability
- 📤 Driver assignment message sent

## Performance Considerations

### Spatial Indexing
The `drivers` table should have a spatial index on `current_location` for optimal performance:
```sql
CREATE INDEX idx_drivers_location ON drivers USING GIST (current_location);
```

### Distance Calculation
- Uses PostGIS native distance operator `<->` for efficiency
- Converts geographic coordinates to kilometers for human-readable output
- Limits results to 1 driver (closest available)

## Error Handling

### No Available Drivers
- Order status set to `pending_dispatch`
- Customer receives waiting message
- System can retry driver assignment later

### Database Errors
- Comprehensive error logging
- Graceful fallback to pending_dispatch status
- Customer always receives a response

## Future Enhancements

### Driver Assignment Strategies
1. **Closest Driver** (current implementation)
2. **Load Balancing** - Consider driver's current orders
3. **Driver Rating** - Prioritize higher-rated drivers
4. **Time-based** - Consider traffic and estimated arrival

### Real-time Updates
- Driver location tracking
- ETA calculations
- Customer notifications for driver proximity

### Fleet Management
- Driver availability management
- Shift scheduling
- Performance analytics

## Required Migrations

To enable the spatial driver dispatch:

1. **Run migration 006:** `match_closest_driver` function
2. **Run migration 007:** Add test drivers (optional, for testing)
3. **Ensure spatial index:** `CREATE INDEX idx_drivers_location ON drivers USING GIST (current_location);`

The spatial driver dispatch engine is now fully integrated and ready for production use! 🚗📍

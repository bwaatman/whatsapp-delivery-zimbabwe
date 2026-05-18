import { supabase } from './database';

export interface Order {
  id?: string;
  customer_phone: string;
  status: 'pending' | 'pending_dispatch' | 'assigned' | 'out_for_delivery' | 'delivered';
  delivery_location?: string; // PostGIS geometry
  merchant_id?: string;
  change_requested_usd?: number;
  assigned_driver_id?: string;
  order_details?: string; // Customer's order details
  created_at?: string;
  updated_at?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  current_location?: string; // PostGIS geometry
  is_available: boolean;
  distance_km?: number;
}

export class OrderService {
  async findPendingOrder(customerPhone: string): Promise<Order | null> {
    try {
      console.log('🔍 Searching for pending order for phone:', customerPhone);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', customerPhone)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) {
        console.error('❌ Error finding pending order:', error);
        return null;
      }

      console.log('📋 Pending order found:', data ? 'YES' : 'NO');
      if (data) {
        console.log('📄 Order details:', JSON.stringify(data, null, 2));
      }

      return data;
    } catch (error) {
      console.error('❌ Exception in findPendingOrder:', error);
      return null;
    }
  }

  async createOrder(customerPhone: string, merchantId?: string): Promise<Order | null> {
    try {
      console.log('🆕 Creating new order for phone:', customerPhone);

      const newOrder: Partial<Order> = {
        customer_phone: customerPhone,
        status: 'pending',
        merchant_id: merchantId || undefined,
        change_requested_usd: 0.00
      };

      console.log('📝 New order payload:', JSON.stringify(newOrder, null, 2));

      const { data, error } = await supabase
        .from('orders')
        .insert(newOrder)
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating order:', error);
        return null;
      }

      console.log('✅ Order created successfully!');
      console.log('📄 Order details:', JSON.stringify(data, null, 2));

      return data;
    } catch (error) {
      console.error('❌ Exception in createOrder:', error);
      return null;
    }
  }

  async updateOrderLocation(orderId: string, latitude: number, longitude: number): Promise<boolean> {
    try {
      console.log('📍 Updating order location...');
      console.log('Order ID:', orderId);
      console.log('Latitude:', latitude);
      console.log('Longitude:', longitude);

      // Use PostGIS function to create point geometry
      const locationQuery = `ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)`;

      console.log('🗺️ PostGIS query:', locationQuery);

      const { data, error } = await supabase
        .from('orders')
        .update({
          delivery_location: locationQuery,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating order location:', error);
        return false;
      }

      console.log('✅ Order location updated successfully!');
      console.log('📄 Updated order:', JSON.stringify(data, null, 2));

      return true;
    } catch (error) {
      console.error('❌ Exception in updateOrderLocation:', error);
      return false;
    }
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<boolean> {
    try {
      console.log('🔄 Updating order status...');
      console.log('Order ID:', orderId);
      console.log('New status:', status);

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating order status:', error);
        return false;
      }

      console.log('✅ Order status updated successfully!');
      console.log('📄 Updated order:', JSON.stringify(data, null, 2));

      return true;
    } catch (error) {
      console.error('❌ Exception in updateOrderStatus:', error);
      return false;
    }
  }

  async updateOrderDetails(orderId: string, orderDetails: string): Promise<boolean> {
    try {
      console.log('📝 Updating order details...');
      console.log('Order ID:', orderId);
      console.log('Order details:', orderDetails);

      // Defensive: Ensure orderDetails is a valid string
      if (!orderDetails || typeof orderDetails !== 'string') {
        console.error('❌ Invalid order details provided');
        return false;
      }

      // Defensive: Clean the order details
      const cleanOrderDetails = orderDetails.trim();
      if (!cleanOrderDetails) {
        console.error('❌ Empty order details after trimming');
        return false;
      }

      // First, get the current order to see if order_details exists
      const { data: currentOrder, error: fetchError } = await supabase
        .from('orders')
        .select('order_details')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching current order:', fetchError);
        return false;
      }

      // Prepare the update payload
      let finalOrderDetails: string;
      if (currentOrder.order_details && currentOrder.order_details.trim()) {
        // Append to existing details with a separator
        finalOrderDetails = `${currentOrder.order_details.trim()}\n\n${cleanOrderDetails}`;
        console.log('📝 Appending to existing order details');
      } else {
        // Set as new order details
        finalOrderDetails = cleanOrderDetails;
        console.log('📝 Setting new order details');
      }

      console.log('📋 Final order details:', finalOrderDetails);

      const { data, error } = await supabase
        .from('orders')
        .update({
          order_details: finalOrderDetails,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating order details:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('✅ Order details updated successfully!');
      console.log('📄 Updated order:', JSON.stringify(data, null, 2));

      return true;
    } catch (error) {
      console.error('❌ Exception in updateOrderDetails:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      return false;
    }
  }

  async matchClosestDriver(customerLat: number, customerLng: number): Promise<Driver | null> {
    try {
      console.log('🚗 Finding closest driver...');
      console.log(`📍 Customer location: ${customerLat}, ${customerLng}`);

      const { data, error } = await supabase
        .rpc('match_closest_driver', {
          customer_lat: customerLat,
          customer_lng: customerLng
        });

      if (error) {
        console.error('❌ Error matching driver:', error);
        return null;
      }

      if (!data || data.length === 0) {
        console.log('📭 No available drivers found');
        return null;
      }

      const driver = data[0] as Driver;
      console.log(`✅ Found closest driver: ${driver.name} (${driver.distance_km?.toFixed(2)} km away)`);
      console.log('📄 Driver details:', JSON.stringify(driver, null, 2));

      return driver;
    } catch (error) {
      console.error('❌ Exception in matchClosestDriver:', error);
      return null;
    }
  }

  async assignDriverToOrder(orderId: string, driverId: string): Promise<boolean> {
    try {
      console.log('🔗 Assigning driver to order...');
      console.log(`Order ID: ${orderId}`);
      console.log(`Driver ID: ${driverId}`);

      const { data, error } = await supabase
        .from('orders')
        .update({
          assigned_driver_id: driverId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error assigning driver to order:', error);
        return false;
      }

      console.log('✅ Driver assigned to order successfully!');
      console.log('📄 Updated order:', JSON.stringify(data, null, 2));

      return true;
    } catch (error) {
      console.error('❌ Exception in assignDriverToOrder:', error);
      return false;
    }
  }

  async updateDriverAvailability(driverId: string, isAvailable: boolean): Promise<boolean> {
    try {
      console.log('🔄 Updating driver availability...');
      console.log(`Driver ID: ${driverId}`);
      console.log(`Available: ${isAvailable}`);

      const { data, error } = await supabase
        .from('drivers')
        .update({
          is_available: isAvailable,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating driver availability:', error);
        return false;
      }

      console.log('✅ Driver availability updated successfully!');
      console.log('📄 Updated driver:', JSON.stringify(data, null, 2));

      return true;
    } catch (error) {
      console.error('❌ Exception in updateDriverAvailability:', error);
      return false;
    }
  }

  async setOrderStatusPendingDispatch(orderId: string): Promise<boolean> {
    try {
      console.log('⏳ Setting order status to pending_dispatch...');
      console.log(`Order ID: ${orderId}`);

      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'pending_dispatch',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error setting order status to pending_dispatch:', error);
        return false;
      }

      console.log('✅ Order status set to pending_dispatch successfully!');
      console.log('📄 Updated order:', JSON.stringify(data, null, 2));

      return true;
    } catch (error) {
      console.error('❌ Exception in setOrderStatusPendingDispatch:', error);
      return false;
    }
  }

  async getOrderDetails(orderId: string): Promise<Order | null> {
    try {
      console.log('🔍 Getting order details for ID:', orderId);

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error) {
        console.error('❌ Error getting order details:', error);
        return null;
      }

      console.log('📄 Order details:', JSON.stringify(data, null, 2));
      return data;
    } catch (error) {
      console.error('❌ Exception in getOrderDetails:', error);
      return null;
    }
  }
}

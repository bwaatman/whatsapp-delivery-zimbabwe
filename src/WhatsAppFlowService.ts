import { WhatsAppService } from './WhatsAppService';
import { OrderService, Order } from './OrderService';

export interface WhatsAppFlowState {
  hasActiveOrder: boolean;
  orderStatus?: 'pending' | 'pending_dispatch' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
  order?: Order;
}

export class WhatsAppFlowService {
  private whatsappService: WhatsAppService;
  private orderService: OrderService;

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.orderService = new OrderService();
  }

  async processWhatsAppMessage(from: string, message: any): Promise<void> {
    try {
      console.log('🎯 WhatsAppFlowService.processWhatsAppMessage() ENTRY POINT');
      console.log('🔄 Starting WhatsApp flow processing...');
      console.log(`📱 Customer: ${from}`);
      console.log(`📨 Message type: ${message.type}`);
      console.log(`📨 Message ID: ${message.id}`);
      
      // USE NORMALIZED INTENT FROM WEBHOOK
      const normalizedIntent = message.normalizedIntent;
      console.log(`🎯 Normalized Intent: "${normalizedIntent}"`);
      
      // Log all available message types for debugging
      if (message.originalText) {
        console.log(`📝 Original Text: "${message.originalText}"`);
      }
      if (message.buttonReply) {
        console.log(`� Button Reply: "${message.buttonReply}"`);
      }
      if (message.listReply) {
        console.log(`📋 List Reply: "${message.listReply}"`);
      }
      if (message.locationData) {
        console.log(`📍 Location: ${message.locationData.latitude}, ${message.locationData.longitude}`);
      }
      
      // Legacy support for old message format
      if (message.text) {
        console.log(`�📝 Legacy Text content: "${message.text.body}"`);
      }
      if (message.location) {
        console.log(`📍 Legacy Location: ${message.location.latitude}, ${message.location.longitude}`);
      }

      // Step 1: Query for active orders (not delivered or cancelled)
      console.log('🔍 Checking for active orders...');
      const activeOrder = await this.findActiveOrder(from);
      
      console.log(`📊 Active order result:`, activeOrder ? `FOUND (ID: ${activeOrder.id}, Status: ${activeOrder.status})` : 'NONE');

      // Step 2: Route based on state and normalized intent
      console.log('🔄 Routing message by normalized intent...');
      await this.routeMessageByState(from, message, activeOrder, normalizedIntent);
      
      console.log('✅ WhatsAppFlowService.processWhatsAppMessage() COMPLETED');

    } catch (error) {
      console.error('❌ CRITICAL ERROR in WhatsApp flow processing:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
    }
  }

  private async findActiveOrder(customerPhone: string): Promise<Order | null> {
    try {
      console.log(`🔍 Querying orders table for customer: ${customerPhone}`);
      
      const { data, error } = await (this.orderService as any).supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', customerPhone)
        .in('status', ['pending', 'pending_dispatch', 'assigned', 'out_for_delivery'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Database error finding active order:', error);
        return null;
      }

      if (data) {
        console.log(`✅ Found active order: ${data.id} (status: ${data.status})`);
      } else {
        console.log('📭 No active orders found for customer');
      }

      return data;
    } catch (error) {
      console.error('❌ Exception finding active order:', error);
      return null;
    }
  }

  private async routeMessageByState(from: string, message: any, activeOrder: Order | null, normalizedIntent?: string): Promise<void> {
    const messageType = message.type;

    console.log('🎯 State-based routing decision (with normalized intent):');
    console.log(`- Has active order: ${activeOrder ? 'YES' : 'NO'}`);
    console.log(`- Message type: ${messageType}`);
    console.log(`- Normalized intent: ${normalizedIntent || 'NONE'}`);
    console.log(`- Order status: ${activeOrder?.status || 'N/A'}`);

    // CASE 1: No active order exists
    if (!activeOrder) {
      await this.handleNewCustomerFlow(from, message);
      return;
    }

    // CASE 4: Order is already being processed
    if (activeOrder.status === 'assigned' || activeOrder.status === 'out_for_delivery') {
      await this.handleInProgressOrderFlow(from, activeOrder);
      return;
    }

    // CASE 2 & 3: Pending order exists - USE NORMALIZED INTENT
    if (activeOrder.status === 'pending') {
      // Check for location sharing first (highest priority)
      if (normalizedIntent === 'LOCATION_SHARED' || messageType === 'location') {
        console.log('📍 Location detected - handling location flow');
        if (message.locationData) {
          await this.handlePendingOrderLocationFlow(from, message, activeOrder);
        } else if (message.location) {
          await this.handlePendingOrderLocationFlow(from, message, activeOrder);
        }
      }
      // Check for Google Maps link in text (legacy support)
      else if (message.text?.body && message.text.body.includes('maps.google.com')) {
        console.log('🗺️ Detected Google Maps link in text message');
        await this.handlePendingOrderGoogleMapsFlow(from, message, activeOrder);
      }
      // Handle button replies
      else if (message.buttonReply) {
        console.log('🔘 Button reply detected - handling as text flow');
        await this.handlePendingOrderTextFlow(from, message, activeOrder);
      }
      // Handle list replies
      else if (message.listReply) {
        console.log('📋 List reply detected - handling as text flow');
        await this.handlePendingOrderTextFlow(from, message, activeOrder);
      }
      // Handle text messages (including normalized text intent)
      else if (messageType === 'text' || normalizedIntent) {
        console.log('📝 Text message detected - handling text flow');
        await this.handlePendingOrderTextFlow(from, message, activeOrder);
      }
      else {
        console.log(`📎 Unsupported message type for pending order: ${messageType}`);
        console.log(`📎 Normalized intent: ${normalizedIntent}`);
      }
      return;
    }

    console.log(`⚠️ Unhandled state: Order status ${activeOrder.status} with message type ${messageType}`);
  }

  private async handleNewCustomerFlow(from: string, message: any): Promise<void> {
    console.log('🆕 CASE 1: New customer - creating order...');

    try {
      // Create new order
      const newOrder = await this.orderService.createOrder(from);
      
      if (!newOrder) {
        console.error('❌ Failed to create new order');
        return;
      }

      console.log(`✅ New order created: ${newOrder.id}`);

      // Send welcome message with order instructions
      const welcomeMessage = "Welcome to ZimDelivery! 🇿🇼 What are we delivering today? Please reply with your order details, followed by your WhatsApp Location Pin so our rider can find you.";
      
      const messageSent = await this.whatsappService.sendTextMessage(from, welcomeMessage);
      
      if (messageSent) {
        console.log('📤 Welcome message sent successfully');
      } else {
        console.error('❌ Failed to send welcome message');
      }

    } catch (error) {
      console.error('❌ Error in new customer flow:', error);
    }
  }

  private async handlePendingOrderLocationFlow(from: string, message: any, activeOrder: Order): Promise<void> {
    console.log('📍 CASE 2: Pending order - location received...');

    try {
      const location = message.location;
      console.log(`🌍 Location coordinates: ${location.latitude}, ${location.longitude}`);

      // Update order with location coordinates first
      const locationUpdated = await this.orderService.updateOrderLocation(
        activeOrder.id!,
        location.latitude,
        location.longitude
      );

      if (!locationUpdated) {
        console.error('❌ Failed to update order location');
        return;
      }

      console.log('✅ Order location updated successfully');

      // SPATIAL DRIVER DISPATCH: Find closest available driver
      console.log('🚗 Starting spatial driver matching...');
      const closestDriver = await this.orderService.matchClosestDriver(
        location.latitude,
        location.longitude
      );

      if (closestDriver) {
        // DRIVER FOUND: Assign driver to order
        console.log(`✅ Driver found: ${closestDriver.name} (${closestDriver.distance_km?.toFixed(2)} km away)`);
        
        // Assign driver to order
        const driverAssigned = await this.orderService.assignDriverToOrder(
          activeOrder.id!,
          closestDriver.id
        );

        if (!driverAssigned) {
          console.error('❌ Failed to assign driver to order');
          return;
        }

        // Mark driver as unavailable
        const driverUpdated = await this.orderService.updateDriverAvailability(
          closestDriver.id,
          false
        );

        if (!driverUpdated) {
          console.error('❌ Failed to update driver availability');
        }

        console.log('✅ Driver assignment completed successfully');

        // Send dynamic assignment message to customer
        const assignmentMessage = `Location pinned! 📍 Your order has been assigned to our driver, ${closestDriver.name}. They are heading your way now!`;
        
        const messageSent = await this.whatsappService.sendTextMessage(from, assignmentMessage);
        
        if (messageSent) {
          console.log('📤 Driver assignment message sent successfully');
        } else {
          console.error('❌ Failed to send driver assignment message');
        }

      } else {
        // NO DRIVER AVAILABLE: Set status to pending_dispatch
        console.log('📭 No available drivers found - setting order to pending_dispatch');
        
        const statusUpdated = await this.orderService.setOrderStatusPendingDispatch(activeOrder.id!);
        
        if (!statusUpdated) {
          console.error('❌ Failed to set order status to pending_dispatch');
          return;
        }

        console.log('✅ Order set to pending_dispatch successfully');

        // Send waiting message to customer
        const waitingMessage = "Location pinned! 📍 We are currently pairing your order with a nearby delivery runner and will text you their details shortly.";
        
        const messageSent = await this.whatsappService.sendTextMessage(from, waitingMessage);
        
        if (messageSent) {
          console.log('📤 Waiting message sent successfully');
        } else {
          console.error('❌ Failed to send waiting message');
        }
      }

    } catch (error) {
      console.error('❌ Error in pending order location flow:', error);
    }
  }

  private async handlePendingOrderGoogleMapsFlow(from: string, message: any, activeOrder: Order): Promise<void> {
    console.log('🗺️ CASE 2b: Pending order - Google Maps link received...');

    try {
      const textContent = message.text.body;
      console.log(`📍 Google Maps link received: "${textContent}"`);

      // Extract coordinates from Google Maps URL
      const coordinates = this.extractCoordinatesFromGoogleMaps(textContent);
      
      if (!coordinates) {
        console.error('❌ Could not extract coordinates from Google Maps link');
        await this.whatsappService.sendTextMessage(from, "Sorry, I couldn't read the location from that link. Please share your location using WhatsApp's location pin feature.");
        return;
      }

      console.log(`🌍 Extracted coordinates: ${coordinates.lat}, ${coordinates.lng}`);

      // Update order with location coordinates
      const locationUpdated = await this.orderService.updateOrderLocation(
        activeOrder.id!,
        coordinates.lat,
        coordinates.lng
      );

      if (!locationUpdated) {
        console.error('❌ Failed to update order location');
        return;
      }

      console.log('✅ Order location updated successfully');

      // SPATIAL DRIVER DISPATCH: Find closest available driver
      console.log('🚗 Starting spatial driver matching...');
      const closestDriver = await this.orderService.matchClosestDriver(
        coordinates.lat,
        coordinates.lng
      );

      if (closestDriver) {
        // DRIVER FOUND: Assign driver to order
        console.log(`✅ Driver found: ${closestDriver.name} (${closestDriver.distance_km?.toFixed(2)} km away)`);
        
        // Assign driver to order
        const driverAssigned = await this.orderService.assignDriverToOrder(
          activeOrder.id!,
          closestDriver.id
        );

        if (!driverAssigned) {
          console.error('❌ Failed to assign driver to order');
          return;
        }

        // Mark driver as unavailable
        const driverUpdated = await this.orderService.updateDriverAvailability(
          closestDriver.id,
          false
        );

        if (!driverUpdated) {
          console.error('❌ Failed to update driver availability');
        }

        console.log('✅ Driver assignment completed successfully');

        // Send dynamic assignment message to customer
        const assignmentMessage = `Location pinned! 📍 Your order has been assigned to our driver, ${closestDriver.name}. They are heading your way now!`;
        
        const messageSent = await this.whatsappService.sendTextMessage(from, assignmentMessage);
        
        if (messageSent) {
          console.log('📤 Driver assignment message sent successfully');
        } else {
          console.error('❌ Failed to send driver assignment message');
        }

      } else {
        // NO DRIVER AVAILABLE: Set status to pending_dispatch
        console.log('📭 No available drivers found - setting order to pending_dispatch');
        
        const statusUpdated = await this.orderService.setOrderStatusPendingDispatch(activeOrder.id!);
        
        if (!statusUpdated) {
          console.error('❌ Failed to set order status to pending_dispatch');
          return;
        }

        console.log('✅ Order set to pending_dispatch successfully');

        // Send waiting message to customer
        const waitingMessage = "Location pinned! 📍 We are currently pairing your order with a nearby delivery runner and will text you their details shortly.";
        
        const messageSent = await this.whatsappService.sendTextMessage(from, waitingMessage);
        
        if (messageSent) {
          console.log('📤 Waiting message sent successfully');
        } else {
          console.error('❌ Failed to send waiting message');
        }
      }

    } catch (error) {
      console.error('❌ Error in pending order Google Maps flow:', error);
    }
  }

  private extractCoordinatesFromGoogleMaps(url: string): { lat: number; lng: number } | null {
    try {
      // Extract coordinates from Google Maps URL
      // Format: https://maps.google.com/maps?q=-26.059612274169922%2C28.06102752685547&z=17&hl=en
      const match = url.match(/q=(-?\d+\.?\d*)%2C(-?\d+\.?\d*)/);
      
      if (match && match[1] && match[2]) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error extracting coordinates:', error);
      return null;
    }
  }

  private async handlePendingOrderTextFlow(from: string, message: any, activeOrder: Order): Promise<void> {
    console.log('💬 CASE 3: Pending order - text message received...');

    try {
      // Defensive: Validate message structure
      if (!message || !message.text || !message.text.body) {
        console.error('❌ Invalid message structure in handlePendingOrderTextFlow');
        await this.sendFallbackMessage(from, "Sorry, I couldn't understand your message. Please try again.");
        return;
      }

      const textContent = message.text.body;
      console.log(`📝 Order details received: "${textContent}"`);

      // Defensive: Validate text content
      if (!textContent || typeof textContent !== 'string' || textContent.trim().length === 0) {
        console.error('❌ Empty or invalid text content');
        await this.sendFallbackMessage(from, "Please provide some text for your order details.");
        return;
      }

      // Defensive: Validate order ID
      if (!activeOrder.id) {
        console.error('❌ No order ID available for updating order details');
        await this.sendFallbackMessage(from, "Sorry, there was an issue with your order. Please start over.");
        return;
      }

      // Update order with text details
      console.log('🔄 Attempting to update order details...');
      const detailsUpdated = await this.orderService.updateOrderDetails(activeOrder.id, textContent.trim());
      
      if (!detailsUpdated) {
        console.error('❌ Failed to update order details - sending fallback message');
        await this.sendFallbackMessage(from, "Sorry, I couldn't save your order details. Please try again.");
        return;
      }

      console.log('✅ Order details updated successfully');

      // Send friendly reminder about location pin with robust error handling
      const reminderMessage = "Got it! We've added that to your order notes. Please don't forget to share your WhatsApp Location Pin next so we can route a driver.";
      
      try {
        console.log('📤 Sending reminder message...');
        const messageSent = await this.whatsappService.sendTextMessage(from, reminderMessage);
        
        if (messageSent) {
          console.log('✅ Reminder message sent successfully');
        } else {
          console.error('❌ WhatsApp service returned false for reminder message');
          await this.sendFallbackMessage(from, "We received your order details. Please share your location to continue.");
        }
      } catch (whatsappError) {
        console.error('❌ WhatsApp API error in reminder message:', whatsappError);
        console.error('Meta API Error Details:', whatsappError instanceof Error ? whatsappError.message : 'Unknown error');
        
        // Try to send a simple fallback message
        await this.sendFallbackMessage(from, "Got your order details. Please send your location.");
      }

    } catch (error) {
      console.error('❌ Critical error in handlePendingOrderTextFlow:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
      
      // Send emergency fallback message
      try {
        await this.sendFallbackMessage(from, "Sorry, something went wrong. Please try again or contact support.");
      } catch (fallbackError) {
        console.error('❌ Even fallback message failed:', fallbackError);
      }
    }
  }

  private async sendFallbackMessage(to: string, message: string): Promise<void> {
    try {
      console.log('🆘 Sending fallback message:', message);
      const result = await this.whatsappService.sendTextMessage(to, message);
      if (result) {
        console.log('✅ Fallback message sent successfully');
      } else {
        console.error('❌ Fallback message failed');
      }
    } catch (error) {
      console.error('❌ Error sending fallback message:', error);
    }
  }

  private async handleInProgressOrderFlow(from: string, activeOrder: Order): Promise<void> {
    console.log('🚗 CASE 4: Order already in progress...');

    try {
      console.log(`📊 Order ${activeOrder.id} status: ${activeOrder.status}`);

      // Send status update message
      const statusMessage = "Your order is already being processed! Our driver is on the move. We will alert you the moment they approach your pin.";
      
      const messageSent = await this.whatsappService.sendTextMessage(from, statusMessage);
      
      if (messageSent) {
        console.log('📤 Status update message sent successfully');
      } else {
        console.error('❌ Failed to send status update message');
      }

    } catch (error) {
      console.error('❌ Error in in-progress order flow:', error);
    }
  }

  // Helper method to get current state for debugging
  async getCustomerState(customerPhone: string): Promise<WhatsAppFlowState> {
    const activeOrder = await this.findActiveOrder(customerPhone);
    
    return {
      hasActiveOrder: !!activeOrder,
      orderStatus: activeOrder?.status,
      order: activeOrder || undefined
    };
  }
}

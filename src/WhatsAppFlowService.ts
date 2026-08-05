import { WhatsAppService } from './WhatsAppService';
import { OrderService, Order } from './OrderService';

export interface WhatsAppFlowState {
  hasActiveOrder: boolean;
  orderStatus?: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'pending_dispatch' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
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
      
      const order = await this.orderService.findActiveOrder(customerPhone);

      if (order) {
        console.log(`✅ Found active order: ${order.id} (status: ${order.status})`);
      } else {
        console.log('📭 No active orders found for customer');
      }

      return order;
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
      // Check if customer is sharing location (location-first flow)
      if (normalizedIntent === 'LOCATION_SHARED' || messageType === 'location') {
        console.log('📍 Location detected from new customer - handling location confirmation');
        await this.handleLocationConfirmationFlow(from, message);
      }
      // Handle text messages (new customer greeting)
      else if (messageType === 'text' || normalizedIntent) {
        console.log('📝 Text message from new customer - requesting location');
        await this.handleNewCustomerFlow(from, message);
      }
      else {
        console.log('📎 Unsupported message type for new customer');
      }
      return;
    }

    // CASE 5: Order is already being processed (assigned or out for delivery)
    if (activeOrder.status === 'assigned' || activeOrder.status === 'out_for_delivery') {
      await this.handleInProgressOrderFlow(from, activeOrder);
      return;
    }

    // CASE 6: Order is being processed by shop (confirmed, preparing, ready_for_pickup)
    if (activeOrder.status === 'confirmed' || activeOrder.status === 'preparing' || activeOrder.status === 'ready_for_pickup') {
      await this.handleShopProcessingFlow(from, activeOrder);
      return;
    }

    // CASE 7: Order is waiting for driver assignment (pending_dispatch)
    if (activeOrder.status === 'pending_dispatch') {
      await this.handlePendingDispatchFlow(from, activeOrder);
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
    console.log('🆕 CASE 1: New customer - requesting location...');

    try {
      // Send location request message first (before creating order)
      const locationRequestMessage = "Welcome to Svika! 🇿🇼 Please share your location so we can show businesses near you.";
      
      const messageSent = await this.whatsappService.sendTextMessage(from, locationRequestMessage);
      
      if (messageSent) {
        console.log('📤 Location request message sent successfully');
      } else {
        console.error('❌ Failed to send location request message');
      }

    } catch (error) {
      console.error('❌ Error in new customer flow:', error);
    }
  }

  private async handleLocationConfirmationFlow(from: string, message: any): Promise<void> {
    console.log('📍 CASE 2: Location received - confirming address...');

    try {
      const location = message.location || message.locationData;
      console.log(`🌍 Location coordinates: ${location.latitude}, ${location.longitude}`);

      // Store location in session (temporary, not permanent)
      // TODO: Implement session-based storage for customer location

      // Reverse geocode the location to get address
      const address = await this.reverseGeocodeLocation(location.latitude, location.longitude);
      
      let addressText = address;
      if (!address) {
        addressText = `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        console.log('⚠️ Reverse geocoding failed, using coordinates');
      }

      // Send location confirmation message
      const confirmationMessage = `📍 We found your location:\n${addressText}\n\nIs this correct?`;
      
      const messageSent = await this.whatsappService.sendTextMessage(from, confirmationMessage);
      
      if (messageSent) {
        console.log('📤 Location confirmation message sent successfully');
      } else {
        console.error('❌ Failed to send location confirmation message');
      }

      // TODO: Add interactive buttons for "Use this location" and "Share another location"
      // For now, continue with vendor discovery after a brief delay

    } catch (error) {
      console.error('❌ Error in location confirmation flow:', error);
    }
  }

  private async handleVendorDiscoveryFlow(from: string, message: any): Promise<void> {
    console.log('🔍 CASE 3: Location confirmed - discovering nearby vendors...');

    try {
      // Get customer's location from session
      // TODO: Retrieve from session-based storage
      const customerLat = -17.8292; // Default: Harare (temporary)
      const customerLng = 31.0522;

      // Import ShopService for vendor discovery
      const { ShopService } = await import('./ShopService');
      const shopService = new ShopService();

      // Get categories with nearby vendors
      const categories = await shopService.getCategoriesWithNearbyVendors(customerLat, customerLng);

      if (categories.length === 0) {
        const noVendorsMessage = "We couldn't find any businesses near you. Please try a different location or check back later.";
        await this.whatsappService.sendTextMessage(from, noVendorsMessage);
        return;
      }

      // Build category selection message
      let categoryMessage = "📍 We found businesses near you:\n\n";
      
      categories.forEach((category, index) => {
        categoryMessage += `${index + 1}. ${category.category_icon} ${category.category_name} (${category.vendor_count})\n`;
      });

      categoryMessage += "\nReply with the number of the category you'd like to order from.";

      const messageSent = await this.whatsappService.sendTextMessage(from, categoryMessage);
      
      if (messageSent) {
        console.log('📤 Category selection message sent successfully');
      } else {
        console.error('❌ Failed to send category selection message');
      }

      // TODO: Store categories in session for vendor selection
      // TODO: Handle category selection response

    } catch (error) {
      console.error('❌ Error in vendor discovery flow:', error);
    }
  }

  private async reverseGeocodeLocation(lat: number, lng: number): Promise<string | null> {
    try {
      // TODO: Implement reverse geocoding using external API (e.g., Google Maps, OpenStreetMap)
      // For now, return null to indicate geocoding not available
      console.log('🗺️ Reverse geocoding not yet implemented');
      return null;
    } catch (error) {
      console.error('❌ Error reverse geocoding location:', error);
      return null;
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
      // Defensive: Validate message structure - USE NORMALIZED STRUCTURE
      const textContent = message.originalText || message.normalizedIntent || message.text?.body;
      
      if (!textContent || typeof textContent !== 'string' || textContent.trim().length === 0) {
        console.error('❌ Invalid or empty message content in handlePendingOrderTextFlow');
        console.error('🔍 Message structure:', JSON.stringify(message, null, 2));
        await this.sendFallbackMessage(from, "Sorry, I couldn't understand your message. Please try again.");
        return;
      }
      console.log(`📝 Order details received: "${textContent}"`);

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

  private async handleShopProcessingFlow(from: string, activeOrder: Order): Promise<void> {
    console.log('🏪 CASE 6: Order being processed by shop...');

    try {
      console.log(`📊 Order ${activeOrder.id} status: ${activeOrder.status}`);

      let statusMessage = "";
      
      switch (activeOrder.status) {
        case 'confirmed':
          statusMessage = "Your order has been confirmed by the shop! They are preparing it now.";
          break;
        case 'preparing':
          statusMessage = "Your order is being prepared by the shop. We'll let you know when it's ready for pickup.";
          break;
        case 'ready_for_pickup':
          statusMessage = "Your order is ready for pickup! We're assigning a driver to deliver it to you.";
          break;
        default:
          statusMessage = "Your order is being processed by the shop. We'll keep you updated on the status.";
      }
      
      const messageSent = await this.whatsappService.sendTextMessage(from, statusMessage);
      
      if (messageSent) {
        console.log('📤 Shop processing message sent successfully');
      } else {
        console.error('❌ Failed to send shop processing message');
      }

    } catch (error) {
      console.error('❌ Error in shop processing flow:', error);
    }
  }

  private async handlePendingDispatchFlow(from: string, activeOrder: Order): Promise<void> {
    console.log('⏳ CASE 7: Order waiting for driver assignment...');

    try {
      console.log(`📊 Order ${activeOrder.id} status: ${activeOrder.status}`);

      const statusMessage = "Your order is ready and we're working on assigning a driver. You'll receive a notification once a driver is on the way.";
      
      const messageSent = await this.whatsappService.sendTextMessage(from, statusMessage);
      
      if (messageSent) {
        console.log('📤 Pending dispatch message sent successfully');
      } else {
        console.error('❌ Failed to send pending dispatch message');
      }

    } catch (error) {
      console.error('❌ Error in pending dispatch flow:', error);
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

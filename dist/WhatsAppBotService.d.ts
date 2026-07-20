export interface CustomerSession {
    phone: string;
    state: 'greeting' | 'menu_selection' | 'vendor_selection' | 'product_selection' | 'variant_selection' | 'name_prompt' | 'location_prompt' | 'location_received' | 'tracking';
    selectedCategory?: string;
    selectedVendor?: string;
    selectedProducts?: Array<{
        id: string;
        name: string;
        quantity: number;
        variant?: {
            name: string;
            price_adjustment: number;
        };
    }>;
    productsNeedingVariants?: any[];
    customerName?: string;
    orderId?: string;
    locationReceived?: boolean;
    paymentMethod?: 'cash' | 'card' | 'ecocash';
    lastMessageTime: Date;
}
export declare class WhatsAppBotService {
    private client;
    private sessions;
    private qrCodeData;
    constructor();
    private setupEventListeners;
    initialize(): Promise<void>;
    private handleIncomingMessage;
    private createSession;
    private handleGreetingState;
    private sendGreeting;
    private displayCategories;
    private handleMenuSelectionState;
    private displayVendors;
    private handleVendorSelectionState;
    private displayProducts;
    private handleProductSelectionState;
    private promptForVariantSelection;
    private handleVariantSelectionState;
    private handleNamePromptState;
    private createOrder;
    private promptForLocation;
    private handleLocationMessage;
    private handleLocationPromptState;
    private handleLocationReceivedState;
    private handleOrderTracking;
    getSessions(): Map<string, CustomerSession>;
    getSession(phone: string): CustomerSession | undefined;
    sendOrderStatusNotification(customerPhone: string, orderId: string, status: string): Promise<void>;
    sendMessageToCustomer(phone: string, message: string): Promise<void>;
    getQRCodeData(): string | null;
}
//# sourceMappingURL=WhatsAppBotService.d.ts.map
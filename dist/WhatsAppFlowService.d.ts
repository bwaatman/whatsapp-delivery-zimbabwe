import { Order } from './OrderService';
export interface WhatsAppFlowState {
    hasActiveOrder: boolean;
    orderStatus?: 'pending' | 'confirmed' | 'preparing' | 'ready_for_pickup' | 'pending_dispatch' | 'assigned' | 'out_for_delivery' | 'delivered' | 'cancelled';
    order?: Order;
}
export declare class WhatsAppFlowService {
    private whatsappService;
    private orderService;
    constructor();
    processWhatsAppMessage(from: string, message: any): Promise<void>;
    private findActiveOrder;
    private routeMessageByState;
    private handleNewCustomerFlow;
    private handlePendingOrderLocationFlow;
    private handlePendingOrderGoogleMapsFlow;
    private extractCoordinatesFromGoogleMaps;
    private handlePendingOrderTextFlow;
    private sendFallbackMessage;
    private handleInProgressOrderFlow;
    private handleShopProcessingFlow;
    private handlePendingDispatchFlow;
    getCustomerState(customerPhone: string): Promise<WhatsAppFlowState>;
}
//# sourceMappingURL=WhatsAppFlowService.d.ts.map
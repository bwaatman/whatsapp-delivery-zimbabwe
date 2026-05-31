export interface WhatsAppMessage {
    messaging_product: 'whatsapp';
    to: string;
    text?: {
        body: string;
    };
    type?: 'text' | 'template';
    template?: {
        name: string;
        language: {
            code: string;
        };
        components?: Array<{
            type: string;
            parameters: Array<{
                type: string;
                text?: string;
            }>;
        }>;
    };
}
export declare class WhatsAppService {
    private phoneNumberId;
    private accessToken;
    private baseUrl;
    constructor();
    sendTextMessage(to: string, message: string): Promise<boolean>;
    sendLocationRequest(to: string): Promise<boolean>;
    sendLocationConfirmation(to: string): Promise<boolean>;
    sendOrderStatus(to: string, status: string, details?: string): Promise<boolean>;
    sendTemplateMessage(to: string, templateName: string, parameters?: Array<{
        type: string;
        text: string;
    }>): Promise<boolean>;
    sendOrderConfirmationTemplate(to: string, customerName: string, orderId: string, orderDate: string): Promise<boolean>;
}
//# sourceMappingURL=WhatsAppService.d.ts.map
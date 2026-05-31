import axios from 'axios';

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

export class WhatsAppService {
  private phoneNumberId: string;
  private accessToken: string;
  private baseUrl: string;

  constructor() {
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.accessToken = process.env.WHATSAPP_TOKEN || '';
    this.baseUrl = 'https://graph.facebook.com/v25.0';

    if (!this.phoneNumberId || !this.accessToken) {
      console.log('⚠️ WhatsApp credentials not found in environment variables');
      console.log('WHATSAPP_PHONE_NUMBER_ID:', this.phoneNumberId ? '✅' : '❌');
      console.log('WHATSAPP_TOKEN:', this.accessToken ? '✅' : '❌');
    }
  }

  async sendTextMessage(to: string, message: string): Promise<boolean> {
    try {
      console.log('📤 Sending WhatsApp message...');
      console.log('To:', to);
      console.log('Message:', message);

      const payload: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: to.replace(/[^\d]/g, ''), // Remove non-digits
        text: {
          body: message
        },
        type: 'text'
      };

      console.log('📋 Payload:', JSON.stringify(payload, null, 2));

      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      const headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      };

      console.log('🌐 Request URL:', url);
      console.log('🔐 Headers:', JSON.stringify(headers, null, 2));

      const response = await axios.post(url, payload, { headers });

      console.log('✅ WhatsApp message sent successfully!');
      console.log('📬 Response:', JSON.stringify(response.data, null, 2));

      return true;
    } catch (error: any) {
      console.error('❌ Failed to send WhatsApp message:');
      console.error('Error:', error.message);
      
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      return false;
    }
  }

  async sendLocationRequest(to: string): Promise<boolean> {
    const message = "Welcome to ZimDelivery! 🇿🇼 Please reply to this chat by sharing your Location Pin so our drivers can find you.";
    return await this.sendTextMessage(to, message);
  }

  async sendLocationConfirmation(to: string): Promise<boolean> {
    const message = "Location pinned! 📍 Our delivery runner is compiling your order and heading your way.";
    return await this.sendTextMessage(to, message);
  }

  async sendOrderStatus(to: string, status: string, details?: string): Promise<boolean> {
    let message = `Order status: ${status}`;
    if (details) {
      message += `\n\n${details}`;
    }
    return await this.sendTextMessage(to, message);
  }

  async sendTemplateMessage(to: string, templateName: string, parameters?: Array<{type: string, text: string}>): Promise<boolean> {
    try {
      console.log('📤 Sending WhatsApp template message...');
      console.log('To:', to);
      console.log('Template:', templateName);
      console.log('Parameters:', parameters);

      const payload: WhatsAppMessage = {
        messaging_product: 'whatsapp',
        to: to.replace(/[^\d]/g, ''), // Remove non-digits
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: 'en_US'
          }
        }
      };

      // Add parameters if provided
      if (parameters && parameters.length > 0) {
        payload.template!.components = [{
          type: 'body',
          parameters: parameters
        }];
      }

      console.log('📋 Template Payload:', JSON.stringify(payload, null, 2));

      const url = `${this.baseUrl}/${this.phoneNumberId}/messages`;
      const headers = {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      };

      console.log('🌐 Request URL:', url);

      const response = await axios.post(url, payload, { headers });

      console.log('✅ WhatsApp template message sent successfully!');
      console.log('📬 Response:', JSON.stringify(response.data, null, 2));

      return true;
    } catch (error: any) {
      console.error('❌ Failed to send WhatsApp template message:');
      console.error('Error:', error.message);
      
      if (error.response) {
        console.error('Response Status:', error.response.status);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
      }
      
      return false;
    }
  }

  async sendOrderConfirmationTemplate(to: string, customerName: string, orderId: string, orderDate: string): Promise<boolean> {
    const parameters = [
      { type: 'text', text: customerName },
      { type: 'text', text: orderId },
      { type: 'text', text: orderDate }
    ];

    return await this.sendTemplateMessage(to, 'jaspers_market_order_confirmation_v1', parameters);
  }
}

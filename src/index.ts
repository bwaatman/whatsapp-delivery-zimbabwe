import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// WhatsApp webhook endpoint
app.get('/api/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      // Respond with 200 OK and challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Handle incoming WhatsApp messages
app.post('/api/whatsapp/webhook', async (req, res) => {
  try {
    const data = req.body;
    
    // Log the incoming webhook data for debugging
    console.log('Incoming WhatsApp webhook:', JSON.stringify(data, null, 2));

    // Check if this is a WhatsApp message
    if (data.object === 'whatsapp_business_account') {
      // Process each entry
      for (const entry of data.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            const messages = change.value.messages;
            
            for (const message of messages) {
              await processWhatsAppMessage(message);
            }
          }
        }
      }
    }

    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Process individual WhatsApp message
async function processWhatsAppMessage(message: any) {
  const messageType = message.type;
  const from = message.from; // Customer phone number
  const timestamp = message.timestamp;

  console.log(`Processing ${messageType} message from ${from}`);

  switch (messageType) {
    case 'text':
      const textMessage = message.text.body;
      console.log(`Text message: ${textMessage}`);
      // TODO: Process text message (order placement, etc.)
      break;

    case 'location':
      const location = {
        latitude: message.location.latitude,
        longitude: message.location.longitude,
        name: message.location.name || '',
        address: message.location.address || ''
      };
      console.log(`Location message:`, location);
      // TODO: Process location message (delivery coordinates)
      break;

    case 'image':
    case 'document':
    case 'audio':
    case 'video':
      console.log(`Received ${messageType} message from ${from}`);
      // TODO: Handle media messages if needed
      break;

    default:
      console.log(`Unsupported message type: ${messageType}`);
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'WhatsApp Delivery Platform'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp Delivery Platform server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/api/whatsapp/webhook`);
});

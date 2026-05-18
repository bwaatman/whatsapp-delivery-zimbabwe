import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runHealthCheck } from './health-check';
import { WhatsAppFlowService } from './WhatsAppFlowService';

// Load environment variables
dotenv.config({ path: '.env' });

// Initialize flow service
const whatsappFlowService = new WhatsAppFlowService();

// Debug: Check if environment variables are loaded
console.log('Environment variables loaded:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌');

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
  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN;

  console.log('🔍 Webhook verification attempt:');
  console.log('Mode:', mode);
  console.log('Token received:', token);
  console.log('Token expected:', expectedToken);
  console.log('Challenge:', challenge);

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === 'subscribe' && token === expectedToken) {
      // Respond with 200 OK and challenge token from the request
      console.log('✅ WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      console.log('❌ Token mismatch or wrong mode');
      console.log('Mode check:', mode === 'subscribe');
      console.log('Token check:', token === expectedToken);
      res.sendStatus(403);
    }
  } else {
    console.log('❌ Missing mode or token');
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

// Process individual WhatsApp message using the new flow service
async function processWhatsAppMessage(message: any) {
  const from = message.from; // Customer phone number
  const timestamp = message.timestamp;

  console.log(`📱 Processing WhatsApp message from ${from}`);
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log(`📨 Message type: ${message.type}`);

  // Delegate all processing to the WhatsAppFlowService
  await whatsappFlowService.processWhatsAppMessage(from, message);
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const healthReport = await runHealthCheck();
    res.status(200).json(healthReport);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      service: 'WhatsApp Delivery Platform'
    });
  }
});

// Detailed health check endpoint
app.get('/health/detailed', async (req, res) => {
  try {
    console.log('Running detailed health check...');
    const healthReport = await runHealthCheck();
    
    console.log('\n=== HEALTH CHECK SUMMARY ===');
    console.log(`Overall Status: ${healthReport.overall.toUpperCase()}`);
    console.log(`Database Connection: ${healthReport.database.connection ? '✅' : '❌'}`);
    console.log(`Schema Tables: ${Object.values(healthReport.database.schema).filter(v => v).length}/4 verified`);
    console.log(`Operations: ${Object.values(healthReport.database.operations).filter(v => v).length}/4 working`);
    console.log('=============================\n');
    
    res.status(200).json(healthReport);
  } catch (error) {
    console.error('Detailed health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      service: 'WhatsApp Delivery Platform'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`WhatsApp Delivery Platform server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/api/whatsapp/webhook`);
});

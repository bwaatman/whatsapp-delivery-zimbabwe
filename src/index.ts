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

// Debug: Show port configuration
console.log('🔧 Port Configuration:');
console.log('  process.env.PORT:', process.env.PORT);
console.log('  Using PORT:', PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DEBUG MIDDLEWARE: Log ALL incoming requests to webhook endpoint
app.use('/api/whatsapp/webhook', (req, res, next) => {
  console.log('🚨 WEBHOOK REQUEST INTERCEPTED:');
  console.log('📡 Method:', req.method);
  console.log('🔗 URL:', req.url);
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Query params:', JSON.stringify(req.query, null, 2));
  console.log('--- END INTERCEPT ---');
  next();
});

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
  // AGGRESSIVE DIAGNOSTIC: Log everything immediately before any checks
  console.log('🚨🚨🚨 POST WEBHOOK HIT - AGGRESSIVE LOGGING START 🚨🚨🚨');
  console.log('📦 Raw Body:', JSON.stringify(req.body, null, 2));
  console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('🔍 Query:', JSON.stringify(req.query, null, 2));
  console.log('📡 Method:', req.method);
  console.log('🔗 URL:', req.url);
  console.log('🚨🚨🚨 END AGGRESSIVE LOGGING 🚨🚨🚨');
  
  try {
    // UNIVERSAL DIAGNOSTIC: Log raw webhook body immediately
    console.log('🔍 RAW WEBHOOK BODY RECEIVED:', JSON.stringify(req.body, null, 2));
    
    // Check for Meta signature validation
    const signature = req.headers['x-hub-signature-256'];
    console.log('🔐 Meta Signature Check Status:', signature ? 'PRESENT' : 'MISSING');
    if (signature) {
      console.log('🔐 Signature Value:', signature);
    }
    
    const data = req.body;
    console.log('📊 Webhook object type:', data?.object);
    console.log('📊 Entry count:', data?.entry?.length || 0);

    // Check if this is a WhatsApp message
    if (data.object === 'whatsapp_business_account') {
      console.log('✅ WhatsApp Business Account detected');
      
      // Process each entry
      for (const entry of data.entry) {
        console.log('🔄 Processing entry:', entry.id);
        console.log('🔄 Changes count:', entry.changes?.length || 0);
        
        for (const change of entry.changes) {
          console.log('🔄 Change field:', change.field);
          
          if (change.field === 'messages') {
            console.log('📨 Messages field detected');
            const messages = change.value.messages;
            console.log('📨 Messages count:', messages?.length || 0);
            
            // SAFELY EXTRACT FIRST MESSAGE
            if (messages && messages.length > 0) {
              const firstMessage = messages[0];
              console.log('📱 First message extraction:');
              console.log('  - From:', firstMessage.from);
              console.log('  - Type:', firstMessage.type);
              console.log('  - ID:', firstMessage.id);
              console.log('  - Timestamp:', firstMessage.timestamp);
              
              if (firstMessage.text) {
                console.log('  - Text body:', firstMessage.text.body);
              }
              if (firstMessage.location) {
                console.log('  - Location:', firstMessage.location);
              }
              
              for (const message of messages) {
                console.log('🔄 Processing message:', message.id);
                await processWhatsAppMessage(message);
              }
            } else {
              console.log('❌ No messages found in change.value.messages');
            }
          } else {
            console.log('⚠️ Non-messages change field:', change.field);
          }
        }
      }
    } else {
      console.log('❌ Not a WhatsApp Business Account object:', data.object);
    }

    console.log('✅ Webhook processing completed - sending 200 response');
    res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('❌ CRITICAL ERROR in webhook handler:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
    
    // ALWAYS send 200 response to Meta even on error
    console.log('📤 Sending error response 200 to Meta (to prevent retries)');
    res.status(200).send('EVENT_RECEIVED');
  }
});

// Process individual WhatsApp message using the new flow service
async function processWhatsAppMessage(message: any) {
  const from = message.from; // Customer phone number
  const timestamp = message.timestamp;

  console.log(`📱 processWhatsAppMessage() called with:`);
  console.log(`  - From: ${from}`);
  console.log(`  - Timestamp: ${timestamp}`);
  console.log(`  - Type: ${message.type}`);
  console.log(`  - Message ID: ${message.id}`);
  
  if (message.text) {
    console.log(`  - Text: "${message.text.body}"`);
  }
  if (message.location) {
    console.log(`  - Location: ${message.location.latitude}, ${message.location.longitude}`);
  }

  try {
    console.log(`🔄 Delegating to WhatsAppFlowService...`);
    // Delegate all processing to the WhatsAppFlowService
    await whatsappFlowService.processWhatsAppMessage(from, message);
    console.log(`✅ WhatsAppFlowService processing completed`);
  } catch (error) {
    console.error(`❌ WhatsAppFlowService error:`, error);
    console.error(`❌ Error stack:`, error instanceof Error ? error.stack : 'No stack');
  }
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`WhatsApp Delivery Platform server running on port ${PORT}`);
  console.log(`🌐 Server listening on 0.0.0.0:${PORT} (accepting external traffic)`);
  
  // Show appropriate webhook URL based on environment
  if (process.env.NODE_ENV === 'production') {
    console.log(`Webhook endpoint: ${process.env.RENDER_EXTERNAL_URL || 'https://whatsapp-delivery-zimbabwe.onrender.com'}/api/whatsapp/webhook`);
  } else {
    console.log(`Webhook endpoint: http://localhost:${PORT}/api/whatsapp/webhook`);
  }
});

import express from 'express';
import { WhatsAppBotService } from './WhatsAppBotService';
import dotenv from 'dotenv';
import { supabase } from './database';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.BOT_PORT || '10001', 10);

console.log('🚀 Starting Standalone WhatsApp Bot Server...');
console.log('📊 Environment check:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌');
console.log('  BOT_PORT:', PORT);

// Middleware
app.use(express.json());

// WhatsApp QR Code endpoint
app.get('/whatsapp-qr', (req, res) => {
  const possiblePaths = [
    path.join(__dirname, '..', 'public', 'whatsapp-qr.png'),
    path.join(__dirname, 'public', 'whatsapp-qr.png'),
    path.join(process.cwd(), 'public', 'whatsapp-qr.png'),
  ];
  
  for (const qrPath of possiblePaths) {
    if (fs.existsSync(qrPath)) {
      return res.sendFile(qrPath);
    }
  }
  
  res.status(404).send('QR Code not available. WhatsApp bot may not be initialized or already connected.');
});

// WhatsApp QR Code page
app.get('/whatsapp-qr-page', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WhatsApp QR Code</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          text-align: center;
          max-width: 500px;
        }
        h1 {
          color: #128C7E;
          margin-bottom: 20px;
        }
        .qr-container {
          margin: 20px 0;
        }
        img {
          max-width: 300px;
          border: 2px solid #128C7E;
          border-radius: 10px;
        }
        .instructions {
          color: #666;
          margin-top: 20px;
          text-align: left;
        }
        .refresh-btn {
          background: #25D366;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 20px;
          font-size: 16px;
        }
        .refresh-btn:hover {
          background: #128C7E;
        }
        .error {
          color: red;
          padding: 20px;
          background: #fee;
          border-radius: 10px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📱 WhatsApp QR Code</h1>
        <div class="qr-container">
          <img src="/whatsapp-qr" alt="WhatsApp QR Code" onerror="this.style.display='none'; document.getElementById('error').style.display='block'; document.getElementById('loading').style.display='none';">
          <div id="loading" style="color: #666;">Loading QR code...</div>
          <div id="error" style="display:none; color: red; padding: 20px;">
            QR Code not available. This could mean:<br>
            - The bot is still initializing (wait a few seconds and refresh)<br>
            - The bot is already connected to WhatsApp<br>
            - There was an error initializing the bot
          </div>
        </div>
        <button class="refresh-btn" onclick="location.reload()">Refresh QR Code</button>
        <div class="instructions">
          <h3>How to connect:</h3>
          <ol>
            <li>Open WhatsApp on your phone</li>
            <li>Go to Settings → Linked Devices</li>
            <li>Tap "Link a Device"</li>
            <li>Scan this QR code</li>
          </ol>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'WhatsApp Bot Server' });
});

async function startBot() {
  try {
    // Test database connection
    console.log('🔌 Testing database connection...');
    const { data, error } = await supabase.from('merchants').select('id').limit(1);
    if (error) {
      console.error('❌ Database connection failed:', error);
      process.exit(1);
    }
    console.log('✅ Database connection successful');

    // Initialize WhatsApp Bot
    console.log('🤖 Initializing WhatsApp Bot...');
    const whatsappBot = new WhatsAppBotService();
    
    await whatsappBot.initialize();
    
    console.log('✅ WhatsApp Bot initialized successfully');
    console.log('📱 QR Code will be generated shortly...');
    console.log(`🌐 Open http://localhost:${PORT}/whatsapp-qr-page to scan the QR code`);
    
    // Start HTTP server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🌐 Bot server running on port ${PORT}`);
      console.log(`📱 QR Code page: http://localhost:${PORT}/whatsapp-qr-page`);
    });
    
    // Keep the process alive
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down WhatsApp Bot Server...');
      process.exit(0);
    });
    
    // Keep-alive heartbeat
    setInterval(() => {
      console.log('💓 Bot is running...');
    }, 60000); // Log every minute
    
  } catch (error) {
    console.error('❌ Failed to start WhatsApp Bot:', error);
    process.exit(1);
  }
}

startBot();

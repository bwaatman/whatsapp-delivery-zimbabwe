import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runHealthCheck } from './health-check';
import shopRoutes from './shopRoutes';
import driverRoutes from './driverRoutes';
import adminRoutes from './adminRoutes';
import authRoutes from './authRoutes';
import categoryRoutes from './categoryRoutes';
import paymentRoutes from './paymentRoutes';
import { WhatsAppBotService } from './WhatsAppBotService';
import { setWhatsAppBotService as setShopWhatsAppBotService } from './ShopService';
import { setWhatsAppBotService as setDriverWhatsAppBotService } from './DriverService';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Debug: Check if environment variables are loaded
console.log('Environment variables loaded:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Debug: Show port configuration
console.log('🔧 Port Configuration:');
console.log('  process.env.PORT:', process.env.PORT);
console.log('  Using PORT:', PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (dashboards)
const publicPath = path.join(__dirname, '..', 'public');
console.log('Serving static files from:', publicPath);
console.log('Public directory exists:', fs.existsSync(publicPath));

// Dashboard routes - serve HTML files directly
app.get('/admin', (req, res) => {
  const filePath = path.join(publicPath, 'admin-dashboard.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Admin dashboard not found');
  }
});

app.get('/vendor', (req, res) => {
  const filePath = path.join(publicPath, 'vendor-dashboard.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Vendor dashboard not found');
  }
});

app.get('/driver', (req, res) => {
  const filePath = path.join(publicPath, 'driver-dashboard.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Driver dashboard not found');
  }
});

// Registration and login routes
app.get('/login', (req, res) => {
  const filePath = path.join(publicPath, 'login.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Login page not found');
  }
});

app.get('/driver-register', (req, res) => {
  const filePath = path.join(publicPath, 'driver-register.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Driver registration page not found');
  }
});

app.get('/vendor-register', (req, res) => {
  const filePath = path.join(publicPath, 'vendor-register.html');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Vendor registration page not found');
  }
});

// Also serve static files for direct access
app.use(express.static(publicPath));

// Catch-all route for SPA-like behavior - serve index.html for unknown routes
app.get('*', (req, res) => {
  // If it's an API route, return 404
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return res.status(404).send('Not found');
  }
  
  // For dashboard routes, try to serve the appropriate HTML file
  if (req.path === '/admin' || req.path.startsWith('/admin')) {
    const filePath = path.join(publicPath, 'admin-dashboard.html');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  } else if (req.path === '/vendor' || req.path.startsWith('/vendor')) {
    const filePath = path.join(publicPath, 'vendor-dashboard.html');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  } else if (req.path === '/driver' || req.path.startsWith('/driver')) {
    const filePath = path.join(publicPath, 'driver-dashboard.html');
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  
  // Default to serving static files
  res.status(404).send('Page not found');
});

// Serve WhatsApp QR code
app.get('/whatsapp-qr', (req, res) => {
  const qrPath = path.join(publicPath, 'whatsapp-qr.png');
  if (fs.existsSync(qrPath)) {
    res.sendFile(qrPath);
  } else {
    res.status(404).send('QR code not found. Please wait for the bot to generate it.');
  }
});

app.get('/whatsapp-qr.png', (req, res) => {
  const qrPath = path.join(publicPath, 'whatsapp-qr.png');
  if (fs.existsSync(qrPath)) {
    res.sendFile(qrPath);
  } else {
    res.status(404).send('QR code not found. Please wait for the bot to generate it.');
  }
});

// API Routes
app.use('/api', shopRoutes);
app.use('/api', driverRoutes);
app.use('/api', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', categoryRoutes);
app.use('/api', paymentRoutes);

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
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`WhatsApp Delivery Platform server running on port ${PORT}`);
  console.log(`🌐 Server listening on 0.0.0.0:${PORT} (accepting external traffic)`);
  console.log(`Dashboard URLs:`);
  console.log(`  - Admin: http://localhost:${PORT}/admin`);
  console.log(`  - Vendor: http://localhost:${PORT}/vendor`);
  console.log(`  - Driver: http://localhost:${PORT}/driver`);
});

// Initialize WhatsApp Bot Service (optional, can be enabled via environment variable)
const ENABLE_WHATSAPP_BOT = process.env.ENABLE_WHATSAPP_BOT === 'true';

if (ENABLE_WHATSAPP_BOT) {
  console.log('🤖 Initializing WhatsApp Bot Service...');
  const whatsappBot = new WhatsAppBotService();
  
  // Set the WhatsApp bot service reference for ShopService and DriverService to use for notifications
  setShopWhatsAppBotService(whatsappBot);
  setDriverWhatsAppBotService(whatsappBot);
  
  whatsappBot.initialize().catch((error) => {
    console.error('❌ Failed to initialize WhatsApp Bot:', error);
    console.log('⚠️ WhatsApp Bot will not be available. Continuing with web dashboard only.');
  });
} else {
  console.log('⚠️ WhatsApp Bot is disabled. Set ENABLE_WHATSAPP_BOT=true in .env to enable it.');
}

// Keep the server running
console.log('Server started successfully. Press Ctrl+C to stop.');

// Keep the process alive by preventing it from exiting
setInterval(() => {
  // Keep-alive heartbeat
}, 1000);

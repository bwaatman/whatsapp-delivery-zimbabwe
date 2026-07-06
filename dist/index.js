"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const health_check_1 = require("./health-check");
const shopRoutes_1 = __importDefault(require("./shopRoutes"));
const driverRoutes_1 = __importDefault(require("./driverRoutes"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const categoryRoutes_1 = __importDefault(require("./categoryRoutes"));
const paymentRoutes_1 = __importDefault(require("./paymentRoutes"));
const WhatsAppBotService_1 = require("./WhatsAppBotService");
const ShopService_1 = require("./ShopService");
const DriverService_1 = require("./DriverService");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables
dotenv_1.default.config();
// Debug: Check if environment variables are loaded
console.log('Environment variables loaded:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌');
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
// Debug: Show port configuration
console.log('🔧 Port Configuration:');
console.log('  process.env.PORT:', process.env.PORT);
console.log('  Using PORT:', PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV);
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging middleware - log ALL incoming requests
app.use((req, res, next) => {
    console.log('📥 Incoming request:', {
        method: req.method,
        path: req.path,
        url: req.url,
        headers: req.headers
    });
    next();
});
// Serve static files (dashboards)
const publicPath = path_1.default.join(__dirname, 'public');
console.log('Serving static files from:', publicPath);
console.log('Public directory exists:', fs_1.default.existsSync(publicPath));
// Dashboard routes - serve HTML files directly
app.get('/admin', (req, res) => {
    const filePath = path_1.default.join(publicPath, 'admin-dashboard.html');
    console.log('🔍 Admin dashboard request. Path:', filePath);
    console.log('🔍 File exists:', fs_1.default.existsSync(filePath));
    console.log('🔍 Public directory:', publicPath);
    console.log('🔍 __dirname:', __dirname);
    if (fs_1.default.existsSync(filePath)) {
        res.sendFile(filePath);
    }
    else {
        console.log('❌ Admin dashboard file not found at:', filePath);
        console.log('❌ Listing public directory contents:');
        try {
            const files = fs_1.default.readdirSync(publicPath);
            console.log('Files in public:', files);
        }
        catch (e) {
            console.log('❌ Cannot read public directory:', e);
        }
        res.status(404).send('Admin dashboard not found');
    }
});
app.get('/vendor', (req, res) => {
    const filePath = path_1.default.join(publicPath, 'vendor-dashboard.html');
    console.log('🔍 Vendor dashboard request. Path:', filePath);
    console.log('🔍 File exists:', fs_1.default.existsSync(filePath));
    if (fs_1.default.existsSync(filePath)) {
        res.sendFile(filePath);
    }
    else {
        console.log('❌ Vendor dashboard file not found at:', filePath);
        res.status(404).send('Vendor dashboard not found');
    }
});
app.get('/driver', (req, res) => {
    const filePath = path_1.default.join(publicPath, 'driver-dashboard.html');
    console.log('🔍 Driver dashboard request. Path:', filePath);
    console.log('🔍 File exists:', fs_1.default.existsSync(filePath));
    if (fs_1.default.existsSync(filePath)) {
        res.sendFile(filePath);
    }
    else {
        console.log('❌ Driver dashboard file not found at:', filePath);
        res.status(404).send('Driver dashboard not found');
    }
});
// Registration and login routes
app.get('/login', (req, res) => {
    const filePath = path_1.default.join(publicPath, 'login.html');
    if (fs_1.default.existsSync(filePath)) {
        res.sendFile(filePath);
    }
    else {
        res.status(404).send('Login page not found');
    }
});
app.get('/driver-register', (req, res) => {
    const filePath = path_1.default.join(publicPath, 'driver-register.html');
    if (fs_1.default.existsSync(filePath)) {
        res.sendFile(filePath);
    }
    else {
        res.status(404).send('Driver registration page not found');
    }
});
app.get('/vendor-register', (req, res) => {
    const filePath = path_1.default.join(publicPath, 'vendor-register.html');
    if (fs_1.default.existsSync(filePath)) {
        res.sendFile(filePath);
    }
    else {
        res.status(404).send('Vendor registration page not found');
    }
});
// Root route - serve a simple landing page (must be before static files)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ZimDelivery - WhatsApp Delivery Platform</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0;
                padding: 20px;
            }
            .container {
                background: white;
                border-radius: 10px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.1);
                padding: 40px;
                max-width: 600px;
                text-align: center;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
            }
            .button {
                display: inline-block;
                margin: 10px;
                padding: 15px 30px;
                border-radius: 5px;
                text-decoration: none;
                color: white;
                font-weight: bold;
                transition: transform 0.3s ease;
            }
            .button:hover {
                transform: translateY(-3px);
            }
            .admin { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
            .vendor { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
            .driver { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚚 ZimDelivery Platform</h1>
            <p style="color: #666; margin-bottom: 30px;">Select your dashboard to continue</p>
            <a href="/admin" class="button admin">Admin Dashboard</a><br>
            <a href="/vendor" class="button vendor">Vendor Dashboard</a><br>
            <a href="/driver" class="button driver">Driver Dashboard</a>
        </div>
    </body>
    </html>
  `);
});
// Also serve static files for direct access
app.use(express_1.default.static(publicPath));
// Serve WhatsApp QR code
app.get('/whatsapp-qr', (req, res) => {
    const qrPath = path_1.default.join(publicPath, 'whatsapp-qr.png');
    if (fs_1.default.existsSync(qrPath)) {
        res.sendFile(qrPath);
    }
    else {
        res.status(404).send('QR code not found. Please wait for the bot to generate it.');
    }
});
app.get('/whatsapp-qr.png', (req, res) => {
    const qrPath = path_1.default.join(publicPath, 'whatsapp-qr.png');
    if (fs_1.default.existsSync(qrPath)) {
        res.sendFile(qrPath);
    }
    else {
        res.status(404).send('QR code not found. Please wait for the bot to generate it.');
    }
});
// API Routes
app.use('/api', shopRoutes_1.default);
app.use('/api', driverRoutes_1.default);
app.use('/api', adminRoutes_1.default);
app.use('/api/auth', authRoutes_1.default);
app.use('/api', categoryRoutes_1.default);
app.use('/api', paymentRoutes_1.default);
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const healthReport = await (0, health_check_1.runHealthCheck)();
        res.status(200).json(healthReport);
    }
    catch (error) {
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
        const healthReport = await (0, health_check_1.runHealthCheck)();
        console.log('\n=== HEALTH CHECK SUMMARY ===');
        console.log(`Overall Status: ${healthReport.overall.toUpperCase()}`);
        console.log(`Database Connection: ${healthReport.database.connection ? '✅' : '❌'}`);
        console.log(`Schema Tables: ${Object.values(healthReport.database.schema).filter(v => v).length}/4 verified`);
        console.log(`Operations: ${Object.values(healthReport.database.operations).filter(v => v).length}/4 working`);
        console.log('=============================\n');
        res.status(200).json(healthReport);
    }
    catch (error) {
        console.error('Detailed health check failed:', error);
        res.status(500).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            service: 'WhatsApp Delivery Platform'
        });
    }
});
// WhatsApp QR Code endpoint
app.get('/whatsapp-qr', (req, res) => {
    const qrPath = path_1.default.join(__dirname, 'public', 'whatsapp-qr.png');
    if (fs_1.default.existsSync(qrPath)) {
        res.sendFile(qrPath);
    }
    else {
        res.status(404).send('QR Code not available. WhatsApp bot may not be initialized or already connected.');
    }
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
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📱 WhatsApp QR Code</h1>
        <div class="qr-container">
          <img src="/whatsapp-qr" alt="WhatsApp QR Code" onerror="this.style.display='none'; document.getElementById('error').style.display='block';">
          <div id="error" style="display:none; color: red; padding: 20px;">
            QR Code not available. Make sure WhatsApp bot is enabled (ENABLE_WHATSAPP_BOT=true) and the server has been restarted.
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
    const whatsappBot = new WhatsAppBotService_1.WhatsAppBotService();
    // Set the WhatsApp bot service reference for ShopService and DriverService to use for notifications
    (0, ShopService_1.setWhatsAppBotService)(whatsappBot);
    (0, DriverService_1.setWhatsAppBotService)(whatsappBot);
    whatsappBot.initialize().catch((error) => {
        console.error('❌ Failed to initialize WhatsApp Bot:', error);
        console.log('⚠️ WhatsApp Bot will not be available. Continuing with web dashboard only.');
    });
}
else {
    console.log('⚠️ WhatsApp Bot is disabled. Set ENABLE_WHATSAPP_BOT=true in .env to enable it.');
}
// Keep the server running
console.log('Server started successfully. Press Ctrl+C to stop.');
// Keep the process alive by preventing it from exiting
setInterval(() => {
    // Keep-alive heartbeat
}, 1000);
//# sourceMappingURL=index.js.map
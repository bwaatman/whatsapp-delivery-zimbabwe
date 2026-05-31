import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { runHealthCheck } from './health-check';
import shopRoutes from './shopRoutes';
import driverRoutes from './driverRoutes';
import adminRoutes from './adminRoutes';
import authRoutes from './authRoutes';
import categoryRoutes from './categoryRoutes';
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

// API Routes
app.use('/api', shopRoutes);
app.use('/api', driverRoutes);
app.use('/api', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', categoryRoutes);

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

// Keep the server running
console.log('Server started successfully. Press Ctrl+C to stop.');

// Keep the process alive by preventing it from exiting
setInterval(() => {
  // Keep-alive heartbeat
}, 1000);

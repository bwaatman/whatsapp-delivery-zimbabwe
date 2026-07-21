#!/bin/bash

# VPS Setup Script for WhatsApp Delivery Platform
# This script sets up the full application on a fresh Ubuntu VPS

set -e

echo "🚀 Starting VPS setup for WhatsApp Delivery Platform..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install Chrome for WhatsApp bot
echo "📦 Installing Chrome..."
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt install -y ./google-chrome-stable_current_amd64.deb
rm google-chrome-stable_current_amd64.deb

# Install PM2 for process management
echo "📦 Installing PM2..."
npm install -g pm2

# Install git if not present
echo "📦 Installing Git..."
apt install -y git

# Clone repository (if not already cloned)
if [ ! -d "whatsapp-delivery-zimbabwe" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/bwaatman/whatsapp-delivery-zimbabwe.git
    cd whatsapp-delivery-zimbabwe
else
    echo "📁 Repository already exists, pulling latest changes..."
    cd whatsapp-delivery-zimbabwe
    git pull
fi

# Install dependencies
echo "📦 Installing project dependencies..."
npm install

# Build the project
echo "🔨 Building the project..."
npm run build

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating template..."
    cat > .env << EOF
# Please add your Supabase credentials here
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
BOT_PORT=10001
PORT=3000
EOF
    echo "⚠️  Please edit .env file with your credentials:"
    echo "   nano .env"
fi

# Setup PM2 ecosystem file
echo "⚙️  Setting up PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'whatsapp-delivery-api',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'whatsapp-bot-server',
      script: 'dist/bot-server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        BOT_PORT: 10001
      }
    }
  ]
};
EOF

# Setup firewall
echo "🔒 Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw allow 10001/tcp
ufw --force enable

echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your credentials: nano .env"
echo "2. Start the application: pm2 start ecosystem.config.js"
echo "3. View logs: pm2 logs"
echo "4. Save PM2 config: pm2 save"
echo "5. Setup PM2 to start on boot: pm2 startup"
echo ""
echo "🌐 Your application will be available at:"
echo "   - API: http://$(curl -s ifconfig.me):3000"
echo "   - Bot QR: http://$(curl -s ifconfig.me):10001/whatsapp-qr-page"

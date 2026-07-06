#!/bin/bash

# WhatsApp Bot VPS Setup Script
# This script automates the setup of the WhatsApp bot on a VPS

set -e

echo "🚀 Starting WhatsApp Bot VPS Setup..."
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify Node.js installation
echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install Chrome/Chromium
echo "📦 Installing Chrome..."
apt install -y chromium-browser

# Verify Chrome installation
echo "✅ Chrome version: $(chromium-browser --version)"

# Install additional dependencies
echo "📦 Installing additional dependencies..."
apt install -y build-essential libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2

# Install project dependencies
echo "📦 Installing project dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
BOT_PORT=10001
EOF
    echo "⚠️  Please edit .env file with your Supabase credentials"
fi

# Create systemd service
echo "📝 Creating systemd service..."
cat > /etc/systemd/system/whatsapp-bot.service << EOF
[Unit]
Description=WhatsApp Bot Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/npm run bot:server
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
systemctl daemon-reload

# Enable service
systemctl enable whatsapp-bot

# Configure firewall
echo "🔒 Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 10001/tcp
    ufw reload
    echo "✅ Firewall configured"
else
    echo "⚠️  ufw not found, please configure firewall manually"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file with your Supabase credentials:"
echo "   nano .env"
echo ""
echo "2. Start the bot:"
echo "   sudo systemctl start whatsapp-bot"
echo ""
echo "3. Check status:"
echo "   sudo systemctl status whatsapp-bot"
echo ""
echo "4. View logs:"
echo "   sudo journalctl -u whatsapp-bot -f"
echo ""
echo "5. Access QR code at:"
echo "   http://$(curl -s ifconfig.me):10001/whatsapp-qr-page"
echo ""

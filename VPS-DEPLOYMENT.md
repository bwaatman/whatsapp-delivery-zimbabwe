# WhatsApp Bot VPS Deployment Guide

This guide will help you deploy the WhatsApp bot to a VPS (Virtual Private Server) using `whatsapp-web.js`.

## Prerequisites

- A VPS (DigitalOcean, AWS EC2, Linode, etc.) with:
  - Ubuntu 20.04 or 22.04 (recommended)
  - At least 1GB RAM
  - At least 10GB storage
- SSH access to your VPS
- Your VPS IP address
- Git installed on your local machine

## Quick Deployment (Automated)

### Step 1: SSH into your VPS

```bash
ssh root@your-vps-ip
```

### Step 2: Clone your repository

```bash
git clone https://github.com/bwaatman/whatsapp-delivery-zimbabwe.git
cd whatsapp-delivery-zimbabwe
```

### Step 3: Run the setup script

```bash
chmod +x setup-bot.sh
./setup-bot.sh
```

The script will:
- Install Node.js and npm
- Install Chrome/Chromium
- Install project dependencies
- Create a `.env` file
- Set up the bot as a systemd service
- Start the bot

### Step 4: Configure environment variables

Edit the `.env` file:

```bash
nano .env
```

Add your Supabase credentials:

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
BOT_PORT=10001
```

### Step 5: Start the bot

```bash
# If using systemd
sudo systemctl start whatsapp-bot
sudo systemctl enable whatsapp-bot

# Or run directly
npm run bot:server
```

### Step 6: Access the QR code

Open your browser and go to:
```
http://your-vps-ip:10001/whatsapp-qr-page
```

Scan the QR code with WhatsApp to connect.

## Manual Deployment

If you prefer to do it manually:

### 1. Update system packages

```bash
apt update && apt upgrade -y
```

### 2. Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs
```

### 3. Install Chrome/Chromium

```bash
apt install -y chromium-browser
# OR
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
apt install -y ./google-chrome-stable_current_amd64.deb
```

### 4. Install project dependencies

```bash
npm install
```

### 5. Create .env file

```bash
cp .env.example .env
nano .env
```

Add your credentials.

### 6. Run the bot

```bash
npm run bot:server
```

## Managing the Bot Service

### Check status
```bash
sudo systemctl status whatsapp-bot
```

### View logs
```bash
sudo journalctl -u whatsapp-bot -f
```

### Restart bot
```bash
sudo systemctl restart whatsapp-bot
```

### Stop bot
```bash
sudo systemctl stop whatsapp-bot
```

## Firewall Configuration

Make sure port 10001 is open:

```bash
ufw allow 10001/tcp
ufw reload
```

## Troubleshooting

### Bot won't start
- Check logs: `sudo journalctl -u whatsapp-bot -f`
- Make sure Chrome is installed: `google-chrome --version`
- Check Node.js version: `node --version` (should be 18+)

### QR code not showing
- Wait 30-60 seconds for the bot to initialize
- Check if the bot is running: `sudo systemctl status whatsapp-bot`
- Try accessing the QR page directly: `curl http://localhost:10001/whatsapp-qr`

### Bot disconnects frequently
- Make sure your VPS has enough RAM (at least 1GB)
- Consider using a swap file if RAM is low
- Check your internet connection stability

## Security Tips

1. Use a firewall to restrict access to port 10001
2. Consider using a reverse proxy (nginx) with SSL
3. Don't commit your `.env` file to git
4. Use strong passwords for your VPS
5. Keep your system updated

## Alternative: Docker Deployment

See `docker-compose.yml` for Docker-based deployment.

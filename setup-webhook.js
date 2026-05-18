const axios = require('axios');

// This script helps you automatically update the WhatsApp webhook URL
// when you get a new cloudflared tunnel URL

async function updateWebhookUrl(newUrl) {
  const webhookUrl = `${newUrl}/api/whatsapp/webhook`;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'test_verify_token';
  
  console.log('🔧 Setting up WhatsApp webhook...');
  console.log(`📡 Webhook URL: ${webhookUrl}`);
  console.log(`🔑 Verify Token: ${verifyToken}`);
  
  console.log('\n📋 Manual Steps Required:');
  console.log('1. Go to Meta for Developers > WhatsApp > Configuration');
  console.log('2. Click "Edit" on the Webhook card');
  console.log(`3. Paste this URL: ${webhookUrl}`);
  console.log(`4. Enter verify token: ${verifyToken}`);
  console.log('5. Click "Save and verify"');
  
  console.log('\n✅ Your webhook will be ready to receive messages!');
}

// Get the current cloudflared URL (you can extract this from the tunnel output)
const currentUrl = 'https://bugs-chronicle-playstation-registered.trycloudflare.com';
updateWebhookUrl(currentUrl);

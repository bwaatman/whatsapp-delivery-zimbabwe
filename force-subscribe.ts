import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function forceSubscribeWhatsAppApp() {
  console.log('🔧 FORCING WHATSAPP APP SUBSCRIPTION\n');

  // Get credentials from environment
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  
  // Business Account ID - extract from webhook payload or set manually
  // From the webhook we saw earlier: "id": "1291275779782158"
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '1291275779782158';

  console.log('📋 Configuration:');
  console.log('  Business Account ID:', businessAccountId);
  console.log('  Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : '❌ MISSING');
  console.log('  API Version: v21.0');

  if (!accessToken) {
    console.error('❌ WHATSAPP_ACCESS_TOKEN not found in environment variables');
    console.log('💡 Make sure WHATSAPP_ACCESS_TOKEN is set in your .env file');
    return;
  }

  const url = `https://graph.facebook.com/v21.0/${businessAccountId}/subscribed_apps`;
  
  const payload = {
    subscribed_fields: 'messages'
  };

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  console.log('\n📤 Making subscription request...');
  console.log('🌐 URL:', url);
  console.log('📦 Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(url, payload, { headers });
    
    console.log('\n✅ SUBSCRIPTION SUCCESSFUL!');
    console.log('📬 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n🎉 Your WhatsApp app is now subscribed to receive messages!');
      console.log('📱 Test by sending a message to your WhatsApp number');
    } else {
      console.log('\n⚠️ Subscription may have issues - check response data');
    }

  } catch (error: any) {
    console.error('\n❌ SUBSCRIPTION FAILED:');
    console.error('Error:', error.message);
    
    if (error.response) {
      console.error('📊 Status Code:', error.response.status);
      console.error('📬 Error Response:', JSON.stringify(error.response.data, null, 2));
      
      // Common error explanations
      switch (error.response.status) {
        case 200:
          console.log('✅ Actually succeeded - Meta returns 200 for success');
          break;
        case 400:
          console.error('💡 Bad Request - Check payload format or business account ID');
          break;
        case 401:
          console.error('💡 Unauthorized - Access token is invalid or expired');
          break;
        case 403:
          console.error('💡 Forbidden - Insufficient permissions for this business account');
          break;
        case 404:
          console.error('💡 Not Found - Business account ID does not exist');
          break;
        case 500:
          console.error('💡 Server Error - Meta API issue, try again later');
          break;
      }
    } else if (error.request) {
      console.error('📡 Network Error - Could not reach Meta API');
    }
    
    console.log('\n🔍 Troubleshooting Steps:');
    console.log('1. Verify WHATSAPP_ACCESS_TOKEN is valid and not expired');
    console.log('2. Check Business Account ID is correct');
    console.log('3. Ensure app has WhatsApp permissions');
    console.log('4. Try getting a new access token from Meta Developers');
  }
}

// Run the function
forceSubscribeWhatsAppApp();

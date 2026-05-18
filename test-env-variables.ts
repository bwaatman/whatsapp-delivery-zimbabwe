// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Test if environment variables are loading properly
console.log('🔍 Testing Environment Variables...\n');

console.log('📋 Environment Variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌');
console.log('WHATSAPP_VERIFY_TOKEN:', process.env.WHATSAPP_VERIFY_TOKEN ? '✅' : '❌');
console.log('WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅' : '❌');
console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅' : '❌');

console.log('\n📱 WhatsApp Credentials:');
console.log('Phone Number ID:', process.env.WHATSAPP_PHONE_NUMBER_ID);
console.log('Access Token (first 20 chars):', process.env.WHATSAPP_ACCESS_TOKEN?.substring(0, 20) + '...');

// Test WhatsAppService
import { WhatsAppService } from './src/WhatsAppService';

const whatsappService = new WhatsAppService();
console.log('\n🔧 WhatsAppService initialized');

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 CHECKING ENVIRONMENT VARIABLES\n');

console.log('📋 All WhatsApp-related environment variables:');
console.log('WHATSAPP_TOKEN:', process.env.WHATSAPP_TOKEN ? `${process.env.WHATSAPP_TOKEN.substring(0, 20)}...` : '❌ MISSING');
console.log('WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? `${process.env.WHATSAPP_ACCESS_TOKEN.substring(0, 20)}...` : '❌ MISSING');
console.log('WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID || '❌ MISSING');
console.log('WHATSAPP_VERIFY_TOKEN:', process.env.WHATSAPP_VERIFY_TOKEN || '❌ MISSING');

console.log('\n📋 Other environment variables:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌ MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌ MISSING');
console.log('NODE_ENV:', process.env.NODE_ENV || '❌ MISSING');
console.log('PORT:', process.env.PORT || '❌ MISSING');

console.log('\n🎯 WHAT TO DO:');
console.log('1. If WHATSAPP_TOKEN is missing → Add it to your .env file');
console.log('2. If WHATSAPP_ACCESS_TOKEN exists → Rename it to WHATSAPP_TOKEN');
console.log('3. Make sure the token is the new one you just generated');
console.log('4. Update Render Dashboard with WHATSAPP_TOKEN');

console.log('\n📝 Example .env file format:');
console.log('WHATSAPP_TOKEN=EAAtLDXi1ZBYQBRSd...');
console.log('WHATSAPP_PHONE_NUMBER_ID=1169872976198533');
console.log('WHATSAPP_VERIFY_TOKEN=test_verify_token');

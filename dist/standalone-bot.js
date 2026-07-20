"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const WhatsAppBotService_1 = require("./WhatsAppBotService");
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./database");
// Load environment variables
dotenv_1.default.config();
console.log('🚀 Starting Standalone WhatsApp Bot Service...');
console.log('📊 Environment check:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌');
console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅' : '❌');
async function startBot() {
    try {
        // Test database connection
        console.log('🔌 Testing database connection...');
        const { data, error } = await database_1.supabase.from('merchants').select('id').limit(1);
        if (error) {
            console.error('❌ Database connection failed:', error);
            process.exit(1);
        }
        console.log('✅ Database connection successful');
        // Initialize WhatsApp Bot
        console.log('🤖 Initializing WhatsApp Bot...');
        const whatsappBot = new WhatsAppBotService_1.WhatsAppBotService();
        await whatsappBot.initialize();
        console.log('✅ WhatsApp Bot initialized successfully');
        console.log('📱 QR Code will be generated shortly...');
        console.log('🌐 Open http://localhost:10000/whatsapp-qr-page to scan the QR code');
        // Keep the process alive
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down WhatsApp Bot...');
            process.exit(0);
        });
        // Keep-alive heartbeat
        setInterval(() => {
            console.log('💓 Bot is running...');
        }, 60000); // Log every minute
    }
    catch (error) {
        console.error('❌ Failed to start WhatsApp Bot:', error);
        process.exit(1);
    }
}
startBot();
//# sourceMappingURL=standalone-bot.js.map
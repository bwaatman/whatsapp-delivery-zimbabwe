"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppBotService = void 0;
const whatsapp_web_js_1 = require("whatsapp-web.js");
const database_1 = require("./database");
const qrcode_1 = __importDefault(require("qrcode"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class WhatsAppBotService {
    constructor() {
        this.sessions = new Map();
        this.qrCodeData = null;
        // Try to find system Chrome installation on Windows
        const possibleChromePaths = [
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Users\\' + require('os').userInfo().username + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe'
        ];
        const fs = require('fs');
        let chromePath = undefined;
        for (const path of possibleChromePaths) {
            if (fs.existsSync(path)) {
                chromePath = path;
                console.log('🔍 Found system Chrome at:', path);
                break;
            }
        }
        this.client = new whatsapp_web_js_1.Client({
            authStrategy: new whatsapp_web_js_1.LocalAuth({
                clientId: 'zimdelivery-bot'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process'
                ],
                executablePath: chromePath // Use system Chrome if found, otherwise let puppeteer find it
            }
        });
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.client.on('qr', async (qr) => {
            console.log('📱 QR Code received. Saving to file...');
            console.log('🌐 Open http://localhost:10000/whatsapp-qr in Chrome to scan the QR code');
            // Save QR code as image
            const qrPath = path_1.default.join(__dirname, '..', 'public', 'whatsapp-qr.png');
            await qrcode_1.default.toFile(qrPath, qr);
            console.log('✅ QR Code saved to:', qrPath);
            // Store QR code data for potential use
            this.qrCodeData = qr;
        });
        this.client.on('ready', () => {
            console.log('✅ WhatsApp Bot is ready!');
            // Delete the QR code file after successful connection
            const qrPath = path_1.default.join(__dirname, '..', 'public', 'whatsapp-qr.png');
            if (fs_1.default.existsSync(qrPath)) {
                fs_1.default.unlinkSync(qrPath);
                console.log('🗑️ QR Code file deleted after successful connection');
            }
        });
        this.client.on('message', async (message) => {
            await this.handleIncomingMessage(message);
        });
        this.client.on('error', (error) => {
            console.error('❌ WhatsApp Bot error:', error);
        });
    }
    async initialize() {
        try {
            console.log('🚀 Initializing WhatsApp Bot...');
            await this.client.initialize();
        }
        catch (error) {
            console.error('❌ Failed to initialize WhatsApp Bot:', error);
            throw error;
        }
    }
    async handleIncomingMessage(message) {
        try {
            const contact = await message.getContact();
            const phone = contact.number;
            const messageBody = message.body.toLowerCase().trim();
            console.log('📨 Incoming message from:', phone);
            console.log('📝 Message:', messageBody);
            console.log('📝 Message starts with #?', messageBody.startsWith('#'));
            // Check if message is a location
            if (message.location) {
                await this.handleLocationMessage(message, phone, message.location);
                return;
            }
            // For testing: only respond to messages starting with #
            // Remove this check when ready for production
            if (!messageBody.startsWith('#')) {
                console.log('⚠️ Message does not start with #, ignoring for testing');
                return;
            }
            console.log('✅ Message starts with #, processing...');
            // Remove the # prefix for processing
            const cleanMessage = messageBody.substring(1).trim();
            // Check if message is tracking an order
            if (cleanMessage.startsWith('track') || cleanMessage.startsWith('status') || cleanMessage.startsWith('order')) {
                await this.handleOrderTracking(message, phone, cleanMessage);
                return;
            }
            // Get or create session
            let session = this.sessions.get(phone);
            if (!session) {
                session = await this.createSession(phone);
            }
            // Update last message time
            session.lastMessageTime = new Date();
            // If user sends #hi or #menu, reset session to greeting state
            if (cleanMessage === 'hi' || cleanMessage === 'hello' || cleanMessage === 'menu') {
                console.log('🔄 Resetting session to greeting state for message:', cleanMessage);
                console.log('🔄 Current session state before reset:', session.state);
                session.state = 'greeting';
                session.selectedCategory = undefined;
                session.selectedVendor = undefined;
                session.selectedProducts = undefined;
                session.orderId = undefined;
                session.locationReceived = false;
                console.log('🔄 Session state after reset:', session.state);
                await this.handleGreetingState(message, phone, cleanMessage, session);
                this.sessions.set(phone, session);
                return;
            }
            console.log('🔄 Processing message in current state:', session.state);
            // Handle message based on session state
            switch (session.state) {
                case 'greeting':
                    await this.handleGreetingState(message, phone, cleanMessage, session);
                    break;
                case 'menu_selection':
                    await this.handleMenuSelectionState(message, phone, cleanMessage, session);
                    break;
                case 'vendor_selection':
                    await this.handleVendorSelectionState(message, phone, cleanMessage, session);
                    break;
                case 'product_selection':
                    await this.handleProductSelectionState(message, phone, cleanMessage, session);
                    break;
                case 'variant_selection':
                    await this.handleVariantSelectionState(message, phone, cleanMessage, session);
                    break;
                case 'name_prompt':
                    await this.handleNamePromptState(message, phone, cleanMessage, session);
                    break;
                case 'location_prompt':
                    await this.handleLocationPromptState(message, phone, cleanMessage, session);
                    break;
                case 'location_received':
                    await this.handleLocationReceivedState(message, phone, cleanMessage, session);
                    break;
                default:
                    await this.sendGreeting(message);
            }
            // Update session
            this.sessions.set(phone, session);
        }
        catch (error) {
            console.error('❌ Error handling incoming message:', error);
            try {
                await message.reply('Sorry, there was an error processing your message. Please try again.');
            }
            catch (replyError) {
                console.error('❌ Error sending error reply:', replyError);
            }
        }
    }
    async createSession(phone) {
        // Check if user has an active order
        const { data: activeOrder } = await database_1.supabase
            .from('orders')
            .select('*')
            .eq('customer_phone', phone)
            .in('status', ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'in_transit'])
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        const session = {
            phone,
            state: activeOrder ? 'tracking' : 'greeting',
            orderId: activeOrder?.id,
            lastMessageTime: new Date()
        };
        this.sessions.set(phone, session);
        return session;
    }
    async handleGreetingState(message, phone, messageBody, session) {
        console.log('👋 handleGreetingState called with messageBody:', messageBody);
        // Send greeting and display menu/categories
        try {
            await this.sendGreeting(message);
            console.log('👋 Greeting sent, now displaying categories...');
            await this.displayCategories(message);
            console.log('👋 Categories displayed');
            session.state = 'menu_selection';
        }
        catch (error) {
            console.error('❌ Error in handleGreetingState:', error);
            // Don't crash the bot if greeting fails
        }
    }
    async sendGreeting(message) {
        try {
            const greeting = `🇿🇼 *Welcome to ZimDelivery!* 🚚

We're here to help you get groceries, food, and more delivered right to your doorstep.

To get started, please select a category from the menu below, or type "track" followed by your order number to check your order status.

Reply "menu" to see available categories.`;
            await message.reply(greeting);
        }
        catch (error) {
            console.error('❌ Error sending greeting:', error);
            throw error; // Re-throw to be caught by outer try-catch
        }
    }
    async displayCategories(message) {
        try {
            // Fetch business categories
            const { data: categories } = await database_1.supabase
                .from('business_categories')
                .select('*')
                .order('name');
            if (!categories || categories.length === 0) {
                await message.reply('Sorry, no categories are available at the moment. Please try again later.');
                return;
            }
            let categoryMenu = `📋 *Available Categories*\n\n`;
            categories.forEach((category, index) => {
                categoryMenu += `${index + 1}. ${category.icon || '📦'} ${category.name}\n`;
            });
            categoryMenu += `\nReply with the number or name of the category you'd like to browse.`;
            await message.reply(categoryMenu);
        }
        catch (error) {
            console.error('❌ Error fetching categories:', error);
            await message.reply('Sorry, there was an error loading categories. Please try again.');
        }
    }
    async handleMenuSelectionState(message, phone, messageBody, session) {
        // If user types "menu", show categories again
        if (messageBody === 'menu') {
            await this.displayCategories(message);
            return;
        }
        // Fetch categories to match user input
        const { data: categories } = await database_1.supabase
            .from('business_categories')
            .select('*')
            .order('name');
        if (!categories) {
            await message.reply('Sorry, no categories are available. Please try again later.');
            return;
        }
        // Try to match by number or name
        let selectedCategory = null;
        const selection = parseInt(messageBody);
        if (!isNaN(selection) && selection > 0 && selection <= categories.length) {
            selectedCategory = categories[selection - 1];
        }
        else {
            selectedCategory = categories.find((cat) => cat.name.toLowerCase().includes(messageBody));
        }
        if (!selectedCategory) {
            await message.reply('Invalid selection. Please reply with a valid category number or name, or type "menu" to see the categories again.');
            return;
        }
        session.selectedCategory = selectedCategory.id;
        session.state = 'vendor_selection';
        await this.displayVendors(message, selectedCategory.id);
    }
    async displayVendors(message, categoryId) {
        try {
            console.log('🔍 Fetching vendors for category:', categoryId);
            // Fetch vendors in the selected category
            const { data: vendors, error } = await database_1.supabase
                .from('merchants')
                .select('*')
                .eq('category_id', categoryId)
                .eq('registration_status', 'approved')
                // .eq('active', true) // Temporarily disabled for testing
                .order('name');
            console.log('📊 Vendors query result:', { vendors, error });
            if (!vendors || vendors.length === 0) {
                await message.reply('Sorry, no vendors are available in this category at the moment. Please try a different category.');
                return;
            }
            let vendorMenu = `🏪 *Available Vendors*\n\n`;
            vendors.forEach((vendor, index) => {
                vendorMenu += `${index + 1}. ${vendor.name}\n`;
            });
            vendorMenu += `\nReply with the number or name of the vendor you'd like to order from.`;
            await message.reply(vendorMenu);
        }
        catch (error) {
            console.error('❌ Error fetching vendors:', error);
            await message.reply('Sorry, there was an error loading vendors. Please try again.');
        }
    }
    async handleVendorSelectionState(message, phone, messageBody, session) {
        if (!session.selectedCategory) {
            session.state = 'greeting';
            await this.sendGreeting(message);
            return;
        }
        // Fetch vendors in the selected category
        const { data: vendors } = await database_1.supabase
            .from('merchants')
            .select('*')
            .eq('category_id', session.selectedCategory)
            .eq('registration_status', 'approved')
            .eq('active', true)
            .order('name');
        if (!vendors) {
            await message.reply('Sorry, no vendors are available. Please try again.');
            return;
        }
        // Try to match by number or name
        let selectedVendor = null;
        const selection = parseInt(messageBody);
        if (!isNaN(selection) && selection > 0 && selection <= vendors.length) {
            selectedVendor = vendors[selection - 1];
        }
        else {
            selectedVendor = vendors.find((vendor) => vendor.name.toLowerCase().includes(messageBody));
        }
        if (!selectedVendor) {
            await message.reply('Invalid selection. Please reply with a valid vendor number or name.');
            return;
        }
        session.selectedVendor = selectedVendor.id;
        session.state = 'product_selection';
        await this.displayProducts(message, selectedVendor.id);
    }
    async displayProducts(message, vendorId) {
        try {
            // Fetch products from the selected vendor with their variants
            const { data: products } = await database_1.supabase
                .from('products')
                .select(`
          *,
          product_variants (*)
        `)
                .eq('merchant_id', vendorId)
                .eq('is_available', true)
                .order('name');
            if (!products || products.length === 0) {
                await message.reply('Sorry, no products are available from this vendor at the moment. Please try a different vendor.');
                return;
            }
            let productMenu = `🛒 *Available Products*\n\n`;
            products.forEach((product, index) => {
                const price = parseFloat(product.price).toFixed(2);
                productMenu += `${index + 1}. ${product.name} - $${price}\n`;
            });
            productMenu += `\nReply with the numbers of the products you want to order (e.g., "1,3,5") or type "done" to finish selection.`;
            await message.reply(productMenu);
        }
        catch (error) {
            console.error('❌ Error fetching products:', error);
            await message.reply('Sorry, there was an error loading products. Please try again.');
        }
    }
    async handleProductSelectionState(message, phone, messageBody, session) {
        console.log('🛍️ handleProductSelectionState called with messageBody:', messageBody);
        console.log('🛍️ Session state:', session.state);
        console.log('🛍️ Selected products:', session.selectedProducts);
        if (!session.selectedVendor) {
            session.state = 'greeting';
            await this.sendGreeting(message);
            return;
        }
        // Check if user wants to cancel
        if (messageBody === 'cancel' || messageBody === 'back') {
            session.state = 'vendor_selection';
            session.selectedProducts = [];
            await this.displayVendors(message, session.selectedCategory);
            return;
        }
        // Parse product selection
        const { data: products } = await database_1.supabase
            .from('products')
            .select('*')
            .eq('merchant_id', session.selectedVendor)
            .eq('is_available', true)
            .order('name');
        if (!products) {
            await message.reply('Sorry, there was an error loading products. Please try again.');
            return;
        }
        // Parse selections (e.g., "1,3,5" or "1 3 5")
        const selections = messageBody.split(/[,\s]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0 && n <= products.length);
        if (selections.length === 0) {
            await message.reply('Invalid selection. Please reply with a valid product number (e.g., "1") or type "cancel" to start over.');
            return;
        }
        // Add selected products to session
        if (!session.selectedProducts) {
            session.selectedProducts = [];
        }
        selections.forEach(index => {
            const product = products[index - 1];
            const existing = session.selectedProducts.find(p => p.id === product.id);
            if (existing) {
                existing.quantity++;
            }
            else {
                session.selectedProducts.push({
                    id: product.id,
                    name: product.name,
                    quantity: 1
                    // variant will be set if product has variants
                });
            }
        });
        // Check if any selected products have variants
        const { data: productsWithVariants } = await database_1.supabase
            .from('products')
            .select(`
        *,
        product_variants (*)
      `)
            .in('id', session.selectedProducts.map(p => p.id));
        const productsNeedingVariants = productsWithVariants?.filter(p => p.product_variants && p.product_variants.length > 0) || [];
        if (productsNeedingVariants.length > 0) {
            // Store products with variants in session for variant selection
            session.productsNeedingVariants = productsNeedingVariants;
            session.state = 'variant_selection';
            this.sessions.set(phone, session);
            await this.promptForVariantSelection(message, productsNeedingVariants);
        }
        else {
            // No variants needed, proceed to name prompt
            session.state = 'name_prompt';
            this.sessions.set(phone, session);
            await message.reply('🎉 *Product Selected!*\n\nPlease enter your name to complete your order.');
        }
    }
    async promptForVariantSelection(message, products) {
        let variantMenu = `🎨 *Select Variants*\n\n`;
        products.forEach((product, pIndex) => {
            variantMenu += `*${product.name}*\n`;
            if (product.product_variants && product.product_variants.length > 0) {
                product.product_variants.forEach((variant, vIndex) => {
                    const adjustedPrice = (parseFloat(product.price) + parseFloat(variant.price_adjustment)).toFixed(2);
                    variantMenu += `  ${vIndex + 1}. ${variant.name} - $${adjustedPrice}\n`;
                });
            }
            variantMenu += '\n';
        });
        variantMenu += `Reply with the variant number for each product (e.g., "1,2" for first product variant 1, second product variant 2) or type "default" to use default options.`;
        await message.reply(variantMenu);
    }
    async handleVariantSelectionState(message, phone, messageBody, session) {
        if (!session.productsNeedingVariants || session.productsNeedingVariants.length === 0) {
            session.state = 'location_prompt';
            this.sessions.set(phone, session);
            await message.reply('🎉 *Product Selected!*\n\nPlease share your location to complete your order.');
            await this.promptForLocation(message);
            return;
        }
        if (messageBody.toLowerCase() === 'default') {
            // Use default (no variant selection)
            session.state = 'location_prompt';
            this.sessions.set(phone, session);
            await message.reply('🎉 *Product Selected!*\n\nPlease share your location to complete your order.');
            await this.promptForLocation(message);
            return;
        }
        // Parse variant selections
        const selections = messageBody.split(/[,\s]+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);
        if (selections.length !== session.productsNeedingVariants.length) {
            await message.reply(`Please select ${session.productsNeedingVariants.length} variant(s), one for each product. Or type "default" to use default options.`);
            return;
        }
        // Apply variant selections to products
        session.productsNeedingVariants.forEach((product, index) => {
            const variantIndex = selections[index] - 1;
            if (variantIndex >= 0 && variantIndex < product.product_variants.length) {
                const selectedProduct = session.selectedProducts.find(p => p.id === product.id);
                if (selectedProduct) {
                    selectedProduct.variant = {
                        name: product.product_variants[variantIndex].name,
                        price_adjustment: product.product_variants[variantIndex].price_adjustment
                    };
                }
            }
        });
        // Proceed to name prompt
        session.state = 'name_prompt';
        this.sessions.set(phone, session);
        await message.reply('🎉 *Product Selected!*\n\nPlease enter your name to complete your order.');
    }
    async handleNamePromptState(message, phone, messageBody, session) {
        const customerName = messageBody.trim();
        if (customerName.length === 0) {
            await message.reply('Please enter your name. Type "cancel" to start over.');
            return;
        }
        if (customerName.toLowerCase() === 'cancel') {
            session.state = 'greeting';
            session.selectedProducts = [];
            session.customerName = undefined;
            this.sessions.set(phone, session);
            await this.sendGreeting(message);
            return;
        }
        session.customerName = customerName;
        session.state = 'location_prompt';
        this.sessions.set(phone, session);
        await message.reply(`Thank you, ${customerName}! Please share your location to complete your order.`);
        await this.promptForLocation(message);
    }
    async createOrder(message, phone, session) {
        try {
            console.log('🛒 Creating order for phone:', phone);
            console.log('🛒 Selected vendor:', session.selectedVendor);
            console.log('🛒 Selected products:', session.selectedProducts);
            if (!session.selectedVendor || !session.selectedProducts || session.selectedProducts.length === 0) {
                console.error('❌ Missing required data for order creation');
                await message.reply('Sorry, there was an error creating your order. Please try again.');
                return;
            }
            // Calculate total
            const { data: products } = await database_1.supabase
                .from('products')
                .select('*')
                .in('id', session.selectedProducts.map(p => p.id));
            console.log('🛒 Fetched products:', products);
            let total = 0;
            const orderItems = session.selectedProducts.map(sp => {
                const product = products?.find(p => p.id === sp.id);
                const basePrice = product ? parseFloat(product.price) : 0;
                const variantPrice = sp.variant ? parseFloat(String(sp.variant.price_adjustment)) : 0;
                const finalPrice = basePrice + variantPrice;
                total += finalPrice * sp.quantity;
                return {
                    product_id: sp.id,
                    product_name: sp.name,
                    quantity: sp.quantity,
                    price: finalPrice,
                    variant: sp.variant || null
                };
            });
            console.log('🛒 Order items:', orderItems);
            console.log('🛒 Total amount:', total);
            // Create order in Supabase
            const { data: order, error } = await database_1.supabase
                .from('orders')
                .insert({
                merchant_id: session.selectedVendor,
                customer_phone: phone,
                customer_name: session.customerName || null,
                status: 'pending',
                order_details: JSON.stringify(orderItems),
                created_at: new Date().toISOString()
            })
                .select()
                .single();
            if (error) {
                console.error('❌ Error creating order:', error);
                await message.reply('Sorry, there was an error creating your order. Please try again.');
                return;
            }
            session.orderId = order.id;
            session.state = 'location_prompt';
            // Send order confirmation
            const confirmation = `✅ *Order Created Successfully!*\n\n` +
                `Order ID: ${order.id.substring(0, 8)}...\n` +
                `Total: $${total.toFixed(2)}\n` +
                `Items: ${session.selectedProducts.length}\n\n` +
                `📍 *Next Step:* Please share your location pin so our driver can find you.`;
            await message.reply(confirmation);
            // Prompt for location
            await this.promptForLocation(message);
        }
        catch (error) {
            console.error('❌ Error creating order:', error);
            await message.reply('Sorry, there was an error creating your order. Please try again.');
        }
    }
    async promptForLocation(message) {
        const locationPrompt = `📍 *Share Your Location*\n\n` +
            `To complete your order, please share your location by:\n` +
            `1. Click the 📎 attachment icon\n` +
            `2. Select "Location"\n` +
            `3. Choose "Share live location" or "Send your current location"\n\n` +
            `This helps our drivers find you easily!`;
        await message.reply(locationPrompt);
    }
    async handleLocationMessage(message, phone, location) {
        try {
            console.log('📍 handleLocationMessage called for phone:', phone);
            const session = this.sessions.get(phone);
            console.log('📍 Session:', session);
            console.log('📍 Session orderId:', session?.orderId);
            if (!session || !session.selectedVendor || !session.selectedProducts || session.selectedProducts.length === 0) {
                await message.reply('No active order found. Please start a new order by typing "menu".');
                return;
            }
            // Create the order with location
            console.log('📍 Creating order with location...');
            const { data: products } = await database_1.supabase
                .from('products')
                .select('*')
                .in('id', session.selectedProducts.map(p => p.id));
            let foodTotal = 0;
            const orderItems = session.selectedProducts.map(sp => {
                const product = products?.find(p => p.id === sp.id);
                const price = product ? parseFloat(product.price) : 0;
                foodTotal += price * sp.quantity;
                return {
                    product_id: sp.id,
                    product_name: sp.name,
                    quantity: sp.quantity,
                    price: price
                };
            });
            // Get vendor location for delivery fee calculation
            const { data: vendor } = await database_1.supabase
                .from('merchants')
                .select('shop_location')
                .eq('id', session.selectedVendor)
                .single();
            // Calculate delivery fee
            const { OrderEconomicsService } = await Promise.resolve().then(() => __importStar(require('./OrderEconomicsService')));
            const orderEconomicsService = new OrderEconomicsService();
            const deliveryFee = await orderEconomicsService.calculateDeliveryFee(vendor?.shop_location, { type: 'Point', coordinates: [location.longitude, location.latitude] });
            // Calculate service fee
            const config = await orderEconomicsService.getPlatformConfig();
            const serviceFee = config.service_fee;
            const total = foodTotal + deliveryFee + serviceFee;
            const { data: order, error } = await database_1.supabase
                .from('orders')
                .insert({
                merchant_id: session.selectedVendor,
                customer_phone: phone,
                status: 'pending',
                order_details: JSON.stringify(orderItems),
                delivery_location: {
                    type: 'Point',
                    coordinates: [location.longitude, location.latitude]
                },
                food_amount: foodTotal,
                delivery_fee: deliveryFee,
                service_fee: serviceFee,
                created_at: new Date().toISOString()
            })
                .select()
                .single();
            if (error) {
                console.error('❌ Error creating order:', error);
                await message.reply('Sorry, there was an error creating your order. Please try again.');
                return;
            }
            console.log('✅ Order created successfully:', order);
            // Update session with order ID and state
            session.orderId = order.id;
            session.state = 'location_received';
            session.locationReceived = true;
            this.sessions.set(phone, session);
            console.log('📍 Session state updated to location_received');
            console.log('📍 Session after update:', this.sessions.get(phone));
            // Send confirmation with order summary and payment method selection
            const confirmation = `🎉 *Location Received!*\n\n` +
                `Your location has been saved.\n\n` +
                `📋 *Order Summary*\n` +
                `Food Total: $${foodTotal.toFixed(2)}\n` +
                `Delivery Fee: $${deliveryFee.toFixed(2)}\n` +
                `Service Fee: $${serviceFee.toFixed(2)}\n` +
                `*Total: $${total.toFixed(2)}*\n\n` +
                `💳 *Select Payment Method*\n` +
                `Reply "cash" to pay cash on delivery\n` +
                `Reply "card" to pay online\n` +
                `Reply "ecocash" to pay via Ecocash\n\n` +
                `Then press #done to confirm your order.`;
            await message.reply(confirmation);
        }
        catch (error) {
            console.error('❌ Error handling location message:', error);
            await message.reply('Sorry, there was an error processing your location. Please try again.');
        }
    }
    async handleLocationPromptState(message, phone, messageBody, session) {
        // If user sends text instead of location, remind them to share location
        await this.promptForLocation(message);
    }
    async handleLocationReceivedState(message, phone, messageBody, session) {
        console.log('📍 handleLocationReceivedState called with messageBody:', messageBody);
        console.log('📍 Session orderId:', session.orderId);
        if (!session.orderId) {
            await message.reply('No active order found. Please start a new order by typing "menu".');
            return;
        }
        // Handle payment method selection
        if (messageBody === 'cash' || messageBody === 'card' || messageBody === 'ecocash') {
            session.paymentMethod = messageBody;
            this.sessions.set(phone, session);
            let method;
            if (messageBody === 'cash') {
                method = 'Cash on Delivery';
            }
            else if (messageBody === 'card') {
                method = 'Online Card Payment';
            }
            else {
                method = 'Ecocash';
            }
            await message.reply(`✅ Payment method set to: ${method}\n\nPress #done to confirm your order.`);
            return;
        }
        // Check if user sent #done
        if (messageBody === 'done') {
            console.log('📍 User typed done, fetching order details...');
            if (!session.paymentMethod) {
                await message.reply('Please select a payment method first (cash, card, or ecocash).');
                return;
            }
            // Update order with payment method
            const { error: updateError } = await database_1.supabase
                .from('orders')
                .update({
                payment_method: session.paymentMethod,
                payment_status: (session.paymentMethod === 'cash' || session.paymentMethod === 'ecocash') ? 'pending' : 'pending'
            })
                .eq('id', session.orderId);
            if (updateError) {
                console.error('❌ Error updating order payment method:', updateError);
                await message.reply('Error updating payment method. Please try again.');
                return;
            }
            // Fetch order details with merchant information
            const { data: order, error } = await database_1.supabase
                .from('orders')
                .select(`
          *,
          merchants (
            name,
            contact_phone
          )
        `)
                .eq('id', session.orderId)
                .single();
            console.log('📍 Order query result:', { order, error });
            if (!order) {
                console.error('❌ Order not found for ID:', session.orderId);
                await message.reply('Order not found. Please try again.');
                return;
            }
            // Calculate estimated delivery time (default to 30 minutes)
            const deliveryTime = 30;
            const estimatedArrival = new Date();
            estimatedArrival.setMinutes(estimatedArrival.getMinutes() + deliveryTime);
            // Clear session
            this.sessions.delete(phone);
            // Send order confirmation with tracking info and vendor contact
            let paymentInfo;
            if (session.paymentMethod === 'cash') {
                paymentInfo = '\n💵 *Payment: Cash on Delivery*\nPlease have exact change ready for the driver.';
            }
            else if (session.paymentMethod === 'ecocash') {
                paymentInfo = '\n📱 *Payment: Ecocash*\nPlease pay via Ecocash to the driver.';
            }
            else {
                paymentInfo = '\n💳 *Payment: Online*\nPayment will be processed online.';
            }
            const confirmation = `🎉 *Order Confirmed!*\n\n` +
                `Order ID: ${session.orderId.substring(0, 8)}\n` +
                `Total: $${(order.food_amount + order.delivery_fee + order.service_fee).toFixed(2)}\n` +
                `Estimated Delivery: ${deliveryTime} minutes\n` +
                `Expected Arrival: ${estimatedArrival.toLocaleTimeString()}\n\n` +
                `📞 *Vendor Contact:* ${order.merchants?.name || 'Vendor'}\n` +
                `Phone: ${order.merchants?.contact_phone || 'N/A'}\n` +
                paymentInfo +
                `\n\nType "track ${session.orderId.substring(0, 8)}" to check your order status anytime.`;
            await message.reply(confirmation);
        }
        else {
            await message.reply('Please select a payment method (cash, card, or ecocash) or press #done to confirm your order.');
        }
    }
    async handleOrderTracking(message, phone, messageBody) {
        try {
            console.log('🔍 Tracking order for phone:', phone);
            console.log('🔍 Message:', messageBody);
            // Extract order ID from message - look for 8 hex characters after "track" or "#track"
            // This ensures we get the ID that the user explicitly provided
            // Handle both "track 12345678" and "track12345678" formats
            const orderIdMatch = messageBody.match(/(?:track|#track)\s*([\da-f]{8})/i);
            const orderId = orderIdMatch ? orderIdMatch[1] : null;
            console.log('🔍 Extracted order ID:', orderId);
            console.log('🔍 Original message:', messageBody);
            console.log('🔍 Regex match result:', orderIdMatch);
            // Search for order - if no ID provided, get most recent order for this phone
            let query = database_1.supabase
                .from('orders')
                .select('*')
                .eq('customer_phone', phone)
                .order('created_at', { ascending: false })
                .limit(10);
            const { data: orders, error } = await query;
            console.log('🔍 Order query result:', { orders, error, count: orders?.length || 0 });
            if (!orders || orders.length === 0) {
                await message.reply('No orders found. Please create an order first or check your order ID.');
                return;
            }
            // If order ID was provided, find the best match
            let order;
            if (orderId) {
                // Require exact match on first 8 characters
                order = orders.find(o => o.id.substring(0, 8).toLowerCase() === orderId.toLowerCase());
                console.log('🔍 Looking for order with first 8 chars:', orderId.toLowerCase());
                console.log('🔍 Available orders (first 8 chars):', orders.map(o => o.id.substring(0, 8).toLowerCase()));
                if (!order) {
                    await message.reply(`Order not found with ID: ${orderId}. Please check your order ID and try again.`);
                    return;
                }
            }
            else {
                // Only use most recent order if no ID was provided
                await message.reply('Please provide an order ID. Usage: #track 12345678 or track 12345678');
                return;
            }
            console.log('🔍 Selected order:', order?.id);
            if (!order) {
                await message.reply('Order not found. Please check your order ID and try again.');
                return;
            }
            // Format status
            const statusMessages = {
                'pending': '⏳ Pending - Waiting for confirmation',
                'confirmed': '✅ Confirmed - Driver will be assigned soon',
                'accepted': '✅ Accepted - Vendor has accepted your order',
                'preparing': '👨‍🍳 Preparing - Vendor is preparing your order',
                'waiting_for_driver': '📦 Waiting for Driver - Order is ready, waiting for driver assignment',
                'ready_for_pickup': '📦 Ready - Order is ready for pickup',
                'picked_up': '🚗 Picked Up - Driver has your order',
                'out_for_delivery': '🚚 Out for Delivery - Driver is on the way',
                'in_transit': '🚚 In Transit - Driver is on the way',
                'delivered': '🎉 Delivered - Order has been delivered',
                'cancelled': '❌ Cancelled'
            };
            const statusMessage = statusMessages[order.status] || order.status;
            const trackingInfo = `📋 *Order Status*\n\n` +
                `Order ID: ${order.id.substring(0, 8)}...\n` +
                `Status: ${statusMessage}\n` +
                `Total: $${((order.food_amount || 0) + (order.delivery_fee || 0) + (order.service_fee || 0)).toFixed(2)}\n` +
                `Created: ${new Date(order.created_at).toLocaleString()}\n\n` +
                `Type "track ${order.id.substring(0, 8)}" again to check for updates.`;
            await message.reply(trackingInfo);
        }
        catch (error) {
            console.error('❌ Error tracking order:', error);
            await message.reply('Sorry, there was an error tracking your order. Please try again.');
        }
    }
    getSessions() {
        return this.sessions;
    }
    getSession(phone) {
        return this.sessions.get(phone);
    }
    // Method to send order status notifications to customers
    async sendOrderStatusNotification(customerPhone, orderId, status) {
        try {
            console.log('📱 Sending status notification to:', customerPhone, 'for order:', orderId, 'status:', status);
            // Check if client is ready
            if (!this.client || !this.client.info) {
                console.warn('⚠️ WhatsApp client not ready, cannot send status notification');
                return;
            }
            // Format status message
            const statusMessages = {
                'pending': '⏳ Pending - Waiting for confirmation',
                'confirmed': '✅ Confirmed - Driver will be assigned soon',
                'accepted': '✅ Accepted - Vendor has accepted your order',
                'preparing': '👨‍🍳 Preparing - Vendor is preparing your order',
                'waiting_for_driver': '📦 Waiting for Driver - Order is ready, waiting for driver assignment',
                'ready_for_pickup': '📦 Ready - Order is ready for pickup',
                'picked_up': '🚗 Picked Up - Driver has your order',
                'out_for_delivery': '🚚 Out for Delivery - Driver is on the way',
                'in_transit': '🚚 In Transit - Driver is on the way',
                'delivered': '🎉 Delivered - Order has been delivered',
                'cancelled': '❌ Cancelled'
            };
            const statusMessage = statusMessages[status] || status;
            const notification = `📋 *Order Status Update*\n\n` +
                `Order ID: ${orderId.substring(0, 8)}...\n` +
                `New Status: ${statusMessage}\n\n` +
                `Type "track ${orderId.substring(0, 8)}" to check your order status anytime.`;
            // Format phone number for WhatsApp (remove + if present, add @c.us suffix)
            const formattedPhone = customerPhone.replace('+', '') + '@c.us';
            // Send the message
            await this.client.sendMessage(formattedPhone, notification);
            console.log('✅ Status notification sent successfully to:', customerPhone);
        }
        catch (error) {
            console.error('❌ Error sending status notification to customer:', error);
        }
    }
    // Method to send message to a customer (used for order status notifications)
    async sendMessageToCustomer(phone, message) {
        try {
            console.log('📱 Sending message to customer:', phone);
            // Check if client is ready
            if (!this.client || !this.client.info) {
                console.warn('⚠️ WhatsApp client not ready, cannot send message');
                return;
            }
            // Format phone number for WhatsApp (remove + if present, add @c.us suffix)
            const formattedPhone = phone.replace('+', '') + '@c.us';
            // Send the message
            await this.client.sendMessage(formattedPhone, message);
            console.log('✅ Message sent successfully to:', phone);
        }
        catch (error) {
            console.error('❌ Error sending message to customer:', error);
        }
    }
    getQRCodeData() {
        return this.qrCodeData;
    }
}
exports.WhatsAppBotService = WhatsAppBotService;
//# sourceMappingURL=WhatsAppBotService.js.map
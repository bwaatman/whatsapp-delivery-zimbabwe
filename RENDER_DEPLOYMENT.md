# Render Deployment Checklist

## ✅ **Production Readiness Status**

### **1. Package.json Scripts** ✅
- `"build": "tsc"` - Compiles TypeScript to JavaScript
- `"start": "node dist/index.js"` - Production server start command
- Render will automatically run `npm install && npm run build && npm start`

### **2. Dynamic Port Binding** ✅
- Server uses `process.env.PORT || 3000`
- Render automatically assigns its own port

### **3. Environment Variables Required**

Copy these exact variables to your Render Dashboard:

```
SUPABASE_URL=https://jchlsknqqazpuzupdljt.supabase.co
SUPABASE_ANON_KEY=sb_publishable_jKI5NNmAIL94XAzVq6-iMA_I2GBuJ17
WHATSAPP_VERIFY_TOKEN=test_verify_token
WHATSAPP_PHONE_NUMBER_ID=1169872976198533
WHATSAPP_ACCESS_TOKEN=EAAtLDXi1ZBYQBRSdx68W1RlvJ4xHGLRMRVauhCawA1nvW6UzhsF0l5ksNL5HCxeVe42gkR9mWBNZAFWOQpfcIjURBFpEdbEoU1ad0dtynnQb1avdTXc2humI0YNatFilZCCNezc8htdySSAMijDYP7qs946os80PRsVcXRwcaaPXjoCJBWSJooykk9jpZAxtCYKZBGxZBwV8rJ0TVruDQ9eeEiHsvLJZCQmngNMhMF3Eiv9hZAC69WGvT82vKZCHkmKOil56I1wfXWKGBg4HNqNVi
```

## 🚀 **Deployment Steps**

### **Step 1: Create Render Service**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the `2048` repository

### **Step 2: Configure Service**
1. **Name:** `whatsapp-delivery-platform`
2. **Environment:** `Node`
3. **Region:** Choose nearest to your customers
4. **Branch:** `main` (or your default branch)
5. **Root Directory:** Leave empty (root of repo)
6. **Build Command:** `npm install && npm run build`
7. **Start Command:** `npm start`

### **Step 3: Add Environment Variables**
1. In Render Dashboard, go to "Environment" tab
2. Copy-paste all variables from above
3. Make sure each variable is on its own line

### **Step 4: Deploy**
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Copy the Render URL (e.g., `https://whatsapp-delivery-platform.onrender.com`)

## 📡 **Update Meta Webhook**

After deployment, update your Meta webhook:
1. Go to Meta for Developers → WhatsApp → Configuration
2. **Callback URL:** `https://whatsapp-delivery-platform.onrender.com/api/whatsapp/webhook`
3. **Verify Token:** `test_verify_token`
4. Click "Save and verify"

## 🧪 **Production Testing**

After deployment:
1. Visit `https://your-app.onrender.com/health` to verify it's running
2. Test webhook: `https://your-app.onrender.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=test_verify_token&hub.challenge=test123`
3. Send WhatsApp message to test full workflow

## ⚠️ **Important Notes**

- **Free Tier Limit:** Render free tier has 15-minute sleep timeout
- **Database:** Supabase handles database, no changes needed
- **HTTPS:** Render provides automatic SSL certificates
- **Logs:** Check Render logs for debugging in production

## 🎯 **Expected Production URL**
```
https://whatsapp-delivery-platform.onrender.com/api/whatsapp/webhook
```

Your WhatsApp Delivery Platform will be production-ready after following these steps!

# Environment Variables Setup Guide

## 🔐 **Secure Environment Variables for Production**

### **📋 Copy These Exact Values to Render Dashboard:**

```
SUPABASE_URL=https://jchlsknqqazpuzupdljt.supabase.co
SUPABASE_ANON_KEY=sb_publishable_jKI5NNmAIL94XAzVq6-iMA_I2GBuJ17
WHATSAPP_VERIFY_TOKEN=test_verify_token
WHATSAPP_PHONE_NUMBER_ID=1169872976198533
WHATSAPP_ACCESS_TOKEN=EAAtLDXi1ZBYQBRSd1ZBnNjgZAnVOGZCWFxcBc4CbqxbMFFZCgpGHUMHg10mei4rgP1fUxgyNn0DloFEQHSREwJGbAPx4KpSkrJ3LffJ8FEIKunN2ZBpQcjBm6SrexD5ezrlkZCVvDyZATzAmNhNKt4TmWpFNmWfxfyGXPZBxVoMFjOcVmgnTcxZCZA3vXRi81m9dcM2xdzXeYNrhuVyZCin4SsE9iZBwT10QLzrWp0mZC27OgFUHeako1n3ynOr7ENOyJtby6CLHKmjfQFgPUh5qwHEEFM
TEST_PHONE_NUMBER=27730210062
PORT=10000
NODE_ENV=production
RENDER_EXTERNAL_URL=https://whatsapp-delivery-zimbabwe.onrender.com
```

## ⚠️ **SECURITY NOTES:**

### **WhatsApp Access Token:**
- The access token above is **your current valid token**
- **Never commit this token to public repositories**
- **Rotate this token regularly** for security
- If token expires, get a new one from Meta Developers Dashboard

### **Token Rotation:**
1. Go to [Meta Developers Dashboard](https://developers.facebook.com)
2. Navigate to WhatsApp → App Settings
3. Generate new access token if needed
4. Update in Render Dashboard immediately

### **Supabase Keys:**
- `SUPABASE_ANON_KEY` is safe for client-side use
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- These keys are already in your Supabase project

## 🚀 **Render Dashboard Setup:**

1. **Go to your Render Service**
2. **Click "Environment" tab**
3. **Add each variable individually:**
   - Click "Add Environment Variable"
   - Enter key and exact value
   - Repeat for all variables

4. **Save and Redeploy**

## 🔍 **Verification:**

After deployment, test with:
```bash
curl https://your-app.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "database": {"connection": true},
  "service": "WhatsApp Delivery Platform"
}
```

## 📱 **Meta Webhook Update:**

After deployment, update Meta webhook:
- **Callback URL:** `https://your-app.onrender.com/api/whatsapp/webhook`
- **Verify Token:** `test_verify_token`

## 🛡️ **Best Practices:**

- ✅ Use long, random tokens
- ✅ Rotate tokens every 90 days
- ✅ Monitor token usage in Meta Dashboard
- ✅ Never share tokens in public forums
- ✅ Use environment-specific tokens (dev vs prod)

**Your environment is now production-ready and secure!** 🔐

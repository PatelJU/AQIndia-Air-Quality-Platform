# 🔧 GEMINI API SETUP FOR INDIA - FREE TIER

## ⚠️ IMPORTANT: Why You See "Free Tier Not Available in Your Country"

Google changed their policy in late 2024. Even though the **FREE tier is available in India**, you MUST enable billing first. This is just a verification step - **you will NOT be charged** unless you exceed free limits.

---

## ✅ STEP-BY-STEP SOLUTION

### **Step 1: Go to Google AI Studio**
1. Visit: https://aistudio.google.com/
2. Sign in with your Google account
3. Click on **"Get API Key"** (top right)

### **Step 2: Create or Select a Project**
1. Click **"Create API key"**
2. If prompted, create a new Google Cloud project
3. Name it something like: `AQIndia-Project`

### **Step 3: Enable Billing (REQUIRED)**
1. Go to: https://console.cloud.google.com/billing
2. Click **"Manage billing accounts"**
3. Click **"Create billing account"**
4. Enter your details:
   - **Name**: Your name
   - **Address**: Your Indian address
   - **Payment method**: Credit/Debit card (any card works)
   
   ⚠️ **DON'T WORRY**: 
   - This is ONLY for verification
   - You will NOT be charged for free tier usage
   - Free tier: 15 requests/minute, 1M tokens/day
   - You can set budget alerts to $0

### **Step 4: Set Budget Alert (Safety)**
1. Go to: https://console.cloud.google.com/billing/budgets
2. Click **"Create Budget"**
3. Set budget to: **$1.00** (or $0.01)
4. Set alert at: **50%** ($0.50)
5. This ensures you get notified if somehow charges occur

### **Step 5: Generate API Key**
1. Go back to: https://aistudio.google.com/
2. Click **"Get API Key"**
3. Select your project
4. Click **"Create API key in existing project"**
5. Copy the API key (starts with `AIzaSy...`)

### **Step 6: Add Key to Your Project**
1. Open your `.env` file in the project
2. Add or update:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```
3. Restart your server

---

## 🎯 FREE TIER LIMITS (India)

| Feature | Limit |
|---------|-------|
| **Requests per minute** | 15 RPM |
| **Requests per day** | 1,500 RPD |
| **Tokens per day** | 1,000,000 |
| **Cost** | **FREE** (within limits) |
| **Models available** | gemini-2.0-flash ✅ |

---

## 🔍 TROUBLESHOOTING

### **Error: "Free tier not available in your country"**
**Solution**: You MUST enable billing first (see Step 3 above)
- This is a Google requirement for all countries now
- Even free tier requires billing account verification

### **Error: "API key not valid"**
**Solution**: 
1. Check if API key is correct (starts with `AIzaSy`)
2. Make sure Generative Language API is enabled
3. Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
4. Click **"Enable"**

### **Error: "Billing not enabled"**
**Solution**:
1. Go to Google Cloud Console
2. Link a billing account to your project
3. Wait 5-10 minutes for changes to propagate

### **Want to avoid charges completely?**
1. Set budget alert to $0.01
2. Set quota limits in Google Cloud Console:
   - Go to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
   - Set "Requests per minute" to 15
   - Set "Requests per day" to 1500

---

## 💡 IMPORTANT NOTES FOR INDIA

✅ **FREE tier IS available in India** (despite the error message)
✅ **NO charges** if you stay within free limits
✅ **Any Indian debit/credit card works** (Visa, Mastercard, RuPay)
✅ **Google will NOT charge** without your consent
✅ **You can delete billing account** anytime (but API will stop working)

---

## 🚀 ALTERNATIVE: Disable Gemini Validation

If you absolutely cannot enable billing, you can disable Gemini validation:

1. Open `server/routers.ts`
2. Find the `validateWithGemini` function call
3. Comment it out or set to skip validation

**However**, this means:
- ❌ No AI-powered AQI validation
- ❌ No multi-model consensus
- ❌ Less accurate data quality checks

---

## 📞 SUPPORT

If you still face issues:
1. Google AI Studio Help: https://support.google.com/aistudio
2. Google Cloud Billing: https://cloud.google.com/billing/docs
3. Forum: https://discuss.ai.google.dev/

---

## ✅ VERIFICATION CHECKLIST

After setup, verify:
- [ ] API key starts with `AIzaSy`
- [ ] Billing account is active (even with $0 balance)
- [ ] Budget alert is set (safety measure)
- [ ] Server console shows: `[Gemini-2.0-Flash] Validating...`
- [ ] No billing errors in console
- [ ] API responds within 200-500ms

---

**Last Updated**: April 2026
**Status**: ✅ Verified working in India

# SendGrid Setup Guide for Render

## 🚀 Quick Setup Steps

### 1. Create SendGrid Account
1. Go to [SendGrid.com](https://sendgrid.com/)
2. Sign up for a **FREE account** (100 emails/day forever)
3. Verify your email address

### 2. Create API Key
1. Log in to SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: `Render Production`
5. Select **Full Access** (or at minimum: Mail Send permissions)
6. Click **Create & View**
7. **COPY THE API KEY** (you won't see it again!)

### 3. Verify Sender Identity

#### Option A: Single Sender Verification (Easiest - Free Tier)
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email: `samysingla146@gmail.com`
4. Fill in the form with your details
5. Check your Gmail inbox for verification email
6. Click the verification link

#### Option B: Domain Authentication (Better for production)
1. Go to **Settings** → **Sender Authentication**
2. Click **Authenticate Your Domain**
3. Follow DNS setup instructions

### 4. Configure Render Environment Variables

Go to your Render dashboard → Your Backend Service → Environment

Add these environment variables:

```bash
# Required SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=samysingla146@gmail.com
EMAIL_FROM_NAME=Felicity Events

# Other existing variables
FRONTEND_URL=https://felicity-management-system.vercel.app
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=felicity_secret_2026
JWT_EXPIRE=7d
PORT=10000
NODE_ENV=production
```

### 5. Deploy to Render

After setting environment variables:
1. Trigger a new deployment on Render (or it will auto-deploy from GitHub)
2. Check the logs to see: `✅ SendGrid initialized successfully`

## 🧪 Testing Email Functionality

After deployment, test by:
1. Register for a FREE event (should send email immediately)
2. Register for a PAID event and approve payment (sends email on approval)
3. Check SendGrid dashboard → Activity to see email delivery status

## 📊 SendGrid Free Tier Limits

- **100 emails/day** - Forever free!
- Perfect for testing and small-scale events
- Upgrade anytime for more volume

## ⚠️ Important Notes

1. **Sender Email**: Must be verified in SendGrid (use Single Sender Verification)
2. **API Key**: Keep it secret! Never commit to Git
3. **Email Quota**: Monitor your daily usage in SendGrid dashboard

## 🔍 Troubleshooting

### "Sender not verified" error
- Go to SendGrid → Sender Authentication
- Verify the email address you're using

### "API key not found"
- Check you copied the full API key from SendGrid
- Verify the environment variable name is exactly `SENDGRID_API_KEY`

### Emails not arriving
- Check SendGrid Activity feed for delivery status
- Check spam/junk folder
- Verify the recipient email is correct

## 📚 SendGrid Resources

- [SendGrid Dashboard](https://app.sendgrid.com/)
- [API Keys](https://app.sendgrid.com/settings/api_keys)
- [Sender Authentication](https://app.sendgrid.com/settings/sender_auth)
- [Activity Feed](https://app.sendgrid.com/email_activity)
- [Documentation](https://docs.sendgrid.com/)

---

## Migration Complete! ✅

You've successfully switched from Gmail SMTP to SendGrid. This is:
- ✅ More reliable on Render
- ✅ No SMTP connection issues
- ✅ Better email deliverability
- ✅ Real-time tracking and analytics

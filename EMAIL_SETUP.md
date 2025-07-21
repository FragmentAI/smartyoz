# Email Service Setup Guide

This document explains how to set up free email services for real email delivery in the Smartyoz hiring platform.

## Current Status
- Email simulation is active (emails logged to console)
- Real email delivery requires one of the services below

## Free Email Service Options

### Option 1: Mailtrap (Recommended)
**Best for**: Transactional emails, reliable delivery
**Free tier**: 1,000 emails/month

1. Sign up at https://mailtrap.io
2. Go to Email API → SMTP/API → SMTP Settings
3. Copy the username and password
4. Set secrets:
   - MAILTRAP_USER: [your username]
   - MAILTRAP_PASSWORD: [your password]

### Option 2: Brevo (formerly Sendinblue)
**Free tier**: 300 emails/day

1. Sign up at https://brevo.com
2. Go to Account dropdown → SMTP & API → SMTP tab
3. Find your SMTP login email (looks like: your-login@smtp-brevo.com)
4. Create or copy your SMTP key (NOT the API key)
5. Set secrets:
   - BREVO_SMTP_USER: [your SMTP login email]
   - BREVO_SMTP_KEY: [your SMTP key]
6. Go to Senders, Domains & Dedicated IPs → Senders
7. Create a verified sender (your actual email like mohamedaboobakarsithik@gmail.com)
8. Verify the sender with the 6-digit code sent to your email

## Automated Email Response Handling

### Webhook Setup (Optional for Full Automation)

To automatically process candidate email responses:

1. **Brevo Webhook Configuration:**
   - Go to Brevo → Transactional → Settings → Webhooks
   - Add webhook URL: `https://your-domain.replit.app/webhook/brevo`
   - Select "Inbound email" events

2. **Manual Processing:**
   - The system can detect screening responses when candidates reply
   - Qualified candidates automatically receive interview scheduling links
   - Non-qualified candidates receive polite rejection emails

### How It Works:

1. **Candidate receives screening email** → Replies with answers
2. **System processes response** → Evaluates qualification criteria  
3. **Automatic action**:
   - ✅ **Qualified**: Sends interview scheduling link
   - ❌ **Not qualified**: Sends rejection email

### Features:
- **Smart parsing** of email responses
- **Qualification scoring** based on answers
- **Automatic interview link generation** 
- **Candidate-facing scheduling interface**
- **Email confirmations** for scheduled interviews

### Option 3: Mailjet
**Free tier**: 200 emails/day

1. Sign up at https://mailjet.com
2. Go to Account Settings → API Keys
3. Copy API Key and Secret Key
4. Set secrets:
   - MAILJET_API_KEY: [your API key]
   - MAILJET_SECRET_KEY: [your secret key]

## How It Works

The system tries services in this order:
1. Mailtrap (if configured)
2. Brevo (if configured)
3. Mailjet (if configured)
4. SendGrid (if configured)
5. Gmail (if configured)
6. Test service (fallback)

Once any service is configured, emails will be delivered to real inboxes immediately.

## Testing

After setting up any service:
1. Go to Candidates page
2. Click "Send Email" for any candidate
3. Check the console logs for delivery confirmation
4. Candidate will receive the email in their inbox

## Troubleshooting

- Check console logs for specific error messages
- Verify credentials are correct
- Ensure sender email domain is verified (for some services)
- Free tiers have daily/monthly limits
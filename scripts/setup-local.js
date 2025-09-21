#!/usr/bin/env node

/**
 * Smartyoz Local Development Setup Script
 * This script helps set up the environment for local development
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_TEMPLATE = `# Smartyoz Environment Configuration
# Copy this file to .env and fill in your values

# ===== DATABASE (REQUIRED) =====
# PostgreSQL connection string
# Examples:
# Local: postgresql://username:password@localhost:5432/smartyoz
# Neon: postgresql://user:password@host.neon.tech/dbname?sslmode=require
# Supabase: postgresql://postgres:password@host.pooler.supabase.com:6543/postgres
DATABASE_URL=postgresql://postgres:password@localhost:5432/smartyoz

# ===== AUTHENTICATION (REQUIRED) =====
# Session secret for cookie encryption (generate a random string)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# ===== AI FEATURES (OPTIONAL) =====
# OpenAI API key for AI features (job generation, resume matching, etc.)
# Get from: https://platform.openai.com/api-keys
# Without this, AI features will show placeholder content
OPENAI_API_KEY=sk-your-openai-api-key-here

# ===== EMAIL SERVICES (OPTIONAL) =====
# SendGrid for professional email delivery
# Get from: https://sendgrid.com (free tier: 100 emails/day)
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here

# Gmail for alternative email delivery
# Generate app password: Google Account → Security → 2-Step Verification → App passwords
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-digit-app-password

# ===== DEVELOPMENT SETTINGS =====
# Environment mode
NODE_ENV=development

# Local domain for testing (used for email links)
REPLIT_DOMAINS=localhost:5000
REPL_ID=local-dev

# ===== THIRD-PARTY INTEGRATIONS (OPTIONAL) =====
# These are for advanced features and can be left empty for basic functionality

# Twilio for SMS notifications (optional)
# TWILIO_ACCOUNT_SID=your-twilio-account-sid
# TWILIO_AUTH_TOKEN=your-twilio-auth-token
# TWILIO_PHONE_NUMBER=your-twilio-phone-number

# LinkedIn integration for job posting (optional)
# LINKEDIN_CLIENT_ID=your-linkedin-client-id
# LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# Indeed integration for job posting (optional)
# INDEED_PUBLISHER_ID=your-indeed-publisher-id
`;

const SETUP_GUIDE = `
🚀 Smartyoz Local Development Setup Complete!

Next Steps:
1. Configure your environment variables in .env file
2. Set up your database
3. Initialize the database schema
4. Start the development server

=== QUICK START ===

1. DATABASE SETUP:
   • Install PostgreSQL locally OR
   • Create a free database at https://neon.tech/ or https://supabase.com/

2. ENVIRONMENT VARIABLES:
   • Copy .env.example to .env
   • Fill in your DATABASE_URL
   • Add other services as needed

3. INITIALIZE DATABASE:
   npm run db:push

4. START DEVELOPMENT:
   npm run dev

=== FEATURES AVAILABLE ===

✅ Core Features (work without API keys):
   • Job management
   • Candidate management  
   • Interview scheduling
   • Basic analytics
   • File uploads

🤖 AI Features (require OPENAI_API_KEY):
   • Automated job description generation
   • Resume evaluation and scoring
   • Interview question generation
   • SmartAssist natural language interface

📧 Email Features (require email service):
   • Automated candidate notifications
   • Interview scheduling emails
   • Status update communications

=== AUTHENTICATION ===

✅ Local Development Mode Active:
   • Auto-login as admin@smartyoz.local
   • No authentication required
   • Full access to all features

⚠️  For production deployment:
   • Implement proper authentication
   • Set NODE_ENV=production
   • Use secure session secrets

=== TROUBLESHOOTING ===

❌ Database connection issues:
   • Verify DATABASE_URL format
   • Ensure PostgreSQL is running
   • Check firewall settings

❌ Port 5000 in use:
   • The app is hardcoded to port 5000
   • Stop other services using this port
   • Or modify server/index.ts

❌ AI features not working:
   • Verify OPENAI_API_KEY is correct
   • Check OpenAI account credits
   • Features will show placeholders without API key

❌ Emails not sending:
   • Without email keys, emails are logged to console
   • Check terminal output for email content
   • Verify email service credentials

Access your application at: http://localhost:5000

Happy coding! 🎉
`;

function generateSessionSecret() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function main() {
  console.log('🔧 Setting up Smartyoz for local development...\n');

  // Create .env.example file
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  fs.writeFileSync(envExamplePath, ENV_TEMPLATE);
  console.log('✅ Created .env.example file');

  // Create .env file if it doesn't exist
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    const customEnv = ENV_TEMPLATE.replace(
      'SESSION_SECRET=your-super-secret-session-key-change-this-in-production',
      `SESSION_SECRET=${generateSessionSecret()}`
    );
    fs.writeFileSync(envPath, customEnv);
    console.log('✅ Created .env file with generated session secret');
  } else {
    console.log('ℹ️  .env file already exists (not overwriting)');
  }

  // Create setup documentation
  const setupPath = path.join(__dirname, '..', 'LOCAL_SETUP.md');
  fs.writeFileSync(setupPath, SETUP_GUIDE);
  console.log('✅ Created LOCAL_SETUP.md with detailed instructions');

  console.log(SETUP_GUIDE);
}

// Run the script
main();

# SmartAssist Deployment Guide

## Deploy to Render

### Prerequisites
- GitHub account
- Render account (render.com)
- Your API keys (OpenAI and Anthropic)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit for deployment"
git branch -M main
git remote add origin https://github.com/yourusername/smartyoz-app.git
git push -u origin main
```

### Step 2: Create Web Service on Render
1. Go to https://render.com and login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `smartyoz-app`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free or paid

### Step 3: Environment Variables
Add these in your Render dashboard:

**Required:**
```
NODE_ENV=production
DATABASE_URL=postgresql://neondb_owner:npg_RVg0ElihL9Zu@ep-bitter-flower-ad2xh9bb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
SESSION_SECRET=Kx8mP2nQ7vR9wE5tY6uI1oP3aS8dF4gH9jK2lZ7xC5vB6nM3qW8eR1tY5uI9oP2aS
BASE_URL=https://your-app-name.onrender.com
```

**AI Features:**
```
OPENAI_API_KEY=your_actual_openai_key
ANTHROPIC_API_KEY=your_actual_claude_key
```

**Optional (Email):**
```
SENDGRID_API_KEY=your_sendgrid_key
GMAIL_USER=your_gmail
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### Step 4: Deploy
- Push changes to main branch
- Render will automatically deploy
- Monitor build logs in Render dashboard

### Step 5: Test
- Visit your app at: `https://your-app-name.onrender.com`
- Test job creation with AI generation
- Test candidate uploads and resume parsing

## Important Notes
- Render automatically assigns the PORT (you don't need to set it)
- Neon PostgreSQL is already configured
- File uploads use memory storage (suitable for resume parsing)
- Free tier sleeps after 15 minutes of inactivity
- SSL certificates are automatically provided by Render

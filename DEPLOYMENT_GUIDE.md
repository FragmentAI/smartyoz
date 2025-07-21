# Smartyoz - GitHub Deployment Guide

## Moving to GitHub

### Step 1: Create GitHub Repository
1. Go to [GitHub.com](https://github.com) and sign in
2. Click "New repository" or the "+" icon → "New repository"
3. Repository name: `smartyoz-hiring-platform`
4. Description: `AI-powered hiring platform with automated candidate screening and interview management`
5. Set to **Public** (recommended) or **Private**
6. **Do NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### Step 2: Push Code to GitHub

Open terminal in Replit and run these commands:

```bash
# Initialize git repository (if not already done)
git init

# Add all files to git
git add .

# Create initial commit
git commit -m "Initial commit: Smartyoz AI hiring platform with SmartAssist"

# Add your GitHub repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/smartyoz-hiring-platform.git

# Push to GitHub
git push -u origin main
```

### Step 3: Environment Variables for GitHub
Your repository will need these environment variables:

```env
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
SESSION_SECRET=your_session_secret
GMAIL_APP_PASSWORD=your_gmail_app_password
```

### Step 4: GitHub Repository Setup

After pushing, add these files to your repository:

#### `.github/workflows/deploy.yml` (GitHub Actions)
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build project
      run: npm run build
      
    - name: Run tests
      run: npm test
```

### Step 5: Update README.md

Create a comprehensive README.md for your repository:

```markdown
# Smartyoz - AI-Powered Hiring Platform

Revolutionary hiring platform that combines traditional HR management with AI automation.

## Features

- **SmartAssist AI**: Natural language interface for all hiring operations
- **Automated Screening**: AI-powered resume evaluation and candidate matching
- **Multi-Round Interviews**: Technical assessments and AI video interviews
- **Bulk Operations**: Campus drives and mass candidate processing
- **Multi-Platform Integration**: LinkedIn, Naukri, Indeed job posting
- **Complete Automation**: 90% reduction in manual hiring tasks

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js, Express, Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **AI**: OpenAI GPT-4o integration
- **Authentication**: Replit Auth with OpenID Connect

## Quick Start

1. Clone repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run database migrations: `npm run db:push`
5. Start development: `npm run dev`

## Environment Variables

See DEPLOYMENT_GUIDE.md for complete setup instructions.

## License

MIT License - see LICENSE file for details.
```

### Step 6: Additional GitHub Features

#### Enable GitHub Pages (Optional)
1. Go to repository Settings → Pages
2. Source: Deploy from branch → main
3. Folder: `/docs` (if you want to host documentation)

#### Set up Branch Protection
1. Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable "Require pull request reviews"
4. Enable "Require status checks"

#### Add Collaborators
1. Settings → Manage access → Invite a collaborator
2. Enter GitHub usernames of team members

## Important Notes

- **Environment Variables**: Never commit API keys to GitHub
- **Database**: You'll need to set up a new PostgreSQL database for production
- **Domain**: Update CORS settings for your production domain
- **SSL**: Enable HTTPS for production deployment

## Alternative: GitHub Codespaces

For cloud development:
1. Click "Code" → "Codespaces" → "Create codespace"
2. GitHub will create a cloud development environment
3. All dependencies and environment will be set up automatically

Your code is now ready for GitHub! Would you like me to help with any specific part of the migration?
# Smartyoz - AI-Powered Hiring Platform

Revolutionary hiring platform that combines traditional HR management with AI-powered automation to streamline the entire recruitment process.

## 🚀 Features

### SmartAssist AI Interface
- **Natural Language Commands**: Perform any hiring task through conversational AI
- **Intelligent Automation**: "Create 2 Python developer jobs" automatically generates complete job postings
- **Real-time Data Integration**: Get specific, contextual answers about your hiring pipeline
- **Workflow Automation**: Complete hiring workflows through simple text commands

### Core Hiring Management
- **Job Management**: AI-generated job descriptions with multi-platform posting
- **Candidate Screening**: Automated resume evaluation and AI-powered matching
- **Interview System**: Multi-round interviews with AI video assessments
- **Bulk Operations**: Campus drives and mass candidate processing
- **Email Automation**: Professional candidate communication throughout the pipeline

### Advanced Capabilities
- **Multi-Platform Integration**: Post to LinkedIn, Naukri, Indeed, Glassdoor automatically
- **Drive Recruitment**: Campus and walk-in hiring drives with progressive filtering
- **Analytics Dashboard**: Comprehensive hiring metrics and pipeline visualization
- **Role-Based Access**: Organizational hierarchy and permission management

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Shadcn/UI, TanStack Query
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM (Neon serverless)
- **AI Integration**: OpenAI GPT-4o for job generation and candidate evaluation
- **Authentication**: Replit Auth with OpenID Connect
- **Email Services**: SendGrid integration for reliable delivery
- **File Processing**: Multi-format resume parsing (PDF, DOC, DOCX)

## 📊 Key Benefits

- **90% Efficiency Improvement**: Automated workflows reduce manual hiring tasks
- **Real-time Processing**: Instant candidate evaluation and job matching
- **Scalable Operations**: Handle everything from single hires to bulk recruitment drives
- **Complete Automation**: End-to-end hiring without manual intervention
- **Professional Communication**: Automated, branded email templates

## 🚦 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key (optional, has fallbacks)
- SendGrid account for email delivery

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/smartyoz-hiring-platform.git
cd smartyoz-hiring-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env` file with:
```env
DATABASE_URL=your_postgresql_connection_string
OPENAI_API_KEY=your_openai_api_key
SENDGRID_API_KEY=your_sendgrid_api_key
SESSION_SECRET=your_session_secret_key
GMAIL_APP_PASSWORD=your_gmail_app_password
```

4. **Initialize database**
```bash
npm run db:push
```

5. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🎯 Usage Examples

### SmartAssist Commands
- `"Create 3 React developer jobs for senior level"`
- `"Show me all candidates with Python skills"`
- `"Schedule interviews for tomorrow"`
- `"Generate hiring report for this month"`
- `"Find candidates ready for technical interviews"`

### Hiring Workflow
1. **Job Creation**: Create jobs manually or through SmartAssist AI
2. **Candidate Submission**: Bulk upload resumes or individual applications
3. **AI Screening**: Automated evaluation and matching scores
4. **Interview Scheduling**: Automated email invitations with calendar integration
5. **AI Interviews**: Video interviews with real-time evaluation
6. **Decision Making**: AI-generated evaluations and hiring recommendations

## 📁 Project Structure

```
smartyoz-hiring-platform/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages
│   │   └── lib/           # Utilities and hooks
├── server/                # Express backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database layer
│   ├── smart-assist.ts    # AI processing
│   └── email-services.ts  # Email automation
├── shared/                # Shared types and schemas
│   └── schema.ts          # Database schema
└── uploads/              # Resume file storage
```

## 🔧 Configuration

### Email Setup
The platform supports multiple email providers:
- **SendGrid** (Primary): Professional delivery with authentication
- **Gmail SMTP**: Backup option with app passwords
- **Brevo/Mailtrap**: Development and testing

### AI Configuration
- **OpenAI Integration**: Job generation and candidate evaluation
- **Fallback Systems**: Template-based generation when AI unavailable
- **Configurable Prompts**: Customizable AI behavior per organization

## 🚀 Deployment

### Replit Deployment (Recommended)
1. Import repository to Replit
2. Set environment variables in Secrets
3. Run `npm run build`
4. Deploy using Replit's autoscale feature

### Manual Deployment
1. Build the project: `npm run build`
2. Set up PostgreSQL database
3. Configure environment variables
4. Start production server: `npm start`

## 📈 Analytics & Reporting

- **Hiring Pipeline Metrics**: Track candidates through each stage
- **AI Performance**: Evaluation accuracy and matching scores
- **Time-to-Hire**: Complete hiring lifecycle analytics
- **Platform Usage**: SmartAssist command usage and automation benefits
- **Email Delivery**: Campaign performance and engagement tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: See `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Email**: Contact support for deployment assistance

---

**Smartyoz** - Revolutionizing hiring through AI automation and intelligent workflow management.
import OpenAI from 'openai';
import { storage } from './storage';

// Initialize OpenAI - the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

interface ActionItem {
  id: string;
  type: 'job_created' | 'candidate_found' | 'interview_scheduled' | 'report_generated';
  title: string;
  data: any;
}

export class SmartAssistProcessor {
  
  async processUserRequest(prompt: string): Promise<{ message: string; actions: ActionItem[] }> {
    if (!process.env.OPENAI_API_KEY) {
      return {
        message: "AI features are currently unavailable. Please configure the OpenAI API key in Settings.",
        actions: []
      };
    }

    try {
      // First, analyze the intent and extract parameters
      const intentAnalysis = await this.analyzeIntent(prompt);
      
      // Process the request based on intent
      const result = await this.executeAction(intentAnalysis, prompt);
      
      return result;
    } catch (error) {
      console.error('SmartAssist processing error:', error);
      return {
        message: "I encountered an error processing your request. Please try rephrasing or breaking it into smaller steps.",
        actions: []
      };
    }
  }

  private async analyzeIntent(prompt: string) {
    const systemPrompt = `You are SmartAssist, an AI assistant for a hiring platform. Analyze user requests and classify them into actionable intents.

Available platform capabilities:
- Create jobs (with AI-generated job descriptions)
- Search and filter candidates  
- Schedule interviews and view interview schedules
- Generate reports and analytics
- Bulk operations (hiring drives, resume processing)
- Email automation and communication
- Data analysis and insights

Respond with JSON containing:
{
  "intent": "create_job" | "find_candidates" | "schedule_interviews" | "generate_report" | "analyze_data" | "bulk_operation" | "general_query",
  "confidence": 0.0-1.0,
  "parameters": {
    // Extracted parameters based on intent
  },
  "requires_clarification": boolean,
  "clarification_questions": ["question1", "question2"]
}

Key intent patterns:
- "Create/Add/Make jobs" -> create_job
- "Show/Find/Search candidates" -> find_candidates  
- "Show/Find interviews tomorrow/today/scheduled" -> schedule_interviews (viewing existing)
- "Schedule/Book new interviews" -> schedule_interviews (creating new)
- "Report/Analytics/Statistics/How many" -> generate_report
- "Number of interviews tomorrow" -> schedule_interviews (specific count query)

Examples:
- "Create 2 Python developer jobs" -> intent: create_job, parameters: {count: 2, role: "Python Developer", level: "mid"}
- "Show candidates with React skills" -> intent: find_candidates, parameters: {skills: ["React"]}
- "Show me candidates scheduled for interviews tomorrow" -> intent: schedule_interviews, parameters: {date: "tomorrow", action: "view"}
- "But i need teh number of candidates scheduled interview tomorrow" -> intent: schedule_interviews, parameters: {date: "tomorrow", action: "count"}
- "How many interviews this week?" -> intent: generate_report, parameters: {type: "interviews", period: "week"}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  private async executeAction(intent: any, originalPrompt: string): Promise<{ message: string; actions: ActionItem[] }> {
    const actions: ActionItem[] = [];
    let message = "";

    switch (intent.intent) {
      case 'create_job':
        const jobResult = await this.handleJobCreation(intent.parameters, originalPrompt);
        message = jobResult.message;
        actions.push(...jobResult.actions);
        break;

      case 'find_candidates':
        const candidateResult = await this.handleCandidateSearch(intent.parameters);
        message = candidateResult.message;
        actions.push(...candidateResult.actions);
        break;

      case 'schedule_interviews':
        const interviewResult = await this.handleInterviewScheduling(intent.parameters);
        message = interviewResult.message;
        actions.push(...interviewResult.actions);
        break;

      case 'generate_report':
        const reportResult = await this.handleReportGeneration(intent.parameters);
        message = reportResult.message;
        actions.push(...reportResult.actions);
        break;

      case 'analyze_data':
        const analyticsResult = await this.handleDataAnalysis(intent.parameters);
        message = analyticsResult.message;
        actions.push(...analyticsResult.actions);
        break;

      case 'bulk_operation':
        const bulkResult = await this.handleBulkOperations(intent.parameters);
        message = bulkResult.message;
        actions.push(...bulkResult.actions);
        break;

      default:
        const generalResult = await this.handleGeneralQuery(originalPrompt);
        message = generalResult.message;
        actions.push(...generalResult.actions);
        break;
    }

    return { message, actions };
  }

  private async handleJobCreation(params: any, prompt: string): Promise<{ message: string; actions: ActionItem[] }> {
    try {
      const jobCount = params.count || 1;
      const role = params.role || "Software Developer";
      const level = params.level || "mid";
      const department = params.department || "Engineering";
      
      const actions: ActionItem[] = [];
      
      for (let i = 0; i < jobCount; i++) {
        // Generate job description using AI
        const jobDescription = await this.generateJobDescription(role, level, department);
        
        // Create the job
        const newJob = await storage.createJob({
          title: `${level.charAt(0).toUpperCase() + level.slice(1)} ${role}`,
          department,
          description: jobDescription,
          requirements: this.extractRequirements(jobDescription),
          salary: this.generateSalaryRange(role, level),
          location: "Remote/Hybrid",
          type: "full-time",
          status: "active"
        });

        actions.push({
          id: `job-${newJob.id}`,
          type: 'job_created',
          title: `Created: ${newJob.title}`,
          data: { jobId: newJob.id, title: newJob.title }
        });
      }

      const message = jobCount === 1 
        ? `Successfully created 1 ${role} position with AI-generated job description. The job is now active and ready for candidate applications.`
        : `Successfully created ${jobCount} ${role} positions with unique AI-generated job descriptions. All jobs are now active and ready for applications.`;

      return { message, actions };
    } catch (error) {
      return {
        message: "I encountered an error while creating the job(s). Please check the job management section or try again.",
        actions: []
      };
    }
  }

  private async handleCandidateSearch(params: any): Promise<{ message: string; actions: ActionItem[] }> {
    try {
      const skills = params.skills || [];
      const experience = params.experience;
      const status = params.status;

      // Get all candidates
      const allCandidates = await storage.getCandidates();
      
      // Filter candidates based on criteria
      let filteredCandidates = allCandidates;

      if (skills.length > 0) {
        filteredCandidates = filteredCandidates.filter(candidate => 
          skills.some((skill: string) => 
            candidate.skills.toLowerCase().includes(skill.toLowerCase())
          )
        );
      }

      if (experience) {
        // Add experience filtering logic if needed
      }

      if (status) {
        filteredCandidates = filteredCandidates.filter(candidate => 
          candidate.status === status
        );
      }

      const actions: ActionItem[] = [{
        id: 'candidate-search',
        type: 'candidate_found',
        title: `Found ${filteredCandidates.length} candidates`,
        data: { count: filteredCandidates.length, criteria: params }
      }];

      let message = `Found ${filteredCandidates.length} candidate(s)`;
      
      if (skills.length > 0) {
        message += ` with ${skills.join(', ')} skills`;
      }
      
      if (filteredCandidates.length > 0) {
        const topCandidates = filteredCandidates.slice(0, 5);
        message += `:\n\n${topCandidates.map(c => 
          `• ${c.name} - ${c.email} (${c.status})`
        ).join('\n')}`;
        
        if (filteredCandidates.length > 5) {
          message += `\n\n...and ${filteredCandidates.length - 5} more candidates.`;
        }
      }

      return { message, actions };
    } catch (error) {
      return {
        message: "I encountered an error searching for candidates. Please try again or use the candidates page directly.",
        actions: []
      };
    }
  }

  private async handleInterviewScheduling(params: any): Promise<{ message: string; actions: ActionItem[] }> {
    try {
      const date = params.date || 'tomorrow';
      
      if (date === 'tomorrow' || date.includes('tomorrow')) {
        // Get interviews scheduled for tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);
        
        const interviews = await storage.getInterviews();
        const candidates = await storage.getCandidates();
        
        // Get detailed interview information with candidate names
        const tomorrowInterviews = interviews.filter(interview => {
          const interviewDate = new Date(interview.scheduledAt);
          return interviewDate >= tomorrow && interviewDate < dayAfter;
        });

        let message = `You have ${tomorrowInterviews.length} interview(s) scheduled for tomorrow`;
        
        if (tomorrowInterviews.length === 0) {
          message += ".\n\nNo interviews are currently scheduled for tomorrow. You can schedule new interviews from the Interviews section or use bulk scheduling for qualified candidates.";
        } else {
          message += ":\n\n";
          
          // Get detailed candidate information for each interview
          for (const interview of tomorrowInterviews) {
            const candidate = candidates.find(c => c.id === interview.candidateId);
            const candidateName = candidate ? `${candidate.firstName} ${candidate.lastName}` : `Candidate ID: ${interview.candidateId}`;
            const time = new Date(interview.scheduledAt).toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            message += `• ${candidateName} - ${time}`;
            if (interview.type) {
              message += ` (${interview.type})`;
            }
            message += `\n`;
          }
          
          message += `\nAll interviews are set to ${tomorrow.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}.`;
        }

        return {
          message,
          actions: [{
            id: 'interviews-tomorrow',
            type: 'interview_scheduled',
            title: `${tomorrowInterviews.length} interviews tomorrow`,
            data: { count: tomorrowInterviews.length, date: 'tomorrow', interviews: tomorrowInterviews }
          }]
        };
      }

      return {
        message: "Please specify which candidates you'd like to schedule interviews for, or ask about existing interview schedules.",
        actions: []
      };
    } catch (error) {
      return {
        message: "I encountered an error accessing interview data. Please check the interviews section.",
        actions: []
      };
    }
  }

  private async handleReportGeneration(params: any): Promise<{ message: string; actions: ActionItem[] }> {
    try {
      const type = params.type || 'general';
      const period = params.period || 'month';

      let message = '';
      const actions: ActionItem[] = [];

      if (type === 'interviews') {
        const interviews = await storage.getInterviews();
        const now = new Date();
        let startDate = new Date();

        switch (period) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          default:
            startDate.setMonth(now.getMonth() - 1);
        }

        const periodInterviews = interviews.filter(interview => 
          new Date(interview.scheduledAt) >= startDate
        );

        message = `Interview Report (${period}):\n\n` +
          `• Total Interviews: ${periodInterviews.length}\n` +
          `• Completed: ${periodInterviews.filter(i => i.status === 'completed').length}\n` +
          `• Pending: ${periodInterviews.filter(i => i.status === 'scheduled').length}\n` +
          `• Cancelled: ${periodInterviews.filter(i => i.status === 'cancelled').length}`;

        actions.push({
          id: 'interview-report',
          type: 'report_generated',
          title: `Interview Report (${period})`,
          data: { type: 'interviews', period, count: periodInterviews.length }
        });
      } else {
        // General hiring report
        const jobs = await storage.getJobs();
        const candidates = await storage.getCandidates();
        const applications = await storage.getApplications();

        message = `Hiring Report (${period}):\n\n` +
          `• Active Jobs: ${jobs.filter(j => j.status === 'active').length}\n` +
          `• Total Candidates: ${candidates.length}\n` +
          `• Applications: ${applications.length}\n` +
          `• Qualified Candidates: ${candidates.filter(c => c.status === 'qualified').length}`;

        actions.push({
          id: 'hiring-report',
          type: 'report_generated',
          title: `Hiring Report (${period})`,
          data: { type: 'general', period }
        });
      }

      return { message, actions };
    } catch (error) {
      return {
        message: "I encountered an error generating the report. Please try again or check the analytics section.",
        actions: []
      };
    }
  }

  private async handleDataAnalysis(params: any): Promise<{ message: string; actions: ActionItem[] }> {
    try {
      const jobs = await storage.getJobs();
      const candidates = await storage.getCandidates();
      const applications = await storage.getApplications();

      const analysis = `Data Analysis Summary:\n\n` +
        `📊 Jobs: ${jobs.length} total (${jobs.filter(j => j.status === 'active').length} active)\n` +
        `👥 Candidates: ${candidates.length} total\n` +
        `📋 Applications: ${applications.length} total\n` +
        `🎯 Conversion Rate: ${applications.length > 0 ? ((candidates.filter(c => c.status === 'hired').length / applications.length) * 100).toFixed(1) : 0}%`;

      return {
        message: analysis,
        actions: [{
          id: 'data-analysis',
          type: 'report_generated',
          title: 'Platform Analytics',
          data: { jobCount: jobs.length, candidateCount: candidates.length }
        }]
      };
    } catch (error) {
      return {
        message: "Unable to analyze platform data at this time. Please try again.",
        actions: []
      };
    }
  }

  private async handleBulkOperations(params: any): Promise<{ message: string; actions: ActionItem[] }> {
    return {
      message: "Bulk operations are available through the Bulk Hire section. I can help you navigate there or answer specific questions about bulk processes.",
      actions: []
    };
  }

  private async handleGeneralQuery(prompt: string): Promise<{ message: string; actions: ActionItem[] }> {
    try {
      // Get current platform data for context
      const jobs = await storage.getJobs();
      const candidates = await storage.getCandidates();
      const applications = await storage.getApplications();
      const interviews = await storage.getInterviews();

      const systemPrompt = `You are SmartAssist, an AI assistant for the Smartyoz hiring platform. 

Current platform status:
- Active Jobs: ${jobs.filter(j => j.status === 'active').length}
- Total Candidates: ${candidates.length}
- Applications: ${applications.length}
- Scheduled Interviews: ${interviews.filter(i => i.status === 'scheduled').length}

Platform capabilities include:
- Job management and creation with AI-generated descriptions
- Candidate screening and management with AI matching
- Interview scheduling and AI video interviews
- Bulk hiring and campus drives
- Multi-platform job posting (LinkedIn, Naukri, Indeed, etc.)
- Email automation and communication
- Analytics and reporting

Provide helpful, contextual responses based on current platform data. Be specific about numbers when relevant and guide users on actionable next steps.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return {
        message: response.choices[0].message.content || "I'm here to help with your hiring needs. What would you like assistance with?",
        actions: [{
          id: 'general-help',
          type: 'report_generated',
          title: 'Platform Guidance',
          data: { type: 'help', context: 'general_query' }
        }]
      };
    } catch (error) {
      return {
        message: "I'm SmartAssist, your AI hiring companion. I can help you create jobs, find candidates, schedule interviews, generate reports, and streamline your hiring process. What would you like me to help you with?",
        actions: []
      };
    }
  }

  private async generateJobDescription(role: string, level: string, department: string): Promise<string> {
    try {
      const prompt = `Create a comprehensive job description for a ${level} ${role} position in the ${department} department. Include:
      
      1. Job Overview (2-3 sentences)
      2. Key Responsibilities (5-7 bullet points)
      3. Required Skills & Qualifications
      4. Preferred Qualifications
      5. What We Offer

      Make it professional, engaging, and specific to the role level.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 1000
      });

      return response.choices[0].message.content || `We are seeking a talented ${level} ${role} to join our ${department} team.`;
    } catch (error) {
      return `We are seeking a talented ${level} ${role} to join our ${department} team. This role involves working with cutting-edge technologies and contributing to innovative projects.`;
    }
  }

  private extractRequirements(jobDescription: string): string {
    // Simple extraction of requirements from job description
    const lines = jobDescription.split('\n');
    const reqSection = lines.find(line => line.toLowerCase().includes('required') || line.toLowerCase().includes('qualifications'));
    return reqSection || 'Bachelor\'s degree and relevant experience required.';
  }

  private generateSalaryRange(role: string, level: string): string {
    // Basic salary estimation logic
    const baseSalaries: { [key: string]: { [key: string]: [number, number] } } = {
      'developer': {
        'junior': [60000, 80000],
        'mid': [80000, 120000],
        'senior': [120000, 180000]
      },
      'manager': {
        'mid': [100000, 140000],
        'senior': [140000, 200000]
      }
    };

    const roleKey = role.toLowerCase().includes('manager') ? 'manager' : 'developer';
    const levelKey = level.toLowerCase();
    
    const range = baseSalaries[roleKey]?.[levelKey] || [70000, 100000];
    return `$${range[0].toLocaleString()} - $${range[1].toLocaleString()}`;
  }
}

export const smartAssistProcessor = new SmartAssistProcessor();
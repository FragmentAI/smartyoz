import { Request, Response } from 'express';
import { storage } from './storage';
import { sendEmail } from './email-services';

// Email webhook handler for processing candidate responses
export async function handleEmailWebhook(req: Request, res: Response) {
  try {
    const { from, subject, text, html } = req.body;
    
    console.log(`Processing email from: ${from}`);
    console.log(`Subject: ${subject}`);
    
    // Extract candidate email and find matching candidate
    const candidateEmail = extractEmail(from);
    const candidates = await storage.getCandidates();
    const candidate = candidates.find(c => c.email === candidateEmail);
    
    if (!candidate) {
      console.log(`No candidate found for email: ${candidateEmail}`);
      return res.status(200).json({ message: 'Email processed - no matching candidate' });
    }
    
    // Check if this is a screening response
    if (isScreeningResponse(subject, text)) {
      console.log(`Processing screening response from candidate ${candidate.id}`);
      
      // Parse screening answers
      const emailText = text || html;
      console.log(`Email text being parsed:`, emailText?.substring(0, 300));
      const answers = parseScreeningAnswers(emailText);
      console.log(`Parsed answers:`, answers);
      
      // Update candidate with screening responses
      await storage.updateCandidate(candidate.id, {
        screeningResponses: JSON.stringify(answers)
      });
      
      // Check if candidate qualifies for interview (using job-specific criteria)
      const qualified = await evaluateScreeningResponsesFromRawText(emailText, candidate);
      console.log(`Qualification result: ${qualified}`);
      
      if (qualified) {
        console.log(`Candidate ${candidate.id} qualified - sending interview link`);
        await sendInterviewSchedulingEmail(candidate);
      } else {
        console.log(`Candidate ${candidate.id} not qualified - sending rejection`);
        await sendRejectionEmail(candidate);
      }
    }
    
    res.status(200).json({ message: 'Email processed successfully' });
    
  } catch (error) {
    console.error('Email webhook error:', error);
    res.status(500).json({ error: 'Failed to process email' });
  }
}

// Extract email address from "Name <email@domain.com>" format
function extractEmail(fromField: string): string {
  const emailMatch = fromField.match(/<([^>]+)>/);
  return emailMatch ? emailMatch[1] : fromField;
}

// Check if email is a screening response
function isScreeningResponse(subject: string, text: string): boolean {
  const screeningKeywords = [
    'screening questions',
    'application questions',
    're:',
    'response to',
    'answers'
  ];
  
  const subjectLower = subject.toLowerCase();
  const textLower = (text || '').toLowerCase();
  
  return screeningKeywords.some(keyword => 
    subjectLower.includes(keyword) || textLower.includes(keyword)
  );
}

// Parse screening answers from email text
function parseScreeningAnswers(text: string): Record<string, string> {
  const answers: Record<string, string> = {};
  
  if (!text) return answers;
  
  // Look for numbered answers (1. Answer, 2. Answer, etc.)
  const numberedPattern = /(\d+)\.\s*([^\n\r]+)/g;
  let match;
  
  while ((match = numberedPattern.exec(text)) !== null) {
    const questionNum = match[1];
    const answer = match[2].trim();
    answers[`question_${questionNum}`] = answer;
  }
  
  // Look for question-answer pairs  
  const qaPattern = /(?:Q:|Question\s*\d*:?\s*)(.*?)[\n\r]+(?:A:|Answer:?\s*)(.*?)(?=[\n\r]+(?:Q:|Question|\d+\.|$))/gim;
  
  while ((match = qaPattern.exec(text)) !== null) {
    const question = match[1].trim();
    const answer = match[2].trim();
    const key = question.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    answers[key] = answer;
  }
  
  return answers;
}

// Extract qualification criteria from job details
function extractJobQualificationCriteria(job: any) {
  const jobText = (job.description + ' ' + (job.requirements || '')).toLowerCase();
  
  const criteria = {
    requiresSalaryInfo: false,
    salaryRange: null as { min: number; max: number } | null,
    requiresExperience: false,
    minExperience: 0,
    requiresRelocation: false,
    allowsRemote: false,
    requiresNotice: false,
    requiredSkills: [] as string[],
    workType: job.workType || 'onsite'
  };
  
  // Check for salary requirements
  const salaryMatches = jobText.match(/(\d+)\s*(?:lpa|lakh|k|thousand|lac)\s*(?:to|-)?\s*(\d+)?\s*(?:lpa|lakh|k|thousand|lac)?/g);
  if (salaryMatches || jobText.includes('salary') || jobText.includes('compensation')) {
    criteria.requiresSalaryInfo = true;
    
    // Extract salary range if present
    const salaryNumbers = jobText.match(/(\d+)\s*(?:lpa|lakh|k|thousand|lac)/g);
    if (salaryNumbers && salaryNumbers.length >= 1) {
      const amounts = salaryNumbers.map(s => {
        const num = parseInt(s.match(/\d+/)?.[0] || '0');
        if (s.includes('lpa') || s.includes('lakh') || s.includes('lac')) return num;
        if (s.includes('k') || s.includes('thousand')) return num / 100; // Convert to lakhs
        return num;
      });
      criteria.salaryRange = {
        min: Math.min(...amounts),
        max: Math.max(...amounts)
      };
    }
  }
  
  // Check for experience requirements
  const expMatches = jobText.match(/(\d+)\s*(?:\+)?\s*years?\s+(?:of\s+)?experience/g);
  if (expMatches || jobText.includes('experience')) {
    criteria.requiresExperience = true;
    const expNumbers = jobText.match(/(\d+)\s*(?:\+)?\s*years?/g);
    if (expNumbers) {
      criteria.minExperience = Math.min(...expNumbers.map(e => parseInt(e.match(/\d+/)?.[0] || '0')));
    }
  }
  
  // Check for relocation requirements
  if (jobText.includes('relocat') || jobText.includes('willing to move') || 
      (job.workType === 'onsite' && !jobText.includes('local'))) {
    criteria.requiresRelocation = true;
  }
  
  // Check if remote work is allowed
  if (job.workType === 'remote' || job.workType === 'hybrid' || 
      jobText.includes('remote') || jobText.includes('work from home')) {
    criteria.allowsRemote = true;
  }
  
  // Check for notice period requirements
  if (jobText.includes('notice') || jobText.includes('immediately') || 
      jobText.includes('joining')) {
    criteria.requiresNotice = true;
  }
  
  // Extract key skills
  const skillKeywords = ['python', 'java', 'javascript', 'react', 'node', 'sql', 
                        'machine learning', 'ai', 'data science', 'backend', 'frontend'];
  criteria.requiredSkills = skillKeywords.filter(skill => jobText.includes(skill));
  
  return criteria;
}

// Evaluate if candidate qualifies based on job-specific criteria
async function evaluateScreeningResponsesFromRawText(emailText: string, candidate: any): Promise<boolean> {
  if (!emailText || emailText.trim().length === 0) {
    return false;
  }
  
  try {
    // Get candidate's application and job details
    console.log(`Looking for applications for candidate ${candidate.id} (${candidate.firstName} ${candidate.lastName})`);
    const applications = await storage.getApplications();
    console.log(`Found ${applications.length} total applications`);
    
    const candidateApp = applications.find(app => app.candidate.id === candidate.id);
    console.log(`Candidate application found:`, candidateApp ? `Yes - Job: ${candidateApp.job?.title}` : 'No');
    
    if (!candidateApp?.job) {
      console.log('No job found for candidate, using generic qualification');
      return evaluateGenericResponse(emailText);
    }
    
    const job = candidateApp.job;
    const criteria = extractJobQualificationCriteria(job);
    const responseText = emailText.toLowerCase();
    
    console.log(`Job-specific criteria for ${job.title}:`, criteria);
    
    let qualificationScore = 0;
    let totalCriteria = 0;
    
    // Check salary information if required
    if (criteria.requiresSalaryInfo) {
      totalCriteria++;
      if (responseText.includes('ctc') || responseText.includes('salary') || 
          responseText.includes('lpa') || responseText.includes('lakh')) {
        qualificationScore++;
        
        // Check if salary is within range
        if (criteria.salaryRange) {
          const candidateSalary = extractSalaryFromResponse(responseText);
          if (candidateSalary && candidateSalary >= criteria.salaryRange.min && 
              candidateSalary <= criteria.salaryRange.max * 1.5) { // Allow 50% buffer
            qualificationScore += 0.5;
          }
        }
      }
    }
    
    // Check experience if required
    if (criteria.requiresExperience) {
      totalCriteria++;
      if (responseText.includes('experience') || responseText.includes('years')) {
        const candidateExp = extractExperienceFromResponse(responseText);
        if (candidateExp >= criteria.minExperience) {
          qualificationScore++;
        } else if (candidateExp >= criteria.minExperience * 0.8) { // 80% of required experience
          qualificationScore += 0.5;
        }
      }
    }
    
    // Check relocation willingness if required
    if (criteria.requiresRelocation) {
      totalCriteria++;
      if (responseText.includes('relocat') || responseText.includes('willing to move') ||
          responseText.includes('yes') && responseText.includes('relocat')) {
        qualificationScore++;
      }
    }
    
    // Check notice period if required
    if (criteria.requiresNotice) {
      totalCriteria++;
      if (responseText.includes('notice') || responseText.includes('immediate') ||
          responseText.includes('available')) {
        qualificationScore++;
      }
    }
    
    // Check for skills match
    if (criteria.requiredSkills.length > 0) {
      totalCriteria++;
      const skillMatches = criteria.requiredSkills.filter(skill => 
        responseText.includes(skill.toLowerCase())
      ).length;
      if (skillMatches > 0) {
        qualificationScore += Math.min(skillMatches / criteria.requiredSkills.length, 1);
      }
    }
    
    // Check general engagement
    const hasEngagement = responseText.includes('yes') || responseText.includes('interested') ||
                         responseText.includes('available') || responseText.length > 50;
    
    if (hasEngagement) qualificationScore += 0.5;
    
    const qualificationRate = totalCriteria > 0 ? qualificationScore / totalCriteria : 0;
    
    console.log(`Qualification analysis: ${qualificationScore}/${totalCriteria} = ${qualificationRate}`);
    console.log(`Response text: ${responseText.substring(0, 200)}...`);
    
    // Qualify if they meet 60% of the criteria
    return qualificationRate >= 0.6;
    
  } catch (error) {
    console.error('Error in job-specific evaluation:', error);
    return evaluateGenericResponse(emailText);
  }
}

// Fallback generic evaluation
function evaluateGenericResponse(emailText: string): boolean {
  const textLower = emailText.toLowerCase();
  const hasSubstantialContent = emailText.trim().length > 20;
  const hasPositiveResponse = textLower.includes('yes') || textLower.includes('interested') ||
                             textLower.includes('available') || textLower.includes('experience');
  
  return hasSubstantialContent && hasPositiveResponse;
}

// Helper function to extract salary from response
function extractSalaryFromResponse(text: string): number | null {
  const salaryMatch = text.match(/(\d+)\s*(?:lpa|lakh|lac|k|thousand)/);
  if (salaryMatch) {
    const amount = parseInt(salaryMatch[1]);
    if (text.includes('lpa') || text.includes('lakh') || text.includes('lac')) {
      return amount;
    }
    if (text.includes('k') || text.includes('thousand')) {
      return amount / 100; // Convert to lakhs
    }
  }
  return null;
}

// Helper function to extract experience from response
function extractExperienceFromResponse(text: string): number {
  const expMatch = text.match(/(\d+)\s*years?/);
  return expMatch ? parseInt(expMatch[1]) : 0;
}

// Original function for backward compatibility
function evaluateScreeningResponses(answers: Record<string, string>): boolean {
  if (Object.keys(answers).length === 0) {
    return false;
  }
  
  const allText = Object.values(answers).join(' ').toLowerCase();
  const positiveKeywords = [
    'yes', 'available', 'experience', 'skilled', 'proficient',
    'familiar', 'years', 'worked', 'developed', 'managed'
  ];
  
  const positiveMatches = positiveKeywords.filter(keyword => 
    allText.includes(keyword)
  ).length;
  
  return positiveMatches >= 2;
}

// Send interview scheduling email
export async function sendInterviewSchedulingEmail(candidate: any) {
  try {
    console.log(`🎯 Starting interview email process for candidate ${candidate.id} (${candidate.email})`);
    
    // Add a small delay to avoid spam filters and ensure proper email sequencing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Find the candidate's most recent application
    const applications = await storage.getApplications();
    const candidateApp = applications.find(app => app.candidate.id === candidate.id);
    
    if (!candidateApp) {
      console.error(`No application found for candidate ${candidate.id} (${candidate.firstName} ${candidate.lastName})`);
      console.log(`Candidate ${candidate.id} (${candidate.firstName} ${candidate.lastName}) applications:`, 
        applications.filter(app => app.candidate.id === candidate.id).map(app => ({
          id: app.id,
          jobId: app.jobId,
          status: app.status,
          overallScore: app.overallScore,
          matchingScore: app.matchingScore,
          skillsMatch: app.skillsMatch,
          experienceMatch: app.experienceMatch,
          appliedAt: app.appliedAt,
          jobTitle: app.job?.title
        }))
      );
      return;
    }
    
    const interviewToken = generateInterviewToken();
    const baseUrl = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
    const schedulingUrl = `https://${baseUrl}/interview/schedule/${interviewToken}`;
    
    // Create interview token in database with correct application ID
    await storage.createInterviewToken({
      token: interviewToken,
      applicationId: candidateApp.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      used: false
    });
    
    const jobTitle = candidateApp.job?.title || 'Position';
    const jobDepartment = candidateApp.job?.department || '';
    
    const emailContent = `
Dear ${candidate.firstName} ${candidate.lastName},

We are pleased to inform you that your application for the ${jobTitle} position at Smartyoz has progressed to the interview stage.

INTERVIEW DETAILS
Position: ${jobTitle}
${jobDepartment ? `Department: ${jobDepartment}` : ''}
Format: Video Interview
Duration: 30-45 minutes
Language: English

NEXT STEPS
Please schedule your interview using the secure link below:
${schedulingUrl}

This link will remain active for 7 days from the date of this email. We recommend scheduling your interview within the next 48 hours to secure your preferred time slot.

WHAT TO EXPECT
- Technical and behavioral questions related to the role
- Opportunity to ask questions about the position and company
- Interview results will be communicated within 3-5 business days

If you have any questions or need to reschedule, please reply to this email.

We look forward to speaking with you.

Best regards,
Smartyoz Hiring Team
Chennai, India
    `.trim();
    
    const htmlContent = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff;">
        <div style="border-bottom: 2px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 30px;">
            <h2 style="color: #2c3e50; margin: 0;">Smartyoz</h2>
            <p style="color: #7f8c8d; margin: 5px 0 0 0; font-size: 14px;">Interview Invitation</p>
        </div>
        
        <p style="margin-bottom: 20px;">Dear ${candidate.firstName} ${candidate.lastName},</p>
        
        <p style="margin-bottom: 20px;">We are pleased to inform you that your application for the ${jobTitle} position at Smartyoz has progressed to the interview stage.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #2c3e50; margin: 25px 0;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">INTERVIEW DETAILS</h3>
            <p style="margin: 8px 0; font-size: 14px;"><strong>Position:</strong> ${jobTitle}</p>
            ${jobDepartment ? `<p style="margin: 8px 0; font-size: 14px;"><strong>Department:</strong> ${jobDepartment}</p>` : ''}
            <p style="margin: 8px 0; font-size: 14px;"><strong>Format:</strong> Video Interview</p>
            <p style="margin: 8px 0; font-size: 14px;"><strong>Duration:</strong> 30-45 minutes</p>
            <p style="margin: 8px 0; font-size: 14px;"><strong>Language:</strong> English</p>
        </div>
        
        <div style="background: #e8f4fd; padding: 20px; border-left: 4px solid #3498db; margin: 25px 0;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">NEXT STEPS</h3>
            <p style="margin-bottom: 15px;">Please schedule your interview using the secure link below:</p>
            <p style="margin: 15px 0;"><a href="${schedulingUrl}" style="color: #3498db; text-decoration: none; font-weight: bold;">Schedule Your Interview</a></p>
            <p style="margin-top: 15px; font-size: 14px; color: #7f8c8d;">This link will remain active for 7 days from the date of this email. We recommend scheduling your interview within the next 48 hours to secure your preferred time slot.</p>
        </div>
        
        <div style="margin: 25px 0;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 16px;">WHAT TO EXPECT</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555;">
                <li style="margin: 8px 0;">Technical and behavioral questions related to the role</li>
                <li style="margin: 8px 0;">Opportunity to ask questions about the position and company</li>
                <li style="margin: 8px 0;">Interview results will be communicated within 3-5 business days</li>
            </ul>
        </div>
        
        <p style="margin: 25px 0;">If you have any questions or need to reschedule, please reply to this email.</p>
        
        <p style="margin-bottom: 10px;">We look forward to speaking with you.</p>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; margin-top: 30px;">
            <p style="margin: 0; color: #7f8c8d; font-size: 14px;">
                Best regards,<br>
                <strong>Smartyoz Hiring Team</strong><br>
                Chennai, India
            </p>
        </div>
    </div>
</body>
</html>
    `;
    
    // Use direct SendGrid API for reliable interview invitation delivery
    let emailSent = false;
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    
    // Try SendGrid with improved format
    if (sendgridApiKey && sendgridApiKey.startsWith('SG.')) {
      try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${sendgridApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            personalizations: [{
              to: [{ email: candidate.email, name: `${candidate.firstName} ${candidate.lastName}` }],
              subject: `Next Steps for ${jobTitle} Application`
            }],
            from: { 
              email: 'aboobakarsithik@gmail.com', 
              name: 'Smartyoz Hiring Team' 
            },
            reply_to: { 
              email: 'aboobakarsithik@gmail.com',
              name: 'Smartyoz Hiring Team'
            },
            content: [
              {
                type: 'text/plain',
                value: emailContent
              },
              {
                type: 'text/html',
                value: htmlContent
              }
            ]
          })
        });
        
        if (response.ok) {
          emailSent = true;
          console.log('✅ Interview email sent via SendGrid Direct API');
        } else {
          const errorText = await response.text();
          console.error('SendGrid API Error:', response.status, errorText);
        }
      } catch (error) {
        console.log('SendGrid direct API failed, trying alternatives...');
        console.error('SendGrid error details:', error);
      }
    }
    
    // Fallback to Ethereal if SendGrid fails
    if (!emailSent) {
      try {
        const { sendEmailWithEthereal } = await import('./email-services');
        await sendEmailWithEthereal({
          to: candidate.email,
          from: 'interviews@smartyoz.com',
          subject: `Interview Scheduling - ${jobTitle} Position`,
          text: emailContent
        });
        emailSent = true;
        console.log('✅ Interview email sent via Ethereal (fallback)');
      } catch (error) {
        console.log('All email services failed, using default routing...');
        const { sendEmail } = await import('./email-services');
        await sendEmail({
          to: candidate.email,
          from: 'noreply@smartyoz.com',
          subject: `Interview Scheduling - ${jobTitle} Position`,
          text: emailContent
        });
        emailSent = true;
      }
    }
    
    console.log(`✅ Interview invitation email sent successfully to ${candidate.email}`);
    console.log(`📧 Email details: Subject="Interview Scheduling - ${jobTitle} Position", From="interviews@smartyoz.com", Token=${interviewToken}`);
    
  } catch (error) {
    console.error(`❌ Failed to send interview scheduling email to ${candidate.email}:`, error);
  }
}

// Send rejection email
async function sendRejectionEmail(candidate: any) {
  try {
    const emailContent = `
Dear ${candidate.firstName} ${candidate.lastName},

Thank you for your interest in joining our team and for taking the time to respond to our screening questions.

After careful review of your responses, we have decided to move forward with other candidates whose experience more closely matches our current requirements.

We appreciate your time and wish you the best in your job search.

Best regards,
Smartyoz Hiring Team
    `.trim();
    
    await sendEmail({
      to: candidate.email,
      from: process.env.GMAIL_USER || 'hr@smartyoz.com',
      subject: `Application Update - ${candidate.firstName} ${candidate.lastName}`,
      text: emailContent,
      html: emailContent.replace(/\n/g, '<br>')
    });
    
    console.log(`✓ Rejection email sent to ${candidate.email}`);
    
  } catch (error) {
    console.error('Failed to send rejection email:', error);
  }
}

// Generate unique interview token
function generateInterviewToken(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Brevo webhook handler specifically for Brevo inbound emails
export async function handleBrevoWebhook(req: Request, res: Response) {
  try {
    const webhookData = req.body;
    
    // Brevo webhook format
    const emailData = {
      from: webhookData.sender?.email || webhookData.from,
      subject: webhookData.subject,
      text: webhookData.text,
      html: webhookData.html
    };
    
    // Process using the same logic
    await handleEmailWebhook({ body: emailData } as Request, res);
    
  } catch (error) {
    console.error('Brevo webhook error:', error);
    res.status(500).json({ error: 'Failed to process Brevo webhook' });
  }
}
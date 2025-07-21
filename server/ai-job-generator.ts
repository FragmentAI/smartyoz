import OpenAI from "openai";

let openai: OpenAI | null = null;

// Function to initialize OpenAI client with provided API key
function initializeOpenAI(apiKey: string) {
  if (apiKey) {
    openai = new OpenAI({
      apiKey: apiKey,
    });
    return true;
  }
  return false;
}

// Initialize OpenAI client if API key is available from environment
if (process.env.OPENAI_API_KEY) {
  initializeOpenAI(process.env.OPENAI_API_KEY);
}

export interface JobGenerationRequest {
  title: string;
  department: string;
  workType: string;
  experienceLevel: string;
  skills: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
}

export interface JobGenerationResponse {
  description: string;
  requirements: string;
  benefits: string;
}

export async function generateJobDescription(
  jobData: JobGenerationRequest, 
  apiKey?: string
): Promise<JobGenerationResponse> {
  // Try to initialize OpenAI with provided API key
  if (apiKey && !openai) {
    initializeOpenAI(apiKey);
  }
  
  // If OpenAI is not available, use template-based generation
  if (!openai) {
    return generateTemplateBasedJD(jobData);
  }

  try {
    const salaryInfo = jobData.salaryMin && jobData.salaryMax 
      ? `with salary range $${jobData.salaryMin.toLocaleString()} - $${jobData.salaryMax.toLocaleString()}`
      : jobData.salaryMin 
      ? `starting from $${jobData.salaryMin.toLocaleString()}`
      : jobData.salaryMax 
      ? `up to $${jobData.salaryMax.toLocaleString()}`
      : '';

    const prompt = `Create a professional job description for the following position:

Job Title: ${jobData.title}
Department: ${jobData.department}
Work Type: ${jobData.workType}
Experience Level: ${jobData.experienceLevel}
Required Skills: ${jobData.skills}
${jobData.location ? `Location: ${jobData.location}` : ''}
${salaryInfo}

Please generate:
1. A compelling job description (3-4 paragraphs)
2. Detailed requirements and qualifications
3. Benefits and what the company offers

Format the response as JSON with three fields: "description", "requirements", and "benefits".
Make it professional, engaging, and specific to the role and skills mentioned.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert HR professional and technical recruiter. Create compelling, professional job descriptions that attract top talent. Always respond with valid JSON containing description, requirements, and benefits fields."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const generatedContent = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      description: generatedContent.description || generateTemplateBasedJD(jobData).description,
      requirements: generatedContent.requirements || generateTemplateBasedJD(jobData).requirements,
      benefits: generatedContent.benefits || generateTemplateBasedJD(jobData).benefits,
    };

  } catch (error) {
    console.error("OpenAI generation failed, falling back to template:", error);
    return generateTemplateBasedJD(jobData);
  }
}

function generateTemplateBasedJD(jobData: JobGenerationRequest): JobGenerationResponse {
  const salaryRange = jobData.salaryMin && jobData.salaryMax 
    ? `$${jobData.salaryMin.toLocaleString()} - $${jobData.salaryMax.toLocaleString()}`
    : jobData.salaryMin 
    ? `Starting from $${jobData.salaryMin.toLocaleString()}`
    : jobData.salaryMax 
    ? `Up to $${jobData.salaryMax.toLocaleString()}`
    : 'Competitive salary';

  const description = `We are seeking a talented ${jobData.title} to join our ${jobData.department} team. This is a ${jobData.workType.toLowerCase()} position ideal for a ${jobData.experienceLevel.toLowerCase()} professional looking to make a significant impact.

**About the Role:**
As a ${jobData.title}, you will be responsible for driving key initiatives and contributing to our team's success. You'll work collaboratively with cross-functional teams to deliver high-quality solutions that meet our business objectives.

**Key Responsibilities:**
• Lead and execute projects related to ${jobData.department.toLowerCase()} operations
• Collaborate with team members to design and implement innovative solutions
• Participate in code reviews, planning sessions, and team meetings
• Contribute to best practices and process improvements
• Mentor junior team members and share knowledge across the organization

**What We Offer:**
• Competitive compensation package (${salaryRange})
• Flexible ${jobData.workType.toLowerCase()} work arrangement
• Professional development opportunities
• Collaborative and inclusive work environment`;

  const requirements = `**Required Qualifications:**
• ${jobData.experienceLevel} level experience in relevant field
• Strong proficiency in: ${jobData.skills}
• Excellent problem-solving and analytical skills
• Strong communication and collaboration abilities
• Ability to work independently and manage multiple priorities
• Bachelor's degree in relevant field or equivalent experience

**Preferred Qualifications:**
• Experience in ${jobData.department.toLowerCase()} domain
• Track record of successful project delivery
• Experience with agile development methodologies
• Strong attention to detail and quality standards`;

  const benefits = `**What We Offer:**
• Competitive salary and equity package (${salaryRange})
• Comprehensive health, dental, and vision insurance
• Flexible PTO and company holidays
• Professional development budget
• Modern office space and equipment
• Team building events and company outings
• Opportunity for career growth and advancement
• Collaborative and inclusive company culture
• ${jobData.workType} work flexibility
• Learning and development opportunities`;

  return { description, requirements, benefits };
}
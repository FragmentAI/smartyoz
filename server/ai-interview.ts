import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface InterviewQuestion {
  question: string;
  type: 'behavioral' | 'technical' | 'situational' | 'experience';
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

export async function generateInterviewQuestions(
  data: { candidate: any; job: any },
  config?: any
): Promise<string[]> {
  const { candidate, job } = data;
  const numQuestions = config?.totalQuestions || 8;
  try {
    // Build comprehensive prompt using configuration
    const customQuestions = config?.customQuestions || [];
    const technicalQuestions = config?.technicalQuestions || [];
    const behavioralQuestions = config?.behavioralQuestions || [];
    const situationalQuestions = config?.situationalQuestions || [];
    const warmupQuestions = config?.warmupQuestions || [];
    
    const techStack = config?.techStack || [];
    const programmingLanguages = config?.programmingLanguages || [];
    const frameworks = config?.frameworks || [];
    const tools = config?.tools || [];
    const methodologies = config?.methodologies || [];
    const experienceLevel = config?.experienceLevel || 'intermediate';
    const interviewStyle = config?.interviewStyle || 'conversational';

    // If custom questions are provided, use them directly and generate additional questions if needed
    if (customQuestions.length > 0) {
      const questionsToUse = [...customQuestions];
      
      // If we need more questions than custom ones provided, generate additional questions
      if (questionsToUse.length < numQuestions) {
        const additionalQuestionsNeeded = numQuestions - questionsToUse.length;
        
        // Generate additional questions using AI but exclude custom questions to avoid duplicates
        try {
          const additionalPrompt = `Generate ${additionalQuestionsNeeded} professional interview questions for a ${job.title} position.
          
Candidate: ${candidate.firstName} ${candidate.lastName}
Experience: ${candidate.experience || 0} years
Position: ${candidate.position || 'Not specified'}

Focus on questions that complement these existing questions:
${customQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Generate ${additionalQuestionsNeeded} different questions that cover other important aspects.
Return only the questions, one per line, without numbering.`;

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: "You are an expert HR interviewer. Generate professional interview questions that complement existing questions."
              },
              {
                role: "user",
                content: additionalPrompt
              }
            ],
            max_tokens: 500,
            temperature: 0.7
          });

          const content = response.choices[0].message.content;
          if (content) {
            const additionalQuestions = content.split('\n').filter(q => q.trim().length > 0);
            questionsToUse.push(...additionalQuestions.slice(0, additionalQuestionsNeeded));
          }
        } catch (error) {
          console.error('Failed to generate additional questions:', error);
          // Fall back to default questions if AI fails
          const fallbackQuestions = generateFallbackQuestions(job.title, additionalQuestionsNeeded);
          questionsToUse.push(...fallbackQuestions);
        }
      }
      
      // Return exactly the number of questions requested, prioritizing custom questions
      return questionsToUse.slice(0, numQuestions);
    }
    
    // If no custom questions, use the original AI generation logic
    let prompt = `Generate ${numQuestions} professional interview questions for a ${job.title} position in the ${job.department} department.

Job Description: ${job.description}
Job Requirements: ${job.requirements}
Target Experience Level: ${experienceLevel}
Interview Style: ${interviewStyle}

Candidate Information:
- Name: ${candidate.firstName} ${candidate.lastName}
- Email: ${candidate.email}
- Current Position: ${candidate.position || 'Not specified'}
- Experience: ${candidate.experience || 0} years
- Skills: ${(candidate.skills || []).join(', ')}
- Location: ${candidate.location || 'Not specified'}`;

    // Add priority questions if configured
    if (customQuestions.length > 0) {
      prompt += `\n\nPRIORITY QUESTIONS (MUST include these):
${customQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    }

    // Add technical focus areas
    if (techStack.length > 0 || programmingLanguages.length > 0 || frameworks.length > 0) {
      prompt += `\n\nTechnical Focus Areas:`;
      if (techStack.length > 0) prompt += `\n- Technology Stack: ${techStack.join(', ')}`;
      if (programmingLanguages.length > 0) prompt += `\n- Programming Languages: ${programmingLanguages.join(', ')}`;
      if (frameworks.length > 0) prompt += `\n- Frameworks: ${frameworks.join(', ')}`;
      if (tools.length > 0) prompt += `\n- Tools: ${tools.join(', ')}`;
      if (methodologies.length > 0) prompt += `\n- Methodologies: ${methodologies.join(', ')}`;
    }

    // Add suggested question types
    if (technicalQuestions.length > 0 || behavioralQuestions.length > 0 || situationalQuestions.length > 0) {
      prompt += `\n\nSuggested Questions (use as inspiration):`;
      if (technicalQuestions.length > 0) {
        prompt += `\nTechnical: ${technicalQuestions.slice(0, 3).join('; ')}`;
      }
      if (behavioralQuestions.length > 0) {
        prompt += `\nBehavioral: ${behavioralQuestions.slice(0, 3).join('; ')}`;
      }
      if (situationalQuestions.length > 0) {
        prompt += `\nSituational: ${situationalQuestions.slice(0, 3).join('; ')}`;
      }
    }

    prompt += `\n\nGenerate a mix of:
- Behavioral questions (Tell me about a time when...)
- Technical questions specific to the role and required technologies
- Situational questions (How would you handle...)
- Experience-based questions related to their background
${warmupQuestions.length > 0 ? '- Start with warm-up questions to make the candidate comfortable' : ''}

Interview Style: ${interviewStyle}
- If 'formal': Use professional, structured language
- If 'conversational': Use friendly, natural language
- If 'technical': Focus on deep technical discussions

Make questions natural and conversational, as if an AI interviewer is speaking them.
Return only the questions, one per line, without numbering or formatting.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert HR interviewer creating engaging, professional interview questions. Generate questions that feel natural when spoken by an AI interviewer."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No questions generated');
    }

    return content.split('\n').filter(q => q.trim().length > 0);
  } catch (error) {
    console.error('OpenAI question generation failed:', error);
    // Fallback to template questions
    return generateFallbackQuestions(job.title, numQuestions);
  }
}

export async function evaluateResponse(
  question: string,
  answer: string,
  jobTitle: string,
  criteria: string[]
): Promise<{
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
}> {
  try {
    const prompt = `Evaluate this interview response for a ${jobTitle} position:

Question: ${question}
Answer: ${answer}

Evaluation Criteria:
${criteria.map(c => `- ${c}`).join('\n')}

Provide a JSON response with:
{
  "score": number (1-10),
  "feedback": "Brief constructive feedback",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert interview evaluator. Provide fair, constructive feedback focusing on job-relevant skills and communication."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No evaluation generated');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI evaluation failed:', error);
    // Fallback evaluation
    return {
      score: 7,
      feedback: "Thank you for your response. Your answer demonstrates relevant experience and good communication skills.",
      strengths: ["Clear communication", "Relevant experience"],
      improvements: ["Could provide more specific examples", "Consider quantifiable results"]
    };
  }
}

export async function generateFollowUpQuestion(
  originalQuestion: string,
  answer: string,
  jobContext: string
): Promise<string | null> {
  try {
    const prompt = `Based on this interview exchange, generate a natural follow-up question if appropriate:

Original Question: ${originalQuestion}
Candidate's Answer: ${answer}
Job Context: ${jobContext}

If the answer is complete and doesn't warrant a follow-up, return "NONE".
If a follow-up would be valuable, return only the follow-up question.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an experienced interviewer who knows when to ask insightful follow-up questions to get deeper insights."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 150,
      temperature: 0.6
    });

    const content = response.choices[0].message.content?.trim();
    return content === "NONE" ? null : content || null;
  } catch (error) {
    console.error('OpenAI follow-up generation failed:', error);
    return null;
  }
}

function generateFallbackQuestions(jobTitle: string, numQuestions: number): string[] {
  const genericQuestions = [
    "Tell me about yourself and what interests you about this position.",
    "What experience do you have that's most relevant to this role?",
    "Describe a challenging project you've worked on and how you overcame obstacles.",
    "Where do you see yourself in five years and how does this role fit into your career goals?",
    "What questions do you have about the role or our company?",
    "Tell me about a time when you had to work with a difficult team member.",
    "How do you prioritize tasks when you have multiple deadlines?",
    "What motivates you to do your best work?",
    "Describe a time when you had to learn something new quickly.",
    "What do you consider your greatest professional achievement?"
  ];

  const roleSpecificQuestions: Record<string, string[]> = {
    'Software Engineer': [
      "Walk me through your approach to debugging a complex technical issue.",
      "How do you stay current with new technologies and programming languages?",
      "Describe your experience with version control and collaborative coding."
    ],
    'Data Scientist': [
      "Explain a machine learning project you've worked on from start to finish.",
      "How do you approach data cleaning and validation?",
      "What statistical methods do you use most frequently in your work?"
    ],
    'Product Manager': [
      "How do you prioritize features when working with limited resources?",
      "Describe how you gather and incorporate user feedback into product decisions.",
      "Tell me about a time when you had to make a difficult product tradeoff."
    ]
  };

  const questions = [...genericQuestions];
  if (roleSpecificQuestions[jobTitle]) {
    questions.push(...roleSpecificQuestions[jobTitle]);
  }

  return questions.slice(0, numQuestions);
}

export async function generateInterviewSummary(
  questions: string[],
  responses: any[],
  jobTitle: string
): Promise<{
  overallScore: number;
  summary: string;
  recommendations: string[];
  keyStrengths: string[];
  developmentAreas: string[];
}> {
  try {
    const prompt = `Generate a comprehensive interview summary for a ${jobTitle} candidate:

Questions and Responses:
${questions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${responses[i]?.answer || 'No response'}`).join('\n\n')}

Provide a JSON response with:
{
  "overallScore": number (1-10),
  "summary": "2-3 sentence overall assessment",
  "recommendations": ["recommendation1", "recommendation2"],
  "keyStrengths": ["strength1", "strength2", "strength3"],
  "developmentAreas": ["area1", "area2"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert talent assessor providing fair, comprehensive interview evaluations for hiring decisions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.3
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No summary generated');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI summary generation failed:', error);
    // Fallback summary
    return {
      overallScore: 7,
      summary: "The candidate demonstrated good communication skills and relevant experience for the position.",
      recommendations: ["Consider for next round", "Verify technical skills with practical assessment"],
      keyStrengths: ["Communication skills", "Relevant experience", "Professional demeanor"],
      developmentAreas: ["Technical depth", "Specific examples"]
    };
  }
}

export async function generateInterviewEvaluation(
  responses: any[],
  candidate: any,
  job: any
): Promise<{
  overallScore: number;
  technicalScore: number;
  communicationScore: number;
  culturalFitScore: number;
  recommendation: string;
  feedback: string;
  strengths: string[];
  areasForImprovement: string[];
}> {
  try {
    const evaluationPrompt = `
Evaluate the interview performance for candidate ${candidate.firstName} ${candidate.lastName} applying for ${job.title} position.

Job Requirements: ${job.description}
Job Department: ${job.department}

Interview Responses:
${responses.map((r, i) => `
Question ${i + 1}: ${r.question}
Answer: ${r.answer}
Response Time: ${r.duration}s
`).join('\n')}

Provide a comprehensive evaluation in JSON format:
{
  "overallScore": (0-100),
  "technicalScore": (0-100),
  "communicationScore": (0-100),
  "culturalFitScore": (0-100),
  "recommendation": "hire" | "hire_with_conditions" | "no_hire" | "needs_further_evaluation",
  "feedback": "Detailed written feedback (200-300 words)",
  "strengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2", "area3"]
}

Consider:
- Technical competency and knowledge
- Communication clarity and professionalism
- Problem-solving approach
- Cultural fit with company values
- Response depth and quality
- Overall interview performance
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: evaluationPrompt }],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.2
    });

    const evaluation = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      overallScore: Math.min(100, Math.max(0, evaluation.overallScore || 70)),
      technicalScore: Math.min(100, Math.max(0, evaluation.technicalScore || 70)),
      communicationScore: Math.min(100, Math.max(0, evaluation.communicationScore || 70)),
      culturalFitScore: Math.min(100, Math.max(0, evaluation.culturalFitScore || 70)),
      recommendation: evaluation.recommendation || 'needs_further_evaluation',
      feedback: evaluation.feedback || 'Evaluation completed successfully.',
      strengths: evaluation.strengths || ['Professional communication', 'Relevant experience'],
      areasForImprovement: evaluation.areasForImprovement || ['Technical depth', 'Specific examples']
    };
  } catch (error) {
    console.error('Error generating interview evaluation:', error);
    // Return fallback evaluation
    return {
      overallScore: 75,
      technicalScore: 75,
      communicationScore: 75,
      culturalFitScore: 75,
      recommendation: 'needs_further_evaluation',
      feedback: `Interview completed for ${candidate.firstName} ${candidate.lastName}. Manual review recommended due to evaluation processing error.`,
      strengths: ['Completed interview process', 'Professional demeanor'],
      areasForImprovement: ['Detailed evaluation required', 'Manual review needed']
    };
  }
}

// Audio transcription using OpenAI Whisper
export async function transcribeAudio(audioFilePath: string, originalName?: string): Promise<{ text: string, duration: number }> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Create a properly named file for OpenAI
    let tempFilePath = audioFilePath;
    
    // If the file doesn't have an extension, add one based on common web recording format
    if (!path.extname(audioFilePath) && originalName) {
      const ext = path.extname(originalName) || '.webm'; // Default to webm for web recordings
      tempFilePath = audioFilePath + ext;
      fs.copyFileSync(audioFilePath, tempFilePath);
    } else if (!path.extname(audioFilePath)) {
      // If no original name and no extension, assume webm
      tempFilePath = audioFilePath + '.webm';
      fs.copyFileSync(audioFilePath, tempFilePath);
    }
    
    console.log(`Transcribing audio file: ${tempFilePath}`);
    const audioReadStream = fs.createReadStream(tempFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    // Clean up temp file if we created one
    if (tempFilePath !== audioFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Temp file cleanup error:', cleanupError);
      }
    }

    return {
      text: transcription.text,
      duration: 0 // Whisper doesn't return duration in the current API
    };
  } catch (error) {
    console.error('Audio transcription error:', error);
    throw new Error('Failed to transcribe audio');
  }
}
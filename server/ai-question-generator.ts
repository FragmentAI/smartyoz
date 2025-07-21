import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface QuestionGenerationRequest {
  testRound: number; // 1 for aptitude, 2 for technical
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  jobTitle?: string;
  jobDescription?: string;
  count: number;
  topics?: string[];
}

export interface GeneratedQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
}

export async function generateMCPQuestions(
  request: QuestionGenerationRequest
): Promise<GeneratedQuestion[]> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const prompt = buildQuestionPrompt(request);
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert test creator specializing in ${request.testRound === 1 ? 'aptitude and general intelligence' : 'technical assessment'} questions. Create high-quality multiple choice questions that are fair, unbiased, and accurately assess the required skills.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 3000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result.questions || !Array.isArray(result.questions)) {
      throw new Error("Invalid response format from AI");
    }

    return result.questions.map((q: any) => ({
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      difficulty: request.difficulty,
      category: request.category,
      tags: q.tags || []
    }));

  } catch (error) {
    console.error('Error generating questions:', error);
    
    // Fallback to template-based generation
    return generateFallbackQuestions(request);
  }
}

function buildQuestionPrompt(request: QuestionGenerationRequest): string {
  const { testRound, category, difficulty, jobTitle, jobDescription, count, topics } = request;
  
  let prompt = '';
  
  if (testRound === 1) {
    // Aptitude & General Intelligence Questions
    prompt = `Create ${count} ${difficulty} level aptitude and general intelligence multiple choice questions.

Focus areas:
- Logical reasoning and pattern recognition
- Numerical ability and basic mathematics
- Verbal reasoning and comprehension
- Abstract thinking and problem solving
- Spatial reasoning and visual perception
- General knowledge and current affairs

${topics && topics.length > 0 ? `Specific topics to include: ${topics.join(', ')}` : ''}

Requirements:
- Each question should have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Questions should be clear and unambiguous
- Avoid cultural bias or region-specific knowledge
- Include brief explanation for the correct answer
- Difficulty level: ${difficulty}`;

  } else {
    // Technical Assessment Questions
    prompt = `Create ${count} ${difficulty} level technical assessment multiple choice questions.

${jobTitle ? `Job Role: ${jobTitle}` : ''}
${jobDescription ? `Job Description: ${jobDescription}` : ''}

Focus areas for technical questions:
- Programming concepts and algorithms
- System design and architecture
- Database management and SQL
- Software development best practices
- Problem-solving and debugging
- Technology-specific knowledge
- Industry standards and methodologies

${topics && topics.length > 0 ? `Specific technical topics: ${topics.join(', ')}` : ''}

Requirements:
- Each question should have exactly 4 options (A, B, C, D)
- Only one correct answer per question
- Questions should test practical knowledge
- Include code snippets where appropriate
- Focus on concepts relevant to the job role
- Include brief technical explanation
- Difficulty level: ${difficulty}`;
  }

  prompt += `

Return the response in this exact JSON format:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation of why this is correct",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Generate exactly ${count} questions.`;

  return prompt;
}

function generateFallbackQuestions(request: QuestionGenerationRequest): GeneratedQuestion[] {
  // Fallback template-based questions when AI is unavailable
  const fallbackQuestions: GeneratedQuestion[] = [];
  
  if (request.testRound === 1) {
    // Aptitude questions
    for (let i = 0; i < request.count; i++) {
      fallbackQuestions.push({
        question: `Sample aptitude question ${i + 1}: What comes next in the sequence 2, 4, 8, 16, ?`,
        options: ["24", "28", "32", "30"],
        correctAnswer: 2,
        explanation: "This is a geometric sequence where each number is doubled (2×2=4, 4×2=8, 8×2=16, 16×2=32)",
        difficulty: request.difficulty,
        category: request.category,
        tags: ["sequence", "pattern", "mathematics"]
      });
    }
  } else {
    // Technical questions
    for (let i = 0; i < request.count; i++) {
      fallbackQuestions.push({
        question: `Sample technical question ${i + 1}: Which of the following is a programming paradigm?`,
        options: ["Object-Oriented", "Database", "Network", "Hardware"],
        correctAnswer: 0,
        explanation: "Object-Oriented Programming (OOP) is a programming paradigm based on objects and classes",
        difficulty: request.difficulty,
        category: request.category,
        tags: ["programming", "paradigm", "oop"]
      });
    }
  }
  
  return fallbackQuestions.slice(0, request.count);
}

// Generate questions for specific job roles with optimized prompts
export async function generateJobSpecificQuestions(
  jobTitle: string,
  jobDescription: string,
  testRound: number,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number
): Promise<GeneratedQuestion[]> {
  
  const category = testRound === 1 ? 'aptitude' : 'technical';
  
  return generateMCPQuestions({
    testRound,
    category,
    difficulty,
    jobTitle,
    jobDescription,
    count
  });
}

// Bulk generate questions with different difficulty levels
export async function generateBulkQuestions(
  testRound: number,
  category: string,
  jobTitle?: string
): Promise<GeneratedQuestion[]> {
  
  const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard'];
  const allQuestions: GeneratedQuestion[] = [];
  
  for (const difficulty of difficulties) {
    try {
      const questions = await generateMCPQuestions({
        testRound,
        category,
        difficulty,
        jobTitle,
        count: 5 // 5 questions per difficulty level
      });
      allQuestions.push(...questions);
    } catch (error) {
      console.error(`Error generating ${difficulty} questions:`, error);
    }
  }
  
  return allQuestions;
}
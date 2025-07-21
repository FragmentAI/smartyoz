import OpenAI from "openai";

interface MatchingResult {
  matchingScore: number;
  skillsMatch: number;
  experienceMatch: number;
  analysis: string;
}

interface CandidateProfile {
  skills: string[];
  experience: number;
  position?: string;
  resumeText?: string;
}

interface JobRequirements {
  title: string;
  description: string;
  requirements: string;
  skills: string;
  experienceLevel: string;
}

export async function calculateResumeJobMatch(
  candidate: CandidateProfile,
  job: JobRequirements,
  apiKey?: string
): Promise<MatchingResult> {
  // If no API key, use rule-based matching
  if (!apiKey) {
    return calculateRuleBasedMatch(candidate, job);
  }

  try {
    const openai = new OpenAI({ apiKey });
    
    const prompt = `Analyze how well this candidate matches the job requirements and provide a detailed scoring:

CANDIDATE PROFILE:
- Skills: ${candidate.skills.join(', ')}
- Experience: ${candidate.experience} years
- Current Position: ${candidate.position || 'Not specified'}
${candidate.resumeText ? `- Resume Content: ${candidate.resumeText.substring(0, 2000)}` : ''}

JOB REQUIREMENTS:
- Title: ${job.title}
- Required Skills: ${job.skills}
- Experience Level: ${job.experienceLevel}
- Description: ${job.description.substring(0, 1000)}
- Requirements: ${job.requirements.substring(0, 1000)}

Please analyze and return ONLY a JSON response with this exact structure:
{
  "matchingScore": <overall_score_0_to_100>,
  "skillsMatch": <skills_matching_percentage_0_to_100>,
  "experienceMatch": <experience_level_match_0_to_100>,
  "analysis": "<brief_explanation_of_scoring>"
}

Consider:
- Technical skills alignment
- Experience level appropriateness
- Domain knowledge relevance
- Career progression fit`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the JSON response with error handling
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }
    
    return {
      matchingScore: Math.max(0, Math.min(100, result.matchingScore || 0)),
      skillsMatch: Math.max(0, Math.min(100, result.skillsMatch || 0)),
      experienceMatch: Math.max(0, Math.min(100, result.experienceMatch || 0)),
      analysis: result.analysis || 'AI analysis completed'
    };

  } catch (error) {
    console.error("Error with AI matching:", error);
    // Fallback to rule-based matching
    return calculateRuleBasedMatch(candidate, job);
  }
}

function calculateRuleBasedMatch(
  candidate: CandidateProfile,
  job: JobRequirements
): MatchingResult {
  // Parse job skills
  const jobSkills = (job.skills || '').toLowerCase().split(/[,;]/).map(s => s.trim()).filter(s => s);
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase().trim());
  
  // Calculate skills match
  const matchingSkills = jobSkills.filter(jobSkill => 
    candidateSkills.some(candidateSkill => 
      candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
    )
  );
  const skillsMatch = jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) * 100 : 0;
  
  // Calculate experience match
  const experienceLevel = (job.experienceLevel || 'mid').toLowerCase();
  let requiredYears = 0;
  let maxYears = 15;
  
  if (experienceLevel.includes('entry') || experienceLevel.includes('junior')) {
    requiredYears = 0;
    maxYears = 2;
  } else if (experienceLevel.includes('mid')) {
    requiredYears = 2;
    maxYears = 5;
  } else if (experienceLevel.includes('senior')) {
    requiredYears = 5;
    maxYears = 10;
  } else if (experienceLevel.includes('lead') || experienceLevel.includes('principal')) {
    requiredYears = 8;
    maxYears = 20;
  }
  
  let experienceMatch = 0;
  if (candidate.experience >= requiredYears && candidate.experience <= maxYears) {
    experienceMatch = 100;
  } else if (candidate.experience < requiredYears) {
    experienceMatch = Math.max(0, (candidate.experience / requiredYears) * 80);
  } else {
    // Over-qualified but still good
    experienceMatch = Math.max(60, 100 - ((candidate.experience - maxYears) * 5));
  }
  
  // Calculate overall match (weighted average)
  const matchingScore = Math.round((skillsMatch * 0.6) + (experienceMatch * 0.4));
  
  return {
    matchingScore,
    skillsMatch: Math.round(skillsMatch),
    experienceMatch: Math.round(experienceMatch),
    analysis: `Rule-based matching: ${matchingSkills.length}/${jobSkills.length} skills matched, ${candidate.experience}yr experience vs ${experienceLevel} requirement`
  };
}
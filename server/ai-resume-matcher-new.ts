import Anthropic from "@anthropic-ai/sdk";

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
  console.log('🎯 Starting Resume-Job Matching with Claude AI');
  console.log('📋 Candidate Profile:', {
    skills: candidate.skills,
    experience: candidate.experience,
    position: candidate.position,
    resumeTextLength: candidate.resumeText?.length || 0
  });
  console.log('💼 Job Requirements:', {
    title: job.title,
    experienceLevel: job.experienceLevel,
    skills: job.skills,
    requirementsLength: job.requirements?.length || 0
  });

  // Require Claude API key - no fallback to rule-based
  if (!apiKey) {
    console.error('❌ No Claude API key provided - cannot calculate match score');
    throw new Error('Claude API key required for match calculation. Please configure your Claude API key in organization settings.');
  }

  try {
    console.log('🤖 Using Claude AI for intelligent matching analysis');
    const claude = new Anthropic({ apiKey });
    
    const prompt = `Analyze how well this candidate matches the job requirements and provide a detailed scoring:

CANDIDATE PROFILE:
- Skills: ${candidate.skills.join(', ')}
- Experience: ${candidate.experience} years
- Current Position: ${candidate.position || 'Not specified'}
${candidate.resumeText ? `- Resume Content: ${candidate.resumeText.substring(0, 3000)}` : '- No resume content available'}

JOB REQUIREMENTS:
- Title: ${job.title}
- Required Skills: ${job.skills}
- Experience Level: ${job.experienceLevel}
- Description: ${job.description.substring(0, 1500)}
- Requirements: ${job.requirements.substring(0, 1500)}

Please analyze and return ONLY a JSON response with this exact structure:
{
  "matchingScore": <overall_score_0_to_100>,
  "skillsMatch": <skills_matching_percentage_0_to_100>,
  "experienceMatch": <experience_level_match_0_to_100>,
  "analysis": "<brief_explanation_of_scoring_mentioning_key_matches_and_gaps>"
}

Consider:
- Technical skills alignment (exact matches and transferable skills)
- Experience level appropriateness (not just years, but relevance)
- Domain knowledge and industry fit
- Career progression and role suitability
- Resume content analysis for additional insights
- Soft skills and cultural fit indicators`;

    console.log('📤 Sending request to Claude API...');
    console.log('📝 Prompt details:', {
      promptLength: prompt.length,
      includesResumeText: !!candidate.resumeText,
      candidateSkillsCount: candidate.skills.length
    });

    const response = await claude.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2, // Lower temperature for more consistent scoring
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : null;
    console.log('📥 Received Claude API response:', {
      hasContent: !!content,
      responseLength: content?.length || 0,
      responsePreview: content?.substring(0, 200) + '...' || 'No content'
    });

    if (!content) {
      throw new Error('No content received from Claude');
    }

    // Parse the JSON response with error handling
    let result;
    try {
      console.log('🔍 Attempting to parse Claude response as JSON...');
      // Try to extract JSON if it's wrapped in other text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : content;
      result = JSON.parse(jsonText);
      console.log('✅ Successfully parsed Claude response:', result);
    } catch (parseError: any) {
      console.error('❌ Failed to parse Claude response as JSON:', content);
      throw new Error(`Invalid JSON response from Claude: ${parseError.message}`);
    }
    
    // Validate and sanitize the result
    const finalResult = {
      matchingScore: Math.max(0, Math.min(100, parseInt(result.matchingScore) || 0)),
      skillsMatch: Math.max(0, Math.min(100, parseInt(result.skillsMatch) || 0)),
      experienceMatch: Math.max(0, Math.min(100, parseInt(result.experienceMatch) || 0)),
      analysis: result.analysis || 'AI analysis completed successfully'
    };

    console.log('🎯 Final Claude AI matching result:', finalResult);
    return finalResult;

  } catch (error: any) {
    console.error("❌ Error with Claude AI matching:", error);
    throw new Error(`Claude AI matching failed: ${error.message}. Please check your Claude API key in settings.`);
  }
}

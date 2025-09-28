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
  console.log('🎯 Starting Resume-Job Matching Process');
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

  // Always try to use Claude AI first
  if (apiKey) {
    try {
      console.log('🤖 Using Claude AI for matching analysis');
      const claude = new Anthropic({ apiKey });
      
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
- Career progression fit
- Resume content analysis`;

      console.log('📤 Sending request to Claude API...');
      console.log('📝 Prompt sent to Claude:', {
        promptLength: prompt.length,
        previewPrompt: prompt.substring(0, 500) + '...'
      });

      const response = await claude.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : null;
      console.log('📥 Received Claude API response:', {
        hasContent: !!content,
        responseLength: content?.length || 0,
        responsePreview: content?.substring(0, 300) + '...' || 'No content'
      });

      if (!content) {
        throw new Error('No content received from Claude');
      }

      // Parse the JSON response with error handling
      let result;
      try {
        console.log('🔍 Attempting to parse Claude response as JSON...');
        result = JSON.parse(content);
        console.log('✅ Successfully parsed Claude response:', result);
      } catch (parseError) {
        console.error('❌ Failed to parse Claude response as JSON:', content);
        throw new Error('Invalid JSON response from Claude');
      }
      
      const finalResult = {
        matchingScore: Math.max(0, Math.min(100, result.matchingScore || 0)),
        skillsMatch: Math.max(0, Math.min(100, result.skillsMatch || 0)),
        experienceMatch: Math.max(0, Math.min(100, result.experienceMatch || 0)),
        analysis: result.analysis || 'AI analysis completed'
      };

      console.log('🎯 Final Claude AI matching result:', finalResult);
      return finalResult;

    } catch (error: any) {
      console.error("❌ Error with Claude AI matching:", error);
      // Don't fallback, throw the error so user knows API key is needed
      throw new Error(`Claude AI matching failed: ${error.message}. Please check your Claude API key in settings.`);
    }
  } else {
    // No API key provided
    console.error('❌ No Claude API key provided - cannot calculate match score');
    throw new Error('Claude API key required for match calculation. Please configure your Claude API key in organization settings.');
  }
}
}

function calculateRuleBasedMatch(
  candidate: CandidateProfile,
  job: JobRequirements
): MatchingResult {
  console.log('\n🔧 RULE-BASED MATCHING CALCULATION START');
  console.log('====================================');
  
  // Parse job skills
  const jobSkills = (job.skills || '').toLowerCase().split(/[,;]/).map(s => s.trim()).filter(s => s);
  const candidateSkills = (candidate.skills || []).map(s => s.toLowerCase().trim());
  
  // Also search for skills in resume text if available
  const resumeText = (candidate.resumeText || '').toLowerCase();
  const skillsFoundInResume: string[] = [];
  
  if (resumeText) {
    jobSkills.forEach(jobSkill => {
      if (resumeText.includes(jobSkill)) {
        skillsFoundInResume.push(jobSkill);
      }
    });
  }
  
  console.log('📊 SKILLS MATCHING ANALYSIS:');
  console.log('🎯 Candidate Listed Skills:', candidateSkills);
  console.log('� Skills Found in Resume Text:', skillsFoundInResume);
  console.log('�📝 Required Job Skills:', jobSkills);
  console.log('📄 Resume Text Available:', !!resumeText, resumeText ? `(${resumeText.length} chars)` : '');
  
  // Calculate skills match
  const matchingSkills = jobSkills.filter(jobSkill => {
    // Check in candidate's listed skills
    const skillsMatch = candidateSkills.some(candidateSkill => 
      candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
    );
    
    // Check in resume text
    const resumeMatch = skillsFoundInResume.includes(jobSkill);
    
    const anyMatch = skillsMatch || resumeMatch;
    
    if (anyMatch) {
      if (skillsMatch) {
        const matchedCandidateSkill = candidateSkills.find(candidateSkill => 
          candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)
        );
        console.log(`✅ Skills Match: "${jobSkill}" matches listed skill "${matchedCandidateSkill}"`);
      } else if (resumeMatch) {
        console.log(`✅ Resume Match: "${jobSkill}" found in resume text`);
      }
    } else {
      console.log(`❌ No match for: "${jobSkill}" (not in skills list or resume)`);
    }
    return anyMatch;
  });
  
  const skillsMatch = jobSkills.length > 0 ? (matchingSkills.length / jobSkills.length) * 100 : 0;
  
  console.log(`📈 Skills Match Calculation:`);
  console.log(`   - Matching skills: ${matchingSkills.length}/${jobSkills.length}`);
  console.log(`   - Skills Match Score: ${skillsMatch.toFixed(1)}%`);
  console.log(`   - Matched skills: [${matchingSkills.join(', ')}]`);
  
  // Calculate experience match
  console.log('\n🎓 EXPERIENCE MATCHING ANALYSIS:');
  const experienceLevel = (job.experienceLevel || 'mid').toLowerCase();
  const candidateExp = candidate.experience || 0;
  let requiredYears = 0;
  let maxYears = 15;
  
  console.log(`👤 Candidate Experience: ${candidateExp} years`);
  console.log(`💼 Job Experience Level: ${experienceLevel}`);
  
  if (experienceLevel.includes('entry') || experienceLevel.includes('junior')) {
    requiredYears = 0;
    maxYears = 2;
    console.log(`📋 Entry Level Range: ${requiredYears}-${maxYears} years`);
  } else if (experienceLevel.includes('mid')) {
    requiredYears = 2;
    maxYears = 5;
    console.log(`📋 Mid Level Range: ${requiredYears}-${maxYears} years`);
  } else if (experienceLevel.includes('senior')) {
    requiredYears = 5;
    maxYears = 10;
    console.log(`📋 Senior Level Range: ${requiredYears}-${maxYears} years`);
  } else if (experienceLevel.includes('lead') || experienceLevel.includes('principal')) {
    requiredYears = 8;
    maxYears = 20;
    console.log(`📋 Leadership Level Range: ${requiredYears}-${maxYears} years`);
  }
  
  let experienceMatch = 0;
  let experienceAnalysis = '';
  
  if (candidateExp >= requiredYears && candidateExp <= maxYears) {
    experienceMatch = 100;
    experienceAnalysis = `Perfect fit within ${requiredYears}-${maxYears} year range`;
  } else if (candidateExp < requiredYears) {
    experienceMatch = Math.max(0, (candidateExp / requiredYears) * 80);
    experienceAnalysis = `Under-qualified: ${candidateExp}yr vs ${requiredYears}yr minimum (${experienceMatch.toFixed(1)}% match)`;
  } else {
    // Over-qualified but still good
    experienceMatch = Math.max(60, 100 - ((candidateExp - maxYears) * 5));
    experienceAnalysis = `Over-qualified: ${candidateExp}yr vs ${maxYears}yr max (${experienceMatch.toFixed(1)}% match)`;
  }
  
  console.log(`📊 Experience Match Calculation:`);
  console.log(`   - Analysis: ${experienceAnalysis}`);
  console.log(`   - Experience Match Score: ${experienceMatch.toFixed(1)}%`);
  
  // Calculate overall match (weighted average)
  console.log('\n🏆 OVERALL SCORE CALCULATION:');
  console.log(`📊 Weighting: Skills (60%) + Experience (40%)`);
  console.log(`   - Skills Score: ${skillsMatch.toFixed(1)}% × 0.6 = ${(skillsMatch * 0.6).toFixed(1)}`);
  console.log(`   - Experience Score: ${experienceMatch.toFixed(1)}% × 0.4 = ${(experienceMatch * 0.4).toFixed(1)}`);
  
  const matchingScore = Math.round((skillsMatch * 0.6) + (experienceMatch * 0.4));
  console.log(`   - Final Score: ${matchingScore}%`);
  
  const detailedAnalysis = [
    `Rule-based matching completed`,
    `Skills: ${matchingSkills.length}/${jobSkills.length} matched (${Math.round(skillsMatch)}%)`,
    `Experience: ${candidateExp}yr vs ${experienceLevel} requirement (${Math.round(experienceMatch)}%)`,
    `Overall: ${matchingScore}% (Skills 60% + Experience 40%)`,
    experienceAnalysis
  ].join('. ');

  const result = {
    matchingScore,
    skillsMatch: Math.round(skillsMatch),
    experienceMatch: Math.round(experienceMatch),
    analysis: detailedAnalysis
  };

  console.log('🎯 FINAL RULE-BASED RESULT:', result);
  console.log('====================================');
  console.log('RULE-BASED MATCHING CALCULATION END\n');
  
  return result;
}
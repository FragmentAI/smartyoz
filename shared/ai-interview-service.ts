// AI Interview System Integration Service
export interface AIInterviewSubmissionData {
  email: string;
  resume: string;
  jobDescription: string;
  candidateName: string;
  positionName: string;
}

export interface AIInterviewResponse {
  success: boolean;
  loginUrl?: string;
  error?: string;
}

export class AIInterviewService {
  private static readonly API_BASE_URL = 'https://ai-interview-36q0.onrender.com/api/ai-interview';
  
  /**
   * Submit candidate data to external AI Interview system
   */
  static async submitCandidateData(data: AIInterviewSubmissionData): Promise<AIInterviewResponse> {
    try {
      console.log('🚀 Submitting candidate data to AI Interview system:', {
        email: data.email,
        candidateName: data.candidateName,
        positionName: data.positionName,
        resumeLength: data.resume.length,
        jobDescriptionLength: data.jobDescription.length
      });

      const response = await fetch(`${this.API_BASE_URL}/submit-external-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
      }

      const result: AIInterviewResponse = await response.json();
      
      console.log('✅ AI Interview system response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'AI Interview system returned unsuccessful response');
      }

      if (!result.loginUrl) {
        throw new Error('AI Interview system did not return a login URL');
      }

      return result;
    } catch (error) {
      console.error('❌ Failed to submit to AI Interview system:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Launch AI interview in new window
   */
  static launchInterview(loginUrl: string): void {
    console.log('🎯 Launching AI interview session:', loginUrl);
    
    // Open in new window with specific dimensions and features
    const windowFeatures = 'width=1200,height=800,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no,status=no';
    const newWindow = window.open(loginUrl, '_blank', windowFeatures);
    
    if (!newWindow) {
      // Fallback if popup was blocked
      console.warn('⚠️ Popup blocked, falling back to same window');
      window.open(loginUrl, '_blank');
    }
  }

  /**
   * Validate submission data before sending
   */
  static validateSubmissionData(data: AIInterviewSubmissionData): string[] {
    const errors: string[] = [];

    if (!data.email || !data.email.includes('@')) {
      errors.push('Valid email address is required');
    }

    if (!data.candidateName || data.candidateName.trim().length < 2) {
      errors.push('Candidate name is required');
    }

    if (!data.positionName || data.positionName.trim().length < 2) {
      errors.push('Position name is required');
    }

    if (!data.resume || data.resume.trim().length < 10) {
      errors.push('Resume content is required and must be substantial');
    }

    if (!data.jobDescription || data.jobDescription.trim().length < 10) {
      errors.push('Job description is required and must be substantial');
    }

    return errors;
  }
}

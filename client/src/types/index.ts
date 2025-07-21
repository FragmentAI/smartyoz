export interface DashboardMetrics {
  totalApplications: number;
  interviewsScheduled: number;
  qualifiedCandidates: number;
  avgTimeToHire: number;
}

export interface ActivityItem {
  id: string;
  type: 'interview_completed' | 'application_received' | 'bulk_processed' | 'interview_scheduled' | 'offer_declined';
  message: string;
  details: string;
  timestamp: string;
  color: string;
}

export interface ApplicationFunnelData {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

export interface JobWithStats {
  id: number;
  title: string;
  department: string;
  workType: string;
  status: string;
  positions: number;
  createdAt: string;
  applications: number;
  qualified: number;
}

export interface CandidateWithApplication {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  skills?: string[];
  experience?: number;
  createdAt: string;
  application?: {
    id: number;
    jobTitle: string;
    status: string;
    overallScore?: number;
    appliedAt: string;
  };
}

export interface InterviewWithDetails {
  id: number;
  type: string;
  scheduledAt: string;
  duration: number;
  format: string;
  status: string;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
  };
  job: {
    title: string;
  };
}

export interface EvaluationWithDetails {
  id: number;
  technicalScore?: number;
  communicationScore?: number;
  culturalFitScore?: number;
  overallScore?: number;
  recommendation: string;
  feedback?: string;
  createdAt: string;
  interview: {
    application: {
      candidate: {
        firstName: string;
        lastName: string;
        email: string;
      };
      job: {
        title: string;
      };
    };
  };
}

export interface BulkJobWithDetails {
  id: number;
  totalFiles: number;
  processedFiles: number;
  qualifiedCandidates: number;
  status: string;
  createdAt: string;
  job: {
    title: string;
  };
}

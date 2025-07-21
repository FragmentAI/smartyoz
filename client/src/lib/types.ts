// Re-export all types from shared schema
export * from '@shared/schema';

// Additional client-specific types can be added here
export interface PipelineStats {
  totalCandidates: number;
  inProgress: number;
  completed: number;
  offered: number;
  hired: number;
  rejected: number;
}

export interface InterviewSession {
  id: number;
  token: string;
  candidateName: string;
  jobTitle: string;
  jobDepartment: string;
  status: string;
  currentQuestion: number;
  totalQuestions: number;
  startedAt: Date | null;
  questions: any[];
  responses: any[];
}
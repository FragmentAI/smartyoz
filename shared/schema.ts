import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table - mandatory for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Jobs table
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  positions: integer("positions").notNull().default(1),
  workType: text("work_type").notNull(), // 'remote', 'onsite', 'hybrid'
  status: text("status").notNull().default("draft"), // 'draft', 'active', 'closed', 'dropped'
  dropReason: text("drop_reason"), // Comment when status is 'dropped'
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job Platform Configurations table
export const jobPlatformConfigs = pgTable("job_platform_configs", {
  id: serial("id").primaryKey(),
  platformName: text("platform_name").notNull(), // 'linkedin', 'naukri', 'indeed', 'glassdoor', etc.
  displayName: text("display_name").notNull(), // 'LinkedIn', 'Naukri.com', 'Indeed', etc.
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  additionalConfig: jsonb("additional_config"), // Platform-specific settings
  isActive: boolean("is_active").default(true),
  connectionStatus: text("connection_status").default("disconnected"), // 'connected', 'disconnected', 'error'
  lastSyncAt: timestamp("last_sync_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job Platform Postings table
export const jobPlatformPostings = pgTable("job_platform_postings", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  platformConfigId: integer("platform_config_id").notNull().references(() => jobPlatformConfigs.id),
  externalJobId: text("external_job_id"), // Platform's job ID
  postingUrl: text("posting_url"), // Direct URL to the job posting
  status: text("status").notNull().default("pending"), // 'pending', 'posted', 'failed', 'expired'
  customFields: jsonb("custom_fields"), // Platform-specific job details
  postingDate: timestamp("posting_date"),
  expiryDate: timestamp("expiry_date"),
  applicationsCount: integer("applications_count").default(0),
  lastSyncAt: timestamp("last_sync_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Platform Application Ingestion table
export const platformApplications = pgTable("platform_applications", {
  id: serial("id").primaryKey(),
  jobPlatformPostingId: integer("job_platform_posting_id").notNull().references(() => jobPlatformPostings.id),
  externalApplicationId: text("external_application_id").notNull(), // Platform's application ID
  candidateEmail: text("candidate_email").notNull(),
  candidateName: text("candidate_name").notNull(),
  resumeUrl: text("resume_url"),
  coverLetter: text("cover_letter"),
  applicationData: jsonb("application_data"), // Raw application data from platform
  candidateId: integer("candidate_id").references(() => candidates.id), // Linked after processing
  processingStatus: text("processing_status").default("pending"), // 'pending', 'processed', 'duplicate', 'error'
  appliedAt: timestamp("applied_at").notNull(),
  ingestedAt: timestamp("ingested_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  resumeUrl: text("resume_url"),
  resumeText: text("resume_text"), // Store extracted resume content as text
  skills: text("skills").array(),
  experience: integer("experience"), // years
  currentCTC: decimal("current_ctc"),
  expectedCTC: decimal("expected_ctc"),
  location: text("location"),
  locationPreference: text("location_preference"),
  position: text("position"),
  currentCtc: text("current_ctc_text"),
  expectedCtc: text("expected_ctc_text"),
  noticePeriod: text("notice_period"),
  willingToRelocate: boolean("willing_to_relocate"),
  screeningResponses: text("screening_responses"), // JSON string for screening answers
  selectedJobId: integer("selected_job_id").references(() => jobs.id),
  archived: boolean("archived").default(false), // For archived candidates
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Job Applications table
export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id),
  status: text("status").notNull().default("new"), // 'new', 'screening', 'qualified', 'interviewed', 'technical_round', 'final_round', 'offered', 'hired', 'rejected'
  resumeScore: integer("resume_score"), // 0-100
  jdMatchScore: integer("jd_match_score"), // 0-100
  overallScore: integer("overall_score"), // 0-100
  matchingScore: decimal("matching_score"), // Resume-to-JD matching score (0-100)
  skillsMatch: decimal("skills_match"), // Skills matching percentage
  experienceMatch: decimal("experience_match"), // Experience level match
  notes: text("notes"),
  appliedAt: timestamp("applied_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interview Rounds Configuration
export const interviewRounds = pgTable("interview_rounds", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  roundNumber: integer("round_number").notNull(),
  title: text("title").notNull(), // '1st Technical Round', 'Managerial Round', etc.
  type: text("type").notNull(), // 'technical', 'behavioral', 'managerial', 'hr', 'final'
  duration: integer("duration").notNull().default(60), // minutes
  format: text("format").notNull().default("video"), // 'video', 'phone', 'onsite'
  requiredScore: integer("required_score").default(70), // Minimum score to pass
  interviewerRole: text("interviewer_role"), // 'technical_lead', 'manager', 'hr', 'panel'
  interviewerId: varchar("interviewer_id").references(() => users.id), // Assigned interviewer
  questionTypes: text("question_types").array(), // Types of questions for this round
  evaluationCriteria: text("evaluation_criteria").array(), // What to evaluate
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Interviews table
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  roundId: integer("round_id").references(() => interviewRounds.id), // Link to round configuration
  type: text("type").notNull(), // 'screening', 'technical', 'hr', 'final', 'ai_video'
  roundNumber: integer("round_number").default(1), // Which round this is
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull().default(60), // minutes
  format: text("format").notNull(), // 'video', 'phone', 'onsite', 'ai_video'
  meetingUrl: text("meeting_url"),
  interviewerId: varchar("interviewer_id").references(() => users.id), // Who conducts the interview
  interviewerNotes: text("interviewer_notes"),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'in_progress', 'completed', 'cancelled', 'no_show'
  recordingUrl: text("recording_url"), // For AI video interviews
  transcript: text("transcript"), // AI interview transcript
  aiAnalysis: text("ai_analysis"), // AI analysis of the interview
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  currentQuestionIndex: integer("current_question_index").default(0),
  responses: text("responses"), // JSON string of responses
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Evaluations table
export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull().references(() => interviews.id),
  technicalScore: integer("technical_score"), // 0-100
  communicationScore: integer("communication_score"), // 0-100
  culturalFitScore: integer("cultural_fit_score"), // 0-100
  problemSolvingScore: integer("problem_solving_score"), // 0-100
  leadershipScore: integer("leadership_score"), // 0-100 (for managerial rounds)
  overallScore: integer("overall_score"), // 0-100
  recommendation: text("recommendation").notNull(), // 'hire', 'maybe', 'reject'
  feedback: text("feedback"),
  strengths: text("strengths").array(), // Key strengths identified
  improvements: text("improvements").array(), // Areas for improvement
  evaluatedBy: varchar("evaluated_by").references(() => users.id), // null for AI evaluations
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Offers table
export const jobOffers = pgTable("job_offers", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id),
  offerTitle: text("offer_title").notNull(),
  department: text("department").notNull(),
  baseSalary: decimal("base_salary").notNull(),
  currency: text("currency").default("USD"),
  bonusAmount: decimal("bonus_amount"),
  benefits: text("benefits").array(), // Health, dental, etc.
  startDate: timestamp("start_date"),
  workType: text("work_type").notNull(), // 'remote', 'onsite', 'hybrid'
  location: text("location"),
  offerLetterUrl: text("offer_letter_url"), // PDF document
  status: text("status").notNull().default("pending"), // 'pending', 'accepted', 'rejected', 'expired', 'withdrawn'
  negotiationNotes: text("negotiation_notes"),
  candidateCounterOffer: decimal("candidate_counter_offer"),
  finalSalary: decimal("final_salary"),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  expiredAt: timestamp("expired_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Decision Matrix for comparing candidates
export const decisionMatrix = pgTable("decision_matrix", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id),
  applicationId: integer("application_id").notNull().references(() => applications.id),
  overallScore: decimal("overall_score"), // Weighted average across all rounds
  technicalScore: decimal("technical_score"), // Average technical scores
  behavioralScore: decimal("behavioral_score"), // Average behavioral scores
  culturalFitScore: decimal("cultural_fit_score"), // Average cultural fit
  interviewsCompleted: integer("interviews_completed").default(0),
  totalInterviews: integer("total_interviews").default(0),
  finalRecommendation: text("final_recommendation"), // 'hire', 'maybe', 'reject'
  decisionNotes: text("decision_notes"),
  strengths: text("strengths").array(),
  concerns: text("concerns").array(),
  competitiveRanking: integer("competitive_ranking"), // 1, 2, 3, etc.
  decisionMadeBy: varchar("decision_made_by").references(() => users.id),
  decisionMadeAt: timestamp("decision_made_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Onboarding Process
export const onboardingTasks = pgTable("onboarding_tasks", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id),
  jobOfferId: integer("job_offer_id").references(() => jobOffers.id),
  taskTitle: text("task_title").notNull(),
  taskDescription: text("task_description"),
  taskType: text("task_type").notNull(), // 'document', 'training', 'meeting', 'system_access'
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'blocked'
  assignedTo: varchar("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  documentUrl: text("document_url"), // For document tasks
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Bulk Processing Jobs table
export const bulkJobs = pgTable("bulk_jobs", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id),
  totalFiles: integer("total_files").notNull(),
  processedFiles: integer("processed_files").notNull().default(0),
  qualifiedCandidates: integer("qualified_candidates").notNull().default(0),
  status: text("status").notNull().default("processing"), // 'processing', 'completed', 'failed'
  startedBy: varchar("started_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Bulk processing candidate results
export const bulkCandidates = pgTable("bulk_candidates", {
  id: serial("id").primaryKey(),
  bulkJobId: integer("bulk_job_id").references(() => bulkJobs.id, { onDelete: "cascade" }).notNull(),
  fileName: varchar("file_name").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  email: varchar("email"),
  phone: varchar("phone"),
  resumeText: text("resume_text"),
  skills: text("skills").array(),
  experience: integer("experience"),
  matchingScore: integer("matching_score"),
  skillsMatch: integer("skills_match"),
  experienceMatch: integer("experience_match"),
  analysis: text("analysis"),
  isShortlisted: boolean("is_shortlisted").default(false),
  addedToMainList: boolean("added_to_main_list").default(false),
  processedAt: timestamp("processed_at").defaultNow(),
});

// Screening tokens for candidate form access
export const screeningTokens = pgTable("screening_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 50 }).notNull().unique(),
  candidateId: integer("candidate_id").notNull().references(() => candidates.id, { onDelete: "cascade" }),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'expired'
  responses: text("responses"), // JSON string of form responses
  submittedAt: timestamp("submitted_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Interview tokens for candidate scheduling
export const interviewTokens = pgTable("interview_tokens", {
  id: serial("id").primaryKey(),
  token: varchar("token").notNull().unique(),
  applicationId: integer("application_id").references(() => applications.id, { onDelete: "cascade" }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User roles and permissions
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // 'admin', 'hr_manager', 'recruiter', 'interviewer'
  permissions: text("permissions").array(), // ['dashboard', 'jobs', 'candidates', 'interviews', 'results', 'bulk_processing', 'calendar', 'settings']
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization settings
export const organizationSettings = pgTable("organization_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key").notNull().unique(),
  value: text("value").notNull(),
  updatedBy: varchar("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI interview configurations
export const interviewConfigs = pgTable("interview_configs", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  
  // Core Interview Settings
  duration: integer("duration").default(30), // Interview duration in minutes
  totalQuestions: integer("total_questions").default(8), // Total number of questions
  avatarType: text("avatar_type").default('professional'), // 'professional', 'friendly', 'technical'
  
  // Question Configuration
  customQuestions: text("custom_questions").array(), // Admin-defined priority questions
  technicalQuestions: text("technical_questions").array(), // Tech-specific questions
  behavioralQuestions: text("behavioral_questions").array(), // Behavioral questions
  situationalQuestions: text("situational_questions").array(), // Situational questions
  
  // Technical Focus Areas
  techStack: text("tech_stack").array(), // Required technologies
  programmingLanguages: text("programming_languages").array(), // Required languages
  frameworks: text("frameworks").array(), // Frameworks to test
  tools: text("tools").array(), // Tools and platforms
  methodologies: text("methodologies").array(), // Agile, DevOps, etc.
  
  // Experience Focus
  experienceLevel: text("experience_level").default('intermediate'), // junior, intermediate, senior, expert
  industryExperience: text("industry_experience").array(), // Industry-specific experience
  projectTypes: text("project_types").array(), // Types of projects to discuss
  
  // Evaluation Criteria
  evaluationCriteria: text("evaluation_criteria").array(), // What to focus on
  skillWeights: jsonb("skill_weights"), // Weight for different skills (technical: 40%, communication: 30%, etc.)
  passingScore: integer("passing_score").default(70), // Minimum score to pass
  
  // Interview Flow
  introductionMessage: text("introduction_message"), // Custom intro message
  warmupQuestions: text("warmup_questions").array(), // Ice breaker questions
  closingMessage: text("closing_message"), // Custom closing message
  allowRetake: boolean("allow_retake").default(false), // Allow candidate to retake
  
  // AI Behavior
  difficultyProgression: text("difficulty_progression").default('adaptive'), // adaptive, linear, random
  followUpStyle: text("followup_style").default('detailed'), // brief, detailed, probing
  interviewStyle: text("interview_style").default('conversational'), // formal, conversational, technical
  
  // Advanced Settings
  recordingEnabled: boolean("recording_enabled").default(true),
  screenSharingRequired: boolean("screen_sharing_required").default(false),
  codingChallengeEnabled: boolean("coding_challenge_enabled").default(false),
  whiteboard: boolean("whiteboard").default(false),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Drive sessions for mass recruitment
export const driveSessions = pgTable("drive_sessions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'walk-in' | 'campus'
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  aptitudeCutoff: integer("aptitude_cutoff").default(60),
  technicalCutoff: integer("technical_cutoff").default(70),
  description: text("description"),
  testDuration: integer("test_duration").default(60), // in minutes
  questionCount: integer("question_count").default(50),
  totalCandidates: integer("total_candidates").default(0),
  registeredCandidates: integer("registered_candidates").default(0),
  testCompleted: integer("test_completed").default(0),
  qualifiedCandidates: integer("qualified_candidates").default(0),
  status: text("status").notNull().default("draft"), // 'draft', 'active', 'completed'
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Drive candidates for mass recruitment
export const driveCandidates = pgTable("drive_candidates", {
  id: serial("id").primaryKey(),
  driveSessionId: integer("drive_session_id").references(() => driveSessions.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  college: text("college"),
  registrationToken: varchar("registration_token").unique(),
  registrationStatus: text("registration_status").default("pending"), // 'pending', 'registered', 'aptitude_completed', 'technical_completed', 'qualified', 'interview_scheduled'
  testScore: integer("test_score"),
  aptitudeScore: integer("aptitude_score"),
  technicalScore: integer("technical_score"),
  currentRound: integer("current_round").default(1), // 1=aptitude, 2=technical, 3=interview
  qualificationStatus: text("qualification_status"), // 'qualified', 'not_qualified'
  interviewScheduled: boolean("interview_scheduled").default(false),
  registeredAt: timestamp("registered_at"),
  testCompletedAt: timestamp("test_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Aptitude test questions for drive sessions
export const aptitudeQuestions = pgTable("aptitude_questions", {
  id: serial("id").primaryKey(),
  driveSessionId: integer("drive_session_id").references(() => driveSessions.id, { onDelete: "cascade" }),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: text("options").array().notNull(), // Array of 4 options
  correctAnswer: integer("correct_answer").notNull(), // Index of correct answer (0-3)
  difficulty: text("difficulty").default("medium"), // 'easy', 'medium', 'hard'
  category: text("category").notNull(), // 'aptitude', 'technical', 'logical', 'domain'
  testRound: integer("test_round").default(1), // 1=Round1(Aptitude), 2=Round2(Technical)
  tags: text("tags").array(), // For filtering/categorization
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Test sessions for drive candidates
export const testSessions = pgTable("test_sessions", {
  id: serial("id").primaryKey(),
  driveCandidateId: integer("drive_candidate_id").references(() => driveCandidates.id, { onDelete: "cascade" }).notNull(),
  driveSessionId: integer("drive_session_id").references(() => driveSessions.id, { onDelete: "cascade" }).notNull(),
  testToken: varchar("test_token").unique().notNull(),
  status: text("status").default("pending"), // 'pending', 'in_progress', 'completed', 'expired'
  testRound: integer("test_round").notNull().default(1), // 1=Aptitude, 2=Technical
  totalQuestions: integer("total_questions").notNull(),
  answeredQuestions: integer("answered_questions").default(0),
  correctAnswers: integer("correct_answers").default(0),
  score: integer("score"), // Calculated percentage score
  timeSpent: integer("time_spent"), // in seconds
  responses: jsonb("responses"), // Array of question responses
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const jobsRelations = relations(jobs, ({ many, one }) => ({
  applications: many(applications),
  bulkJobs: many(bulkJobs),
  createdByUser: one(users, {
    fields: [jobs.createdBy],
    references: [users.id],
  }),
}));

export const candidatesRelations = relations(candidates, ({ many }) => ({
  applications: many(applications),
  screeningTokens: many(screeningTokens),
}));

export const screeningTokensRelations = relations(screeningTokens, ({ one }) => ({
  candidate: one(candidates, {
    fields: [screeningTokens.candidateId],
    references: [candidates.id],
  }),
  job: one(jobs, {
    fields: [screeningTokens.jobId],
    references: [jobs.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one, many }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  candidate: one(candidates, {
    fields: [applications.candidateId],
    references: [candidates.id],
  }),
  interviews: many(interviews),
}));

export const interviewRoundsRelations = relations(interviewRounds, ({ one, many }) => ({
  job: one(jobs, {
    fields: [interviewRounds.jobId],
    references: [jobs.id],
  }),
  interviews: many(interviews),
  createdByUser: one(users, {
    fields: [interviewRounds.createdBy],
    references: [users.id],
  }),
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  application: one(applications, {
    fields: [interviews.applicationId],
    references: [applications.id],
  }),
  round: one(interviewRounds, {
    fields: [interviews.roundId],
    references: [interviewRounds.id],
  }),
  interviewer: one(users, {
    fields: [interviews.interviewerId],
    references: [users.id],
  }),
  evaluations: many(evaluations),
}));

export const jobOffersRelations = relations(jobOffers, ({ one }) => ({
  application: one(applications, {
    fields: [jobOffers.applicationId],
    references: [applications.id],
  }),
  job: one(jobs, {
    fields: [jobOffers.jobId],
    references: [jobs.id],
  }),
  candidate: one(candidates, {
    fields: [jobOffers.candidateId],
    references: [candidates.id],
  }),
  createdByUser: one(users, {
    fields: [jobOffers.createdBy],
    references: [users.id],
  }),
}));

export const decisionMatrixRelations = relations(decisionMatrix, ({ one }) => ({
  job: one(jobs, {
    fields: [decisionMatrix.jobId],
    references: [jobs.id],
  }),
  candidate: one(candidates, {
    fields: [decisionMatrix.candidateId],
    references: [candidates.id],
  }),
  application: one(applications, {
    fields: [decisionMatrix.applicationId],
    references: [applications.id],
  }),
  decisionMaker: one(users, {
    fields: [decisionMatrix.decisionMadeBy],
    references: [users.id],
  }),
}));

export const onboardingTasksRelations = relations(onboardingTasks, ({ one }) => ({
  candidate: one(candidates, {
    fields: [onboardingTasks.candidateId],
    references: [candidates.id],
  }),
  jobOffer: one(jobOffers, {
    fields: [onboardingTasks.jobOfferId],
    references: [jobOffers.id],
  }),
  assignedToUser: one(users, {
    fields: [onboardingTasks.assignedTo],
    references: [users.id],
  }),
  createdByUser: one(users, {
    fields: [onboardingTasks.createdBy],
    references: [users.id],
  }),
}));

export const evaluationsRelations = relations(evaluations, ({ one }) => ({
  interview: one(interviews, {
    fields: [evaluations.interviewId],
    references: [interviews.id],
  }),
  evaluatedByUser: one(users, {
    fields: [evaluations.evaluatedBy],
    references: [users.id],
  }),
}));

export const bulkJobsRelations = relations(bulkJobs, ({ one, many }) => ({
  job: one(jobs, {
    fields: [bulkJobs.jobId],
    references: [jobs.id],
  }),
  startedByUser: one(users, {
    fields: [bulkJobs.startedBy],
    references: [users.id],
  }),
  bulkCandidates: many(bulkCandidates),
}));

export const bulkCandidatesRelations = relations(bulkCandidates, ({ one }) => ({
  bulkJob: one(bulkJobs, {
    fields: [bulkCandidates.bulkJobId],
    references: [bulkJobs.id],
  }),
}));

export const interviewTokensRelations = relations(interviewTokens, ({ one }) => ({
  application: one(applications, {
    fields: [interviewTokens.applicationId],
    references: [applications.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

export const interviewConfigsRelations = relations(interviewConfigs, ({ one }) => ({
  job: one(jobs, {
    fields: [interviewConfigs.jobId],
    references: [jobs.id],
  }),
  creator: one(users, {
    fields: [interviewConfigs.createdBy],
    references: [users.id],
  }),
}));

export const driveSessionsRelations = relations(driveSessions, ({ one, many }) => ({
  job: one(jobs, {
    fields: [driveSessions.jobId],
    references: [jobs.id],
  }),
  createdByUser: one(users, {
    fields: [driveSessions.createdBy],
    references: [users.id],
  }),
  candidates: many(driveCandidates),
  questions: many(aptitudeQuestions),
  testSessions: many(testSessions),
}));

export const driveCandidatesRelations = relations(driveCandidates, ({ one, many }) => ({
  driveSession: one(driveSessions, {
    fields: [driveCandidates.driveSessionId],
    references: [driveSessions.id],
  }),
  testSessions: many(testSessions),
}));

export const aptitudeQuestionsRelations = relations(aptitudeQuestions, ({ one }) => ({
  driveSession: one(driveSessions, {
    fields: [aptitudeQuestions.driveSessionId],
    references: [driveSessions.id],
  }),
  job: one(jobs, {
    fields: [aptitudeQuestions.jobId],
    references: [jobs.id],
  }),
  createdByUser: one(users, {
    fields: [aptitudeQuestions.createdBy],
    references: [users.id],
  }),
}));

export const testSessionsRelations = relations(testSessions, ({ one }) => ({
  driveCandidate: one(driveCandidates, {
    fields: [testSessions.driveCandidateId],
    references: [driveCandidates.id],
  }),
  driveSession: one(driveSessions, {
    fields: [testSessions.driveSessionId],
    references: [driveSessions.id],
  }),
}));

// Job Platform Config Relations
export const jobPlatformConfigsRelations = relations(jobPlatformConfigs, ({ one, many }) => ({
  createdByUser: one(users, {
    fields: [jobPlatformConfigs.createdBy],
    references: [users.id],
  }),
  postings: many(jobPlatformPostings),
}));

export const jobPlatformPostingsRelations = relations(jobPlatformPostings, ({ one, many }) => ({
  job: one(jobs, {
    fields: [jobPlatformPostings.jobId],
    references: [jobs.id],
  }),
  platformConfig: one(jobPlatformConfigs, {
    fields: [jobPlatformPostings.platformConfigId],
    references: [jobPlatformConfigs.id],
  }),
  applications: many(platformApplications),
}));

export const platformApplicationsRelations = relations(platformApplications, ({ one }) => ({
  jobPlatformPosting: one(jobPlatformPostings, {
    fields: [platformApplications.jobPlatformPostingId],
    references: [jobPlatformPostings.id],
  }),
  candidate: one(candidates, {
    fields: [platformApplications.candidateId],
    references: [candidates.id],
  }),
}));

// Insert schemas
// Server-side schema includes createdBy for validation
export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  description: z.string().min(1, "Job description is required"),
  requirements: z.string().min(1, "Job requirements are required"),
});

// Client-side schema excludes createdBy (server will add it)
export const clientJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
}).extend({
  description: z.string().min(1, "Job description is required"),
  requirements: z.string().min(1, "Job requirements are required"),
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  skills: z.union([
    z.array(z.string()),
    z.string().transform((val) => val ? val.split(',').map(s => s.trim()).filter(s => s) : [])
  ]),
  experience: z.union([
    z.number(),
    z.string().transform((val) => val ? parseInt(val, 10) : 0)
  ]).optional(),
  selectedJobId: z.union([
    z.number(),
    z.string().transform((val) => val ? parseInt(val, 10) : undefined)
  ]).optional()
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
}).extend({
  candidateId: z.number(),
  jobId: z.number(),
  status: z.string().default("applied")
});

export const insertInterviewRoundSchema = createInsertSchema(interviewRounds).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEvaluationSchema = createInsertSchema(evaluations).omit({
  id: true,
  createdAt: true,
});

export const insertJobOfferSchema = createInsertSchema(jobOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  acceptedAt: true,
  rejectedAt: true,
});

export const insertDecisionMatrixSchema = createInsertSchema(decisionMatrix).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  decisionMadeAt: true,
});

export const insertOnboardingTaskSchema = createInsertSchema(onboardingTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertBulkJobSchema = createInsertSchema(bulkJobs).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertBulkCandidateSchema = createInsertSchema(bulkCandidates).omit({
  id: true,
  processedAt: true,
});

export const insertScreeningTokenSchema = createInsertSchema(screeningTokens).omit({
  id: true,
  createdAt: true,
  submittedAt: true,
});

export const insertInterviewTokenSchema = createInsertSchema(interviewTokens).omit({
  id: true,
  createdAt: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrganizationSettingSchema = createInsertSchema(organizationSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertInterviewConfigSchema = createInsertSchema(interviewConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  customQuestions: z.array(z.string()).optional(),
  technicalQuestions: z.array(z.string()).optional(),
  behavioralQuestions: z.array(z.string()).optional(),
  situationalQuestions: z.array(z.string()).optional(),
  techStack: z.array(z.string()).optional(),
  programmingLanguages: z.array(z.string()).optional(),
  frameworks: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  methodologies: z.array(z.string()).optional(),
  industryExperience: z.array(z.string()).optional(),
  projectTypes: z.array(z.string()).optional(),
  evaluationCriteria: z.array(z.string()).optional(),
  warmupQuestions: z.array(z.string()).optional(),
  skillWeights: z.record(z.string(), z.number()).optional(),
  duration: z.number().min(10).max(120).optional(),
  totalQuestions: z.number().min(3).max(20).optional(),
  passingScore: z.number().min(50).max(100).optional(),
});

// Platform Configuration Schemas
export const insertJobPlatformConfigSchema = createInsertSchema(jobPlatformConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSyncAt: true,
});

export const insertJobPlatformPostingSchema = createInsertSchema(jobPlatformPostings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  postingDate: true,
  lastSyncAt: true,
});

export const insertPlatformApplicationSchema = createInsertSchema(platformApplications).omit({
  id: true,
  createdAt: true,
  ingestedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type ClientJob = z.infer<typeof clientJobSchema>;
export type Job = typeof jobs.$inferSelect;

export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type Candidate = typeof candidates.$inferSelect;

export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applications.$inferSelect;

export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;

export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type Evaluation = typeof evaluations.$inferSelect;

export type InsertBulkJob = z.infer<typeof insertBulkJobSchema>;
export type BulkJob = typeof bulkJobs.$inferSelect;

export type InsertBulkCandidate = z.infer<typeof insertBulkCandidateSchema>;
export type BulkCandidate = typeof bulkCandidates.$inferSelect;

export type InsertScreeningToken = z.infer<typeof insertScreeningTokenSchema>;
export type ScreeningToken = typeof screeningTokens.$inferSelect;

export type InsertInterviewToken = z.infer<typeof insertInterviewTokenSchema>;
export type InterviewToken = typeof interviewTokens.$inferSelect;

export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type UserRole = typeof userRoles.$inferSelect;

export type InsertOrganizationSetting = z.infer<typeof insertOrganizationSettingSchema>;
export type OrganizationSetting = typeof organizationSettings.$inferSelect;

export type InsertInterviewConfig = z.infer<typeof insertInterviewConfigSchema>;
export type InterviewConfig = typeof interviewConfigs.$inferSelect;

export type InsertInterviewRound = z.infer<typeof insertInterviewRoundSchema>;
export type InterviewRound = typeof interviewRounds.$inferSelect;

export type InsertJobOffer = z.infer<typeof insertJobOfferSchema>;
export type JobOffer = typeof jobOffers.$inferSelect;

export type InsertDecisionMatrix = z.infer<typeof insertDecisionMatrixSchema>;
export type DecisionMatrix = typeof decisionMatrix.$inferSelect;

export type InsertOnboardingTask = z.infer<typeof insertOnboardingTaskSchema>;
export type OnboardingTask = typeof onboardingTasks.$inferSelect;

export type DriveSession = typeof driveSessions.$inferSelect;
export type DriveCandidate = typeof driveCandidates.$inferSelect;
export type AptitudeQuestion = typeof aptitudeQuestions.$inferSelect;
export type TestSession = typeof testSessions.$inferSelect;

// Platform Configuration Types
export type InsertJobPlatformConfig = z.infer<typeof insertJobPlatformConfigSchema>;
export type JobPlatformConfig = typeof jobPlatformConfigs.$inferSelect;

export type InsertJobPlatformPosting = z.infer<typeof insertJobPlatformPostingSchema>;
export type JobPlatformPosting = typeof jobPlatformPostings.$inferSelect;

export type InsertPlatformApplication = z.infer<typeof insertPlatformApplicationSchema>;
export type PlatformApplication = typeof platformApplications.$inferSelect;

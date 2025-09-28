import {
  users,
  jobs,
  candidates,
  applications,
  interviews,
  interviewRounds,
  evaluations,
  bulkJobs,
  bulkCandidates,
  interviewTokens,
  userRoles,
  organizationSettings,
  interviewConfigs,
  jobPlatformConfigs,
  jobPlatformPostings,
  platformApplications,
  type User,
  type UpsertUser,
  type Job,
  type InsertJob,
  type Candidate,
  type InsertCandidate,
  type Application,
  type InsertApplication,
  type Interview,
  type InsertInterview,
  type InterviewRound,
  type InsertInterviewRound,
  type Evaluation,
  type InsertEvaluation,
  type BulkJob,
  type InsertBulkJob,
  type BulkCandidate,
  type InsertBulkCandidate,
  type InterviewToken,
  type InsertInterviewToken,
  type UserRole,
  type InsertUserRole,
  type OrganizationSetting,
  type InsertOrganizationSetting,
  type InterviewConfig,
  type InsertInterviewConfig,
  type JobPlatformConfig,
  type InsertJobPlatformConfig,
  type JobPlatformPosting,
  type InsertJobPlatformPosting,
  type PlatformApplication,
  type InsertPlatformApplication,
  driveSessions,
  driveCandidates,
  aptitudeQuestions,
  testSessions,
  aiInterviewSessions,
  aiQaChunks,
  aiVideoChunks,
  aiProxyDetection,
  type AiInterviewSession,
  type InsertAiInterviewSession,
  type AiQaChunk,
  type InsertAiQaChunk,
  type AiVideoChunk,
  type InsertAiVideoChunk,
  type AiProxyDetection,
  type InsertAiProxyDetection,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, or, isNull } from "drizzle-orm";

export interface IStorage {
  // User operations - mandatory for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Job operations
  createJob(job: InsertJob): Promise<Job>;
  getJobs(userId: string): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  updateJob(id: number, job: Partial<InsertJob>): Promise<Job>;
  deleteJob(id: number): Promise<void>;
  
  // Candidate operations
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getCandidates(): Promise<Candidate[]>;
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidateByEmail(email: string): Promise<Candidate | undefined>;
  updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate>;
  deleteCandidate(id: number): Promise<void>;
  getArchivedCandidates(): Promise<Candidate[]>;
  archiveCandidate(id: number): Promise<Candidate>;
  restoreCandidate(id: number): Promise<Candidate>;
  
  // Application operations
  createApplication(application: InsertApplication): Promise<Application>;
  getApplications(filters?: { jobId?: number; status?: string }): Promise<(Application & { job: Job; candidate: Candidate })[]>;
  getApplication(id: number): Promise<Application | undefined>;
  getApplicationsByCandidate(candidateId: number): Promise<Application[]>;
  updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application>;
  
  // Interview operations
  createInterview(interview: InsertInterview): Promise<Interview>;
  getInterviews(filters?: { startDate?: Date; endDate?: Date }): Promise<(Interview & { application: Application & { job: Job; candidate: Candidate } })[]>;
  getInterview(id: number): Promise<Interview | undefined>;
  updateInterview(id: number, interview: Partial<InsertInterview>): Promise<Interview>;
  getInterviewWithDetails(id: number): Promise<any>;
  
  // Interview rounds operations
  createInterviewRound(round: InsertInterviewRound): Promise<InterviewRound>;
  getInterviewRounds(filters?: { jobId?: number }): Promise<InterviewRound[]>;
  getInterviewRound(id: number): Promise<InterviewRound | undefined>;
  updateInterviewRound(id: number, round: Partial<InsertInterviewRound>): Promise<InterviewRound>;
  deleteInterviewRound(id: number): Promise<void>;
  
  // Evaluation operations
  createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation>;
  getEvaluations(filters?: { jobId?: number; recommendation?: string }): Promise<(Evaluation & { interview: Interview & { application: Application & { job: Job; candidate: Candidate } } })[]>;
  
  // AI Interview operations
  getAiInterviewSessions(filters?: { interviewId?: number; sessionToken?: string }): Promise<AiInterviewSession[]>;
  getAiQaChunks(filters?: { sessionId?: number; interviewId?: number }): Promise<AiQaChunk[]>;
  getAiVideoChunks(filters?: { sessionId?: number }): Promise<AiVideoChunk[]>;
  getAiProxyDetections(filters?: { sessionId?: number }): Promise<AiProxyDetection[]>;
  
  // Bulk processing operations
  createBulkJob(bulkJob: InsertBulkJob): Promise<BulkJob>;
  getBulkJob(id: number): Promise<BulkJob | undefined>;
  getBulkJobs(userId: string): Promise<(BulkJob & { job: Job })[]>;
  updateBulkJob(id: number, bulkJob: Partial<InsertBulkJob>): Promise<BulkJob>;
  
  // Bulk candidates operations
  createBulkCandidate(bulkCandidate: InsertBulkCandidate): Promise<BulkCandidate>;
  getBulkCandidates(bulkJobId: number): Promise<BulkCandidate[]>;
  updateBulkCandidate(id: number, updates: Partial<InsertBulkCandidate>): Promise<BulkCandidate>;
  shortlistBulkCandidates(bulkJobId: number, candidateIds: number[]): Promise<void>;
  addBulkCandidatesToMainList(bulkJobId: number, candidateIds: number[]): Promise<Candidate[]>;
  
  // Dashboard metrics
  getDashboardMetrics(userId: string): Promise<{
    totalApplications: number;
    interviewsScheduled: number;
    qualifiedCandidates: number;
    avgTimeToHire: number;
  }>;

  // Recent activities
  getRecentActivities(): Promise<Array<{
    id: string;
    message: string;
    candidate: string;
    position: string;
    time: string;
    status: 'positive' | 'negative' | 'neutral';
  }>>;

  // Interview token operations
  createInterviewToken(token: InsertInterviewToken): Promise<InterviewToken>;
  getInterviewToken(token: string): Promise<InterviewToken | undefined>;
  updateInterviewToken(token: string, updates: Partial<InsertInterviewToken>): Promise<InterviewToken>;

  // User role operations
  createUserRole(userRole: InsertUserRole): Promise<UserRole>;
  getUserRoles(): Promise<(UserRole & { user: User })[]>;
  getUserRole(userId: string): Promise<UserRole | undefined>;
  updateUserRole(userId: string, updates: Partial<InsertUserRole>): Promise<UserRole>;
  deleteUserRole(userId: string): Promise<void>;

  // Organization settings
  getOrganizationSettings(): Promise<OrganizationSetting[]>;
  getOrganizationSetting(key: string): Promise<OrganizationSetting | undefined>;
  upsertOrganizationSetting(setting: InsertOrganizationSetting): Promise<OrganizationSetting>;

  // Interview configuration
  createInterviewConfig(config: InsertInterviewConfig): Promise<InterviewConfig>;
  getInterviewConfig(jobId: number): Promise<InterviewConfig | undefined>;
  updateInterviewConfig(jobId: number, updates: Partial<InsertInterviewConfig>): Promise<InterviewConfig>;

  // Drive session operations
  createDriveSession(driveSession: any): Promise<any>;
  getDriveSessions(): Promise<any[]>;
  getDriveSession(id: number): Promise<any | undefined>;
  updateDriveSession(id: number, updates: any): Promise<any>;
  deleteDriveSession(id: number): Promise<void>;

  // Drive candidate operations
  createDriveCandidate(driveCandidate: any): Promise<any>;
  getDriveCandidates(): Promise<any[]>;
  getDriveCandidate(id: number): Promise<any | undefined>;
  getDriveCandidateByToken(token: string): Promise<any | undefined>;
  updateDriveCandidate(id: number, updates: any): Promise<any>;
  deleteDriveCandidate(id: number): Promise<void>;

  // Aptitude question operations
  createAptitudeQuestion(question: any): Promise<any>;
  getAptitudeQuestions(driveSessionId: number): Promise<any[]>;
  updateAptitudeQuestion(id: number, updates: any): Promise<any>;
  deleteAptitudeQuestion(id: number): Promise<void>;

  // Test session operations
  createTestSession(testSession: any): Promise<any>;
  getTestSessions(): Promise<any[]>;
  getTestSession(id: number): Promise<any | undefined>;
  getTestSessionByToken(token: string): Promise<any | undefined>;
  updateTestSession(id: number, updates: any): Promise<any>;
  deleteTestSession(id: number): Promise<void>;

  // Platform configuration operations
  createPlatformConfig(config: InsertJobPlatformConfig): Promise<JobPlatformConfig>;
  getPlatformConfigs(userId: string): Promise<JobPlatformConfig[]>;
  getPlatformConfig(id: number): Promise<JobPlatformConfig | undefined>;
  updatePlatformConfig(id: number, updates: Partial<InsertJobPlatformConfig>): Promise<JobPlatformConfig>;
  deletePlatformConfig(id: number): Promise<void>;
  testPlatformConnection(id: number): Promise<boolean>;

  // Job platform posting operations
  createJobPosting(posting: InsertJobPlatformPosting): Promise<JobPlatformPosting>;
  getJobPostings(jobId?: number): Promise<JobPlatformPosting[]>;
  updateJobPosting(id: number, updates: Partial<InsertJobPlatformPosting>): Promise<JobPlatformPosting>;
  deleteJobPosting(id: number): Promise<void>;

  // Platform application operations
  createPlatformApplication(application: InsertPlatformApplication): Promise<PlatformApplication>;
  getPlatformApplications(postingId?: number): Promise<PlatformApplication[]>;
  updatePlatformApplication(id: number, updates: Partial<InsertPlatformApplication>): Promise<PlatformApplication>;
  syncPlatformApplications(platformConfigId: number): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations - mandatory for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.firstName, users.lastName);
  }

  // Job operations
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async getJobs(userId: string): Promise<Job[]> {
    // Simple query for now - get jobs without application count to avoid Drizzle complex select issues
    const jobsList = await db
      .select()
      .from(jobs)
      .where(eq(jobs.createdBy, userId))
      .orderBy(desc(jobs.createdAt));

    // Add application count manually for each job
    const jobsWithCounts = await Promise.all(
      jobsList.map(async (job) => {
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(applications)
          .where(eq(applications.jobId, job.id));
        
        return {
          ...job,
          applicationCount: countResult?.count || 0
        };
      })
    );

    return jobsWithCounts;
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async updateJob(id: number, job: Partial<InsertJob>): Promise<Job> {
    const [updatedJob] = await db
      .update(jobs)
      .set({ ...job, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return updatedJob;
  }

  async deleteJob(id: number): Promise<void> {
    // Delete in proper order to avoid foreign key constraint violations
    
    // 1. Delete evaluations for interviews related to this job's applications
    await db.delete(evaluations).where(
      sql`interview_id IN (
        SELECT i.id FROM interviews i 
        JOIN applications a ON i.application_id = a.id 
        WHERE a.job_id = ${id}
      )`
    );
    
    // 2. Delete interviews for this job's applications
    await db.delete(interviews).where(
      sql`application_id IN (
        SELECT id FROM applications WHERE job_id = ${id}
      )`
    );
    
    // 3. Delete applications for this job
    await db.delete(applications).where(eq(applications.jobId, id));
    
    // 4. Delete bulk jobs for this job
    await db.delete(bulkJobs).where(eq(bulkJobs.jobId, id));
    
    // 5. Finally delete the job
    await db.delete(jobs).where(eq(jobs.id, id));
  }

  // Candidate operations
  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    // Remove selectedJobId if it exists in the data (it's not a database field)
    const { selectedJobId, ...candidateData } = candidate as any;
    const [newCandidate] = await db.insert(candidates).values(candidateData).returning();
    return newCandidate;
  }

  async getCandidates(): Promise<any[]> {
    try {
      // First get all non-archived candidates
      const allCandidates = await db.select().from(candidates)
        .where(eq(candidates.archived, false))
        .orderBy(desc(candidates.createdAt));
      
      // Then get their application data separately to avoid complex joins
      const candidatesWithApps = await Promise.all(
        allCandidates.map(async (candidate) => {
          const candidateApps = await db
            .select({
              id: applications.id,
              jobId: applications.jobId,
              status: applications.status,
              overallScore: applications.overallScore,
              matchingScore: applications.matchingScore,
              skillsMatch: applications.skillsMatch,
              experienceMatch: applications.experienceMatch,
              appliedAt: applications.appliedAt,
              jobTitle: jobs.title,
            })
            .from(applications)
            .leftJoin(jobs, eq(applications.jobId, jobs.id))
            .where(eq(applications.candidateId, candidate.id))
            .orderBy(desc(applications.appliedAt))
            .limit(1);
          
          console.log(`Candidate ${candidate.id} (${candidate.firstName} ${candidate.lastName}) applications:`, candidateApps);
          
          return {
            ...candidate,
            application: candidateApps.length > 0 ? {
              id: candidateApps[0].id,
              jobTitle: candidateApps[0].jobTitle,
              status: candidateApps[0].status,
              overallScore: candidateApps[0].overallScore,
              matchingScore: candidateApps[0].matchingScore,
              skillsMatch: candidateApps[0].skillsMatch,
              experienceMatch: candidateApps[0].experienceMatch,
              appliedAt: candidateApps[0].appliedAt,
            } : null
          };
        })
      );
      
      return candidatesWithApps;
    } catch (error) {
      console.error("Error in getCandidates:", error);
      // Fallback to simple candidate fetch
      return await db.select().from(candidates).orderBy(desc(candidates.createdAt));
    }
  }

  async getCandidate(id: number): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.id, id));
    return candidate;
  }

  async getCandidateByEmail(email: string): Promise<Candidate | undefined> {
    const [candidate] = await db.select().from(candidates).where(eq(candidates.email, email));
    return candidate;
  }

  async updateCandidate(id: number, candidate: Partial<InsertCandidate>): Promise<Candidate> {
    const [updatedCandidate] = await db
      .update(candidates)
      .set({ ...candidate, updatedAt: new Date() })
      .where(eq(candidates.id, id))
      .returning();
    return updatedCandidate;
  }

  async deleteCandidate(id: number): Promise<void> {
    // Delete in proper order to avoid foreign key constraint violations
    
    // 1. Delete evaluations for interviews related to this candidate's applications
    await db.delete(evaluations).where(
      sql`interview_id IN (
        SELECT i.id FROM interviews i 
        JOIN applications a ON i.application_id = a.id 
        WHERE a.candidate_id = ${id}
      )`
    );
    
    // 2. Delete interviews for this candidate's applications
    await db.delete(interviews).where(
      sql`application_id IN (
        SELECT id FROM applications WHERE candidate_id = ${id}
      )`
    );
    
    // 3. Delete applications for this candidate
    await db.delete(applications).where(eq(applications.candidateId, id));
    
    // 4. Finally delete the candidate
    await db.delete(candidates).where(eq(candidates.id, id));
  }

  async getArchivedCandidates(): Promise<Candidate[]> {
    return await db.select().from(candidates)
      .where(eq(candidates.archived, true))
      .orderBy(desc(candidates.archivedAt));
  }

  async archiveCandidate(id: number): Promise<Candidate> {
    const [archivedCandidate] = await db
      .update(candidates)
      .set({ 
        archived: true, 
        archivedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(candidates.id, id))
      .returning();
    return archivedCandidate;
  }

  async restoreCandidate(id: number): Promise<Candidate> {
    const [restoredCandidate] = await db
      .update(candidates)
      .set({ 
        archived: false, 
        archivedAt: null,
        updatedAt: new Date() 
      })
      .where(eq(candidates.id, id))
      .returning();
    return restoredCandidate;
  }

  // Application operations
  async createApplication(application: InsertApplication): Promise<Application> {
    const [newApplication] = await db.insert(applications).values(application).returning();
    return newApplication;
  }

  async getApplications(filters?: { jobId?: number; status?: string }): Promise<(Application & { job: Job; candidate: Candidate })[]> {
    let query = db
      .select()
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(candidates, eq(applications.candidateId, candidates.id));

    let whereConditions = [];
    if (filters?.jobId) {
      whereConditions.push(eq(applications.jobId, filters.jobId));
    }
    if (filters?.status) {
      whereConditions.push(eq(applications.status, filters.status));
    }
    
    if (whereConditions.length > 0) {
      query = query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }

    const results = await query.orderBy(desc(applications.appliedAt));
    return results.map((result) => ({
      ...result.applications,
      job: result.jobs,
      candidate: result.candidates,
    }));
  }

  async getApplication(id: number): Promise<Application | undefined> {
    const [application] = await db.select().from(applications).where(eq(applications.id, id));
    return application;
  }

  async getApplicationsByCandidate(candidateId: number): Promise<Application[]> {
    const apps = await db.select().from(applications).where(eq(applications.candidateId, candidateId));
    return apps;
  }

  async updateApplication(id: number, application: Partial<InsertApplication>): Promise<Application> {
    const [updatedApplication] = await db
      .update(applications)
      .set({ ...application, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return updatedApplication;
  }

  // Interview operations
  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db.insert(interviews).values({
      ...interview,
      scheduledAt: interview.scheduledAt || new Date(),
      format: interview.format || 'video_call'
    }).returning();
    return newInterview;
  }

  async getInterviews(filters?: { startDate?: Date; endDate?: Date; applicationId?: number }): Promise<(Interview & { application: Application & { job: Job; candidate: Candidate } })[]> {
    let query = db
      .select()
      .from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(candidates, eq(applications.candidateId, candidates.id));

    if (filters?.startDate && filters?.endDate) {
      query = query.where(
        and(
          gte(interviews.scheduledAt, filters.startDate),
          lte(interviews.scheduledAt, filters.endDate)
        )
      );
    }

    const results = await query.orderBy(interviews.scheduledAt);
    return results.map((result) => ({
      ...result.interviews,
      application: {
        ...result.applications,
        job: result.jobs,
        candidate: result.candidates,
      },
    }));
  }

  async getInterview(id: number): Promise<Interview | undefined> {
    const [interview] = await db.select().from(interviews).where(eq(interviews.id, id));
    return interview;
  }

  async updateInterview(id: number, interview: Partial<InsertInterview>): Promise<Interview> {
    const [updatedInterview] = await db
      .update(interviews)
      .set({ ...interview, updatedAt: new Date() })
      .where(eq(interviews.id, id))
      .returning();
    return updatedInterview;
  }

  async getInterviewWithDetails(id: number): Promise<any> {
    const results = await db
      .select()
      .from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .leftJoin(users, eq(interviews.interviewerId, users.id))
      .where(eq(interviews.id, id));

    if (results.length === 0) {
      return null;
    }

    const result = results[0];
    return {
      id: result.interviews.id,
      candidateName: `${result.candidates.firstName} ${result.candidates.lastName}`,
      candidateEmail: result.candidates.email,
      jobTitle: result.jobs.title,
      type: result.interviews.type,
      duration: result.interviews.duration,
      scheduledAt: result.interviews.scheduledAt,
      interviewerName: result.users?.fullName || 'Not Assigned',
      meetingUrl: result.interviews.meetingUrl,
      status: result.interviews.status
    };
  }

  // Interview rounds operations
  async createInterviewRound(round: InsertInterviewRound): Promise<InterviewRound> {
    const [newRound] = await db.insert(interviewRounds).values(round).returning();
    return newRound;
  }

  async getInterviewRounds(filters?: { jobId?: number }): Promise<InterviewRound[]> {
    let query = db.select().from(interviewRounds);
    
    if (filters?.jobId) {
      query = query.where(eq(interviewRounds.jobId, filters.jobId));
    }
    
    const results = await query.orderBy(interviewRounds.roundNumber);
    return results;
  }

  async getInterviewRound(id: number): Promise<InterviewRound | undefined> {
    const [round] = await db.select().from(interviewRounds).where(eq(interviewRounds.id, id));
    return round;
  }

  async updateInterviewRound(id: number, round: Partial<InsertInterviewRound>): Promise<InterviewRound> {
    const [updatedRound] = await db
      .update(interviewRounds)
      .set({ ...round, updatedAt: new Date() })
      .where(eq(interviewRounds.id, id))
      .returning();
    return updatedRound;
  }

  async deleteInterviewRound(id: number): Promise<void> {
    await db.delete(interviewRounds).where(eq(interviewRounds.id, id));
  }

  // Evaluation operations
  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const [newEvaluation] = await db.insert(evaluations).values(evaluation).returning();
    return newEvaluation;
  }

  async getEvaluations(filters?: { jobId?: number; recommendation?: string }): Promise<(Evaluation & { interview: Interview & { application: Application & { job: Job; candidate: Candidate } } })[]> {
    let query = db
      .select()
      .from(evaluations)
      .innerJoin(interviews, eq(evaluations.interviewId, interviews.id))
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .innerJoin(candidates, eq(applications.candidateId, candidates.id));

    let whereConditions = [];
    if (filters?.jobId) {
      whereConditions.push(eq(applications.jobId, filters.jobId));
    }
    if (filters?.recommendation) {
      whereConditions.push(eq(evaluations.recommendation, filters.recommendation));
    }
    
    if (whereConditions.length > 0) {
      query = query.where(whereConditions.length === 1 ? whereConditions[0] : and(...whereConditions));
    }

    const results = await query.orderBy(desc(evaluations.createdAt));
    return results.map((result) => ({
      ...result.evaluations,
      interview: {
        ...result.interviews,
        application: {
          ...result.applications,
          job: result.jobs,
          candidate: result.candidates,
        },
      },
    }));
  }

  // Bulk processing operations
  async createBulkJob(bulkJob: InsertBulkJob): Promise<BulkJob> {
    const [newBulkJob] = await db.insert(bulkJobs).values(bulkJob).returning();
    return newBulkJob;
  }

  async getBulkJob(id: number): Promise<BulkJob | undefined> {
    const [result] = await db.select().from(bulkJobs).where(eq(bulkJobs.id, id));
    return result;
  }

  async getBulkJobs(userId: string): Promise<(BulkJob & { job: Job })[]> {
    const results = await db
      .select()
      .from(bulkJobs)
      .innerJoin(jobs, eq(bulkJobs.jobId, jobs.id))
      .where(eq(bulkJobs.startedBy, userId))
      .orderBy(desc(bulkJobs.createdAt));

    return results.map((result) => ({
      ...result.bulk_jobs,
      job: result.jobs,
    }));
  }

  async updateBulkJob(id: number, bulkJob: Partial<InsertBulkJob>): Promise<BulkJob> {
    const [updatedBulkJob] = await db
      .update(bulkJobs)
      .set(bulkJob)
      .where(eq(bulkJobs.id, id))
      .returning();
    return updatedBulkJob;
  }

  // Dashboard metrics
  async getDashboardMetrics(userId: string): Promise<{
    totalApplications: number;
    interviewsScheduled: number;
    qualifiedCandidates: number;
    avgTimeToHire: number;
  }> {
    // Get total applications (simplified - all applications for now)
    const [totalApplicationsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(applications);

    // Get interviews scheduled
    const [interviewsScheduledResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(interviews)
      .where(eq(interviews.status, 'scheduled'));

    // Get qualified candidates (matching score >= 70)
    const [qualifiedCandidatesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(applications)
      .where(sql`applications.matching_score >= 70`);

    console.log("Dashboard metrics calculated:", {
      totalApplications: totalApplicationsResult.count || 0,
      interviewsScheduled: interviewsScheduledResult.count || 0,
      qualifiedCandidates: qualifiedCandidatesResult.count || 0
    });

    return {
      totalApplications: totalApplicationsResult.count || 0,
      interviewsScheduled: interviewsScheduledResult.count || 0,
      qualifiedCandidates: qualifiedCandidatesResult.count || 0,
      avgTimeToHire: 0,
    };
  }

  async getRecentActivities(): Promise<Array<{
    id: string;
    message: string;
    candidate: string;
    position: string;
    time: string;
    status: 'positive' | 'negative' | 'neutral';
  }>> {
    const activities = [];

    // Get recent applications (last 30 days)
    const recentApplications = await db
      .select({
        id: applications.id,
        candidateId: applications.candidateId,
        candidateName: sql<string>`concat(candidates.first_name, ' ', candidates.last_name)`,
        jobTitle: jobs.title,
        status: applications.status,
        appliedAt: applications.appliedAt,
        matchingScore: applications.matchingScore,
      })
      .from(applications)
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(sql`applications.applied_at > NOW() - INTERVAL '30 days'`)
      .orderBy(sql`applications.applied_at DESC`)
      .limit(10);

    // Get recent interviews (last 30 days)
    const recentInterviews = await db
      .select({
        id: interviews.id,
        candidateName: sql<string>`concat(candidates.first_name, ' ', candidates.last_name)`,
        jobTitle: jobs.title,
        status: interviews.status,
        scheduledAt: interviews.scheduledAt,
        completedAt: interviews.completedAt,
      })
      .from(interviews)
      .innerJoin(applications, eq(interviews.applicationId, applications.id))
      .innerJoin(candidates, eq(applications.candidateId, candidates.id))
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(sql`interviews.scheduled_at > NOW() - INTERVAL '30 days'`)
      .orderBy(sql`interviews.scheduled_at DESC`)
      .limit(10);

    // Process applications into activities
    for (const app of recentApplications) {
      const timeDiff = Date.now() - new Date(app.appliedAt).getTime();
      const timeAgo = this.formatTimeAgo(timeDiff);
      
      let message = '';
      let status: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      switch (app.status) {
        case 'applied':
          message = 'Applied for position';
          status = 'neutral';
          break;
        case 'screening_sent':
          message = 'Screening form sent';
          status = 'neutral';
          break;
        case 'screened':
          message = 'Completed screening';
          status = 'positive';
          break;
        case 'interview_invited':
          message = 'Interview invitation sent';
          status = 'positive';
          break;
        case 'interview_scheduled':
          message = 'Interview scheduled';
          status = 'positive';
          break;
        case 'interview_completed':
          message = 'Interview completed';
          status = 'positive';
          break;
        case 'rejected':
          message = 'Application rejected';
          status = 'negative';
          break;
        case 'hired':
          message = 'Hired!';
          status = 'positive';
          break;
        default:
          message = 'Status updated';
          status = 'neutral';
      }

      activities.push({
        id: `app-${app.id}`,
        message,
        candidate: app.candidateName,
        position: app.jobTitle,
        time: timeAgo,
        status,
      });
    }

    // Process interviews into activities
    for (const interview of recentInterviews) {
      const timeDiff = Date.now() - new Date(interview.scheduledAt).getTime();
      const timeAgo = this.formatTimeAgo(timeDiff);
      
      let message = '';
      let status: 'positive' | 'negative' | 'neutral' = 'neutral';
      
      switch (interview.status) {
        case 'scheduled':
          message = 'Interview scheduled';
          status = 'positive';
          break;
        case 'completed':
          message = 'Interview completed';
          status = 'positive';
          break;
        case 'no_show':
          message = 'Interview no-show';
          status = 'negative';
          break;
        case 'cancelled':
          message = 'Interview cancelled';
          status = 'negative';
          break;
        default:
          message = 'Interview status updated';
          status = 'neutral';
      }

      activities.push({
        id: `interview-${interview.id}`,
        message,
        candidate: interview.candidateName,
        position: interview.jobTitle,
        time: timeAgo,
        status,
      });
    }

    // Sort all activities by most recent first
    activities.sort((a, b) => {
      const timeA = this.parseTimeAgo(a.time);
      const timeB = this.parseTimeAgo(b.time);
      return timeA - timeB;
    });

    return activities.slice(0, 15); // Return top 15 most recent activities
  }

  private formatTimeAgo(timeDiff: number): string {
    const seconds = Math.floor(timeDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  }

  private parseTimeAgo(timeAgo: string): number {
    if (timeAgo === 'Just now') return 0;
    
    const match = timeAgo.match(/(\d+)\s+(minute|hour|day)s?\s+ago/);
    if (!match) return 0;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'minute': return value;
      case 'hour': return value * 60;
      case 'day': return value * 1440;
      default: return 0;
    }
  }

  // Interview token operations
  async createInterviewToken(token: InsertInterviewToken): Promise<InterviewToken> {
    const [result] = await db.insert(interviewTokens).values(token).returning();
    return result;
  }

  async getInterviewToken(token: string): Promise<InterviewToken | undefined> {
    const [result] = await db.select().from(interviewTokens).where(eq(interviewTokens.token, token));
    return result;
  }

  async updateInterviewToken(token: string, updates: Partial<InsertInterviewToken>): Promise<InterviewToken> {
    const [result] = await db
      .update(interviewTokens)
      .set(updates)
      .where(eq(interviewTokens.token, token))
      .returning();
    return result;
  }

  // User role operations
  async createUserRole(userRole: InsertUserRole): Promise<UserRole> {
    const [result] = await db.insert(userRoles).values(userRole).returning();
    return result;
  }

  async getUserRoles(): Promise<(UserRole & { user: User })[]> {
    const results = await db
      .select()
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id));
    
    return results.map(result => ({
      id: result.user_roles.id,
      userId: result.user_roles.userId,
      role: result.user_roles.role,
      permissions: result.user_roles.permissions || [],
      createdAt: result.user_roles.createdAt,
      updatedAt: result.user_roles.updatedAt,
      user: {
        id: result.users.id,
        email: result.users.email,
        firstName: result.users.firstName,
        lastName: result.users.lastName,
        profileImageUrl: result.users.profileImageUrl,
        createdAt: result.users.createdAt,
        updatedAt: result.users.updatedAt
      }
    }));
  }

  async getUserRole(userId: string): Promise<UserRole | undefined> {
    const [result] = await db.select().from(userRoles).where(eq(userRoles.userId, userId));
    return result;
  }

  async updateUserRole(userId: string, updates: Partial<InsertUserRole>): Promise<UserRole> {
    const [result] = await db
      .update(userRoles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userRoles.userId, userId))
      .returning();
    return result;
  }

  async deleteUserRole(userId: string): Promise<void> {
    await db.delete(userRoles).where(eq(userRoles.userId, userId));
  }

  // Organization settings
  async getOrganizationSettings(): Promise<OrganizationSetting[]> {
    return await db.select().from(organizationSettings);
  }

  async getOrganizationSetting(key: string): Promise<OrganizationSetting | undefined> {
    const [result] = await db.select().from(organizationSettings).where(eq(organizationSettings.key, key));
    return result;
  }

  async upsertOrganizationSetting(setting: InsertOrganizationSetting): Promise<OrganizationSetting> {
    const [result] = await db
      .insert(organizationSettings)
      .values(setting)
      .onConflictDoUpdate({
        target: organizationSettings.key,
        set: {
          value: setting.value,
          updatedBy: setting.updatedBy,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Interview configuration
  async createInterviewConfig(config: InsertInterviewConfig): Promise<InterviewConfig> {
    const [result] = await db.insert(interviewConfigs).values(config).returning();
    return result;
  }

  async getInterviewConfig(jobId: number): Promise<InterviewConfig | undefined> {
    const [result] = await db.select().from(interviewConfigs).where(eq(interviewConfigs.jobId, jobId));
    return result;
  }

  async updateInterviewConfig(jobId: number, updates: Partial<InsertInterviewConfig>): Promise<InterviewConfig> {
    const [result] = await db
      .update(interviewConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(interviewConfigs.jobId, jobId))
      .returning();
    return result;
  }

  // Bulk candidates operations
  async createBulkCandidate(bulkCandidate: InsertBulkCandidate): Promise<BulkCandidate> {
    const [result] = await db.insert(bulkCandidates).values(bulkCandidate).returning();
    return result;
  }

  async getBulkCandidates(bulkJobId: number): Promise<BulkCandidate[]> {
    return await db
      .select()
      .from(bulkCandidates)
      .where(eq(bulkCandidates.bulkJobId, bulkJobId))
      .orderBy(desc(bulkCandidates.matchingScore));
  }

  async updateBulkCandidate(id: number, updates: Partial<InsertBulkCandidate>): Promise<BulkCandidate> {
    const [result] = await db
      .update(bulkCandidates)
      .set(updates)
      .where(eq(bulkCandidates.id, id))
      .returning();
    return result;
  }

  async shortlistBulkCandidates(bulkJobId: number, candidateIds: number[]): Promise<void> {
    if (candidateIds.length === 0) return;
    
    await db
      .update(bulkCandidates)
      .set({ isShortlisted: true })
      .where(and(
        eq(bulkCandidates.bulkJobId, bulkJobId),
        sql`${bulkCandidates.id} = ANY(${candidateIds})`
      ));
  }

  async addBulkCandidatesToMainList(bulkJobId: number, candidateIds: number[]): Promise<Candidate[]> {
    if (candidateIds.length === 0) return [];
    
    // Get the bulk candidates to add
    const bulkCandidatesToAdd = await db
      .select()
      .from(bulkCandidates)
      .where(and(
        eq(bulkCandidates.bulkJobId, bulkJobId),
        sql`${bulkCandidates.id} = ANY(${candidateIds})`
      ));

    const addedCandidates: Candidate[] = [];
    
    for (const bulkCandidate of bulkCandidatesToAdd) {
      // Create main candidate record
      const [newCandidate] = await db.insert(candidates).values({
        firstName: bulkCandidate.firstName || 'Unknown',
        lastName: bulkCandidate.lastName || '',
        email: bulkCandidate.email || '',
        phone: bulkCandidate.phone || '',
        skills: bulkCandidate.skills || [],
        experience: bulkCandidate.experience || 0,
        resumeText: bulkCandidate.resumeText || '',
      }).returning();
      
      addedCandidates.push(newCandidate);
      
      // Mark as added to main list
      await db
        .update(bulkCandidates)
        .set({ addedToMainList: true })
        .where(eq(bulkCandidates.id, bulkCandidate.id));
    }
    
    return addedCandidates;
  }

  // Drive session operations
  async createDriveSession(driveSession: any): Promise<any> {
    const [result] = await db.insert(driveSessions).values(driveSession).returning();
    return result;
  }

  async getDriveSessions(): Promise<any[]> {
    return await db.select().from(driveSessions).orderBy(desc(driveSessions.createdAt));
  }

  async getDriveSession(id: number): Promise<any | undefined> {
    const [result] = await db.select().from(driveSessions).where(eq(driveSessions.id, id));
    return result;
  }

  async updateDriveSession(id: number, updates: any): Promise<any> {
    const [result] = await db
      .update(driveSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(driveSessions.id, id))
      .returning();
    return result;
  }

  async deleteDriveSession(id: number): Promise<void> {
    // Delete all test sessions associated with this drive session
    await db.delete(testSessions).where(eq(testSessions.driveSessionId, id));
    
    // Delete all drive candidates associated with this drive session
    await db.delete(driveCandidates).where(eq(driveCandidates.driveSessionId, id));
    
    // Delete the drive session itself
    await db.delete(driveSessions).where(eq(driveSessions.id, id));
  }

  // Drive candidate operations
  async createDriveCandidate(driveCandidate: any): Promise<any> {
    const [result] = await db.insert(driveCandidates).values(driveCandidate).returning();
    return result;
  }

  async getDriveCandidates(): Promise<any[]> {
    return await db.select().from(driveCandidates).orderBy(desc(driveCandidates.createdAt));
  }

  async getDriveSessionCandidates(driveSessionId: number): Promise<any[]> {
    return await db.select().from(driveCandidates).where(eq(driveCandidates.driveSessionId, driveSessionId)).orderBy(desc(driveCandidates.createdAt));
  }

  async getDriveCandidate(id: number): Promise<any | undefined> {
    const [result] = await db.select().from(driveCandidates).where(eq(driveCandidates.id, id));
    return result;
  }

  async getDriveCandidateByToken(token: string): Promise<any | undefined> {
    const [result] = await db.select().from(driveCandidates).where(eq(driveCandidates.registrationToken, token));
    return result;
  }

  async updateDriveCandidate(id: number, updates: any): Promise<any> {
    const [result] = await db
      .update(driveCandidates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(driveCandidates.id, id))
      .returning();
    return result;
  }

  async deleteDriveCandidate(id: number): Promise<void> {
    await db.delete(driveCandidates).where(eq(driveCandidates.id, id));
  }

  // Aptitude question operations
  async createAptitudeQuestion(question: any): Promise<any> {
    const [result] = await db.insert(aptitudeQuestions).values(question).returning();
    return result;
  }

  async getAptitudeQuestions(driveSessionId: number): Promise<any[]> {
    // Get both global questions (driveSessionId = null) and session-specific questions
    return await db.select().from(aptitudeQuestions).where(
      or(
        isNull(aptitudeQuestions.driveSessionId),
        eq(aptitudeQuestions.driveSessionId, driveSessionId)
      )
    );
  }

  async updateAptitudeQuestion(id: number, updates: any): Promise<any> {
    const [result] = await db
      .update(aptitudeQuestions)
      .set(updates)
      .where(eq(aptitudeQuestions.id, id))
      .returning();
    return result;
  }

  async deleteAptitudeQuestion(id: number): Promise<void> {
    await db.delete(aptitudeQuestions).where(eq(aptitudeQuestions.id, id));
  }

  // Test session operations
  async createTestSession(testSession: any): Promise<any> {
    // Check if a test session already exists for this candidate and round
    const existing = await db
      .select()
      .from(testSessions)
      .where(
        and(
          eq(testSessions.driveCandidateId, testSession.driveCandidateId),
          eq(testSessions.testRound, testSession.testRound)
        )
      );
    
    // If a session already exists, return it instead of creating duplicate
    if (existing.length > 0) {
      return existing[0];
    }

    const [result] = await db.insert(testSessions).values(testSession).returning();
    return result;
  }

  async getTestSessions(): Promise<any[]> {
    return await db.select().from(testSessions).orderBy(desc(testSessions.createdAt));
  }

  async getTestSession(id: number): Promise<any | undefined> {
    const [result] = await db.select().from(testSessions).where(eq(testSessions.id, id));
    return result;
  }

  async getTestSessionByToken(token: string): Promise<any | undefined> {
    const [result] = await db.select().from(testSessions).where(eq(testSessions.testToken, token));
    return result;
  }

  async getTestSessionsByCandidate(candidateId: number): Promise<any[]> {
    return await db.select().from(testSessions).where(eq(testSessions.driveCandidateId, candidateId)).orderBy(desc(testSessions.createdAt));
  }

  async updateTestSession(id: number, updates: any): Promise<any> {
    const [result] = await db
      .update(testSessions)
      .set(updates)
      .where(eq(testSessions.id, id))
      .returning();
    return result;
  }

  async deleteTestSession(id: number): Promise<void> {
    await db.delete(testSessions).where(eq(testSessions.id, id));
  }

  // Platform Configuration Methods
  async createPlatformConfig(config: InsertJobPlatformConfig): Promise<JobPlatformConfig> {
    const [result] = await db.insert(jobPlatformConfigs).values(config).returning();
    return result;
  }

  async getPlatformConfigs(userId: string): Promise<JobPlatformConfig[]> {
    return await db
      .select()
      .from(jobPlatformConfigs)
      .where(eq(jobPlatformConfigs.createdBy, userId))
      .orderBy(desc(jobPlatformConfigs.createdAt));
  }

  async getPlatformConfig(id: number): Promise<JobPlatformConfig | undefined> {
    const [result] = await db.select().from(jobPlatformConfigs).where(eq(jobPlatformConfigs.id, id));
    return result;
  }

  async updatePlatformConfig(id: number, updates: Partial<InsertJobPlatformConfig>): Promise<JobPlatformConfig> {
    const [result] = await db
      .update(jobPlatformConfigs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobPlatformConfigs.id, id))
      .returning();
    return result;
  }

  async deletePlatformConfig(id: number): Promise<void> {
    await db.delete(jobPlatformConfigs).where(eq(jobPlatformConfigs.id, id));
  }

  async testPlatformConnection(id: number): Promise<boolean> {
    // This would integrate with actual platform APIs
    // For now, just update connection status
    await this.updatePlatformConfig(id, { 
      connectionStatus: 'connected', 
      lastSyncAt: new Date() 
    });
    return true;
  }

  // Job Platform Posting Methods
  async createJobPosting(posting: InsertJobPlatformPosting): Promise<JobPlatformPosting> {
    const [result] = await db.insert(jobPlatformPostings).values(posting).returning();
    return result;
  }

  async getJobPostings(jobId?: number): Promise<JobPlatformPosting[]> {
    if (jobId) {
      return await db
        .select()
        .from(jobPlatformPostings)
        .where(eq(jobPlatformPostings.jobId, jobId))
        .orderBy(desc(jobPlatformPostings.createdAt));
    }
    return await db.select().from(jobPlatformPostings).orderBy(desc(jobPlatformPostings.createdAt));
  }

  async updateJobPosting(id: number, updates: Partial<InsertJobPlatformPosting>): Promise<JobPlatformPosting> {
    const [result] = await db
      .update(jobPlatformPostings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobPlatformPostings.id, id))
      .returning();
    return result;
  }

  async deleteJobPosting(id: number): Promise<void> {
    await db.delete(jobPlatformPostings).where(eq(jobPlatformPostings.id, id));
  }

  // Platform Application Methods
  async createPlatformApplication(application: InsertPlatformApplication): Promise<PlatformApplication> {
    const [result] = await db.insert(platformApplications).values(application).returning();
    return result;
  }

  async getPlatformApplications(postingId?: number): Promise<PlatformApplication[]> {
    if (postingId) {
      return await db
        .select()
        .from(platformApplications)
        .where(eq(platformApplications.jobPlatformPostingId, postingId))
        .orderBy(desc(platformApplications.ingestedAt));
    }
    return await db.select().from(platformApplications).orderBy(desc(platformApplications.ingestedAt));
  }

  async updatePlatformApplication(id: number, updates: Partial<InsertPlatformApplication>): Promise<PlatformApplication> {
    const [result] = await db
      .update(platformApplications)
      .set(updates)
      .where(eq(platformApplications.id, id))
      .returning();
    return result;
  }

  async syncPlatformApplications(platformConfigId: number): Promise<number> {
    // This would integrate with actual platform APIs to fetch new applications
    // For now, return 0 as no new applications synced
    await this.updatePlatformConfig(platformConfigId, { lastSyncAt: new Date() });
    return 0;
  }

  // AI Interview methods
  async getAiInterviewSessions(filters?: { interviewId?: number; sessionToken?: string }): Promise<AiInterviewSession[]> {
    let query = db.select().from(aiInterviewSessions);
    
    if (filters?.interviewId) {
      query = query.where(eq(aiInterviewSessions.interviewId, filters.interviewId));
    }
    if (filters?.sessionToken) {
      query = query.where(eq(aiInterviewSessions.sessionToken, filters.sessionToken));
    }
    
    return await query.orderBy(desc(aiInterviewSessions.createdAt));
  }

  async getAiQaChunks(filters?: { sessionId?: number; interviewId?: number }): Promise<AiQaChunk[]> {
    let query = db.select().from(aiQaChunks);
    
    if (filters?.sessionId) {
      query = query.where(eq(aiQaChunks.sessionId, filters.sessionId));
    }
    // If we need to filter by interviewId, we'd need to join with aiInterviewSessions
    // For now, we'll just handle sessionId
    
    return await query.orderBy(aiQaChunks.questionNumber);
  }

  async getAiVideoChunks(filters?: { sessionId?: number }): Promise<AiVideoChunk[]> {
    let query = db.select().from(aiVideoChunks);
    
    if (filters?.sessionId) {
      query = query.where(eq(aiVideoChunks.sessionId, filters.sessionId));
    }
    
    return await query.orderBy(aiVideoChunks.chunkNumber);
  }

  async getAiProxyDetections(filters?: { sessionId?: number }): Promise<AiProxyDetection[]> {
    let query = db.select().from(aiProxyDetection);
    
    if (filters?.sessionId) {
      query = query.where(eq(aiProxyDetection.sessionId, filters.sessionId));
    }
    
    return await query.orderBy(desc(aiProxyDetection.createdAt));
  }
}

export const storage = new DatabaseStorage();

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { InnerMenu } from "@/components/ui/inner-menu";
import CalendarGrid from "@/components/calendar/calendar-grid";
import ResultsTable from "@/components/results/results-table-simple";
import { AIInterviewLauncher } from "@/components/ai-interview-launcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  BarChart3, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  Play,
  Plus,
  Users,
  TrendingUp,
  Award,
  Briefcase,
  UserCheck
} from "lucide-react";
import { useLocation } from "wouter";
import type { 
  Job, 
  Candidate, 
  Application, 
  Interview, 
  InterviewRound, 
  DecisionMatrix, 
  JobOffer, 
  OnboardingTask,
  Evaluation
} from "@shared/schema";

interface CandidateApplication {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  jobId: number;
  applicationId: number;
  status: string;
  matchingScore: string;
  appliedAt: string;
}

interface InterviewWithDetails {
  id: number;
  applicationId: number;
  candidateName: string;
  jobTitle: string;
  type: string;
  status: string;
  scheduledAt: Date;
  duration: number;
  format: string;
  interviewerName?: string;
  meetingUrl?: string;
}

interface EvaluationWithDetails {
  id: number;
  interviewId: number;
  candidateName: string;
  jobTitle: string;
  technicalScore: number;
  behavioralScore: number;
  overallScore: number;
  recommendation: string;
  interviewDate: Date;
}

export default function IntegratedInterviews() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("calendar");
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Results state
  const [filters, setFilters] = useState({
    jobId: "all",
    stage: "all",
    scoreRange: "all",
    dateRange: "last-30-days",
    recommendation: "all",
  });

  // Interview Launcher state
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Data queries
  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: isAuthenticated,
  });

  const { data: candidates = [] } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
    enabled: isAuthenticated,
  });

  const { data: applications = [] } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated,
  });

  const { data: interviews = [] } = useQuery<Interview[]>({
    queryKey: ["/api/interviews"],
    enabled: isAuthenticated,
  });

  const { data: interviewRounds = [] } = useQuery<InterviewRound[]>({
    queryKey: ["/api/interview-rounds"],
    enabled: isAuthenticated,
  });

  const { data: decisionMatrix = [] } = useQuery<DecisionMatrix[]>({
    queryKey: ["/api/decision-matrix"],
    enabled: isAuthenticated,
  });

  const { data: jobOffers = [] } = useQuery<JobOffer[]>({
    queryKey: ["/api/job-offers"],
    enabled: isAuthenticated,
  });

  const { data: onboardingTasks = [] } = useQuery<OnboardingTask[]>({
    queryKey: ["/api/onboarding-tasks"],
    enabled: isAuthenticated,
  });

  const { data: evaluations = [] } = useQuery<Evaluation[]>({
    queryKey: ["/api/evaluations"],
    enabled: isAuthenticated,
  });

  const { data: candidateApplications = [] } = useQuery<CandidateApplication[]>({
    queryKey: ['/api/candidates-with-applications'],
    enabled: isAuthenticated,
    staleTime: 0,
    gcTime: 0,
  });

  // Calendar data
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: calendarInterviews = [] } = useQuery<InterviewWithDetails[]>({
    queryKey: ["/api/interviews", { 
      startDate: monthStart.toISOString(), 
      endDate: monthEnd.toISOString() 
    }],
    enabled: isAuthenticated && activeTab === "calendar",
  });

  const innerMenuItems = [
    { id: "calendar", label: "Calendar", icon: CalendarIcon },
    { id: "rounds", label: "Rounds", icon: Users },
    { id: "sessions", label: "Sessions", icon: Play },
    { id: "evaluations", label: "Evaluations", icon: BarChart3 },
    { id: "decisions", label: "Decisions", icon: Award },
    { id: "offers", label: "Offers", icon: Briefcase },
    { id: "onboarding", label: "Onboarding", icon: UserCheck },
  ];

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        collapsed={sidebarCollapsed} 
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
        sidebarCollapsed ? 'ml-16' : 'ml-48'
      }`}>
        <div className="flex-1 overflow-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Interview Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Complete interview lifecycle management system
                </p>
              </div>
            </div>

            <InnerMenu 
              items={innerMenuItems}
              activeItem={activeTab}
              onItemChange={setActiveTab}
            />

            <div className="mt-6">
              {activeTab === "calendar" && (
                <CalendarTab 
                  currentDate={currentDate}
                  setCurrentDate={setCurrentDate}
                  interviews={calendarInterviews}
                />
              )}
              
              {activeTab === "rounds" && (
                <RoundsTab 
                  interviewRounds={interviewRounds}
                  jobs={jobs}
                  queryClient={queryClient}
                />
              )}
              
              {activeTab === "sessions" && (
                <SessionsTab 
                  interviews={interviews}
                  applications={applications}
                  candidates={candidates}
                  jobs={jobs}
                  interviewRounds={interviewRounds}
                  candidateApplications={candidateApplications}
                  selectedApplicationId={selectedApplicationId}
                  setSelectedApplicationId={setSelectedApplicationId}
                  queryClient={queryClient}
                />
              )}
              
              {activeTab === "evaluations" && (
                <EvaluationsTab 
                  evaluations={evaluations}
                  filters={filters}
                  setFilters={setFilters}
                  jobs={jobs}
                />
              )}
              
              {activeTab === "decisions" && (
                <DecisionsTab 
                  decisionMatrix={decisionMatrix}
                  applications={applications}
                  candidates={candidates}
                  jobs={jobs}
                  evaluations={evaluations}
                  queryClient={queryClient}
                />
              )}
              
              {activeTab === "offers" && (
                <OffersTab 
                  jobOffers={jobOffers}
                  candidates={candidates}
                  jobs={jobs}
                  queryClient={queryClient}
                />
              )}
              
              {activeTab === "onboarding" && (
                <OnboardingTab 
                  onboardingTasks={onboardingTasks}
                  candidates={candidates}
                  jobOffers={jobOffers}
                  queryClient={queryClient}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Calendar Tab Component
function CalendarTab({ 
  currentDate, 
  setCurrentDate, 
  interviews 
}: { 
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  interviews: InterviewWithDetails[];
}) {
  const upcomingInterviews = interviews
    .filter(interview => new Date(interview.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Interview Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarGrid 
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                interviews={interviews}
              />
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Upcoming Interviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingInterviews.length === 0 ? (
                  <p className="text-gray-500 text-sm">No upcoming interviews</p>
                ) : (
                  upcomingInterviews.map((interview) => (
                    <div 
                      key={interview.id} 
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{interview.candidateName}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs">{interview.jobTitle}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(interview.scheduledAt).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant={interview.status === 'scheduled' ? 'default' : 'secondary'}>
                          {interview.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Import all the individual tab components from the interview-management page
// I'll need to create these components by extracting from the existing interview-management.tsx

// For now, I'll create placeholder components that I'll implement fully
function RoundsTab({ interviewRounds, jobs, queryClient }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Interview Rounds Configuration</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Round
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Interview rounds management will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function SessionsTab({ 
  interviews, 
  applications, 
  candidates, 
  jobs, 
  interviewRounds,
  candidateApplications,
  selectedApplicationId,
  setSelectedApplicationId,
  queryClient 
}: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interview Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Schedule Interview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule New Interview
            </Button>
          </CardContent>
        </Card>

        {/* AI Interview Launcher */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Launch AI Interview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select 
              value={selectedApplicationId?.toString() || ""} 
              onValueChange={(value) => setSelectedApplicationId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select candidate application" />
              </SelectTrigger>
              <SelectContent>
                {candidateApplications.map((app: CandidateApplication) => (
                  <SelectItem key={app.applicationId} value={app.applicationId.toString()}>
                    {app.firstName} {app.lastName} - {app.jobTitle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedApplicationId && (
              <AIInterviewLauncher 
                interviewId={selectedApplicationId}
                candidateName={candidateApplications.find(app => app.applicationId === selectedApplicationId)?.firstName + ' ' + candidateApplications.find(app => app.applicationId === selectedApplicationId)?.lastName || 'Unknown Candidate'}
                positionName={candidateApplications.find(app => app.applicationId === selectedApplicationId)?.jobTitle || 'Unknown Position'}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Interviews Table */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Interviews</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Scheduled At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {interviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No interviews scheduled
                  </TableCell>
                </TableRow>
              ) : (
                interviews.map((interview: any) => {
                  const application = applications.find((app: any) => app.id === interview.applicationId);
                  const candidate = candidates.find((c: any) => c.id === application?.candidateId);
                  const job = jobs.find((j: any) => j.id === application?.jobId);
                  
                  return (
                    <TableRow key={interview.id}>
                      <TableCell>
                        {candidate?.firstName} {candidate?.lastName}
                      </TableCell>
                      <TableCell>{job?.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{interview.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {interview.scheduledAt ? new Date(interview.scheduledAt).toLocaleString() : 'Not scheduled'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={interview.status === 'completed' ? 'default' : 'secondary'}>
                          {interview.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function EvaluationsTab({ evaluations, filters, setFilters, jobs }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Interview Evaluations</h2>
      </div>
      
      {/* Results Table */}
      <Card>
        <CardContent className="p-6">
          <ResultsTable 
            evaluations={evaluations}
            filters={filters}
            onFiltersChange={setFilters}
            jobs={jobs}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionsTab({ decisionMatrix, applications, candidates, jobs, evaluations, queryClient }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Hiring Decisions</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Decision
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Decision matrix will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function OffersTab({ jobOffers, candidates, jobs, queryClient }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Job Offers</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Offer
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Job offers management will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function OnboardingTab({ onboardingTasks, candidates, jobOffers, queryClient }: any) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Onboarding Tasks</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Task
        </Button>
      </div>
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500">Onboarding tasks will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
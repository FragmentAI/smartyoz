import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import CalendarGrid from "@/components/calendar/calendar-grid";
import ResultsTable from "@/components/results/results-table-simple";
import { AIInterviewLauncher } from "@/components/ai-interview-launcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  UserCheck,
  ChevronDown,
  Monitor,
  Target,
  Gift,
  GraduationCap
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
  const [activeTab, setActiveTab] = useState("calendar");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  

  
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

  const { data: rawInterviews = [] } = useQuery({
    queryKey: ["/api/interviews", { 
      startDate: monthStart.toISOString(), 
      endDate: monthEnd.toISOString() 
    }],
    enabled: isAuthenticated,
  });

  // Transform the raw interview data to match the expected structure
  const calendarInterviews: InterviewWithDetails[] = rawInterviews.map((interview: any) => ({
    id: interview.id,
    applicationId: interview.applicationId,
    candidateName: `${interview.application?.candidate?.firstName || ''} ${interview.application?.candidate?.lastName || ''}`.trim(),
    jobTitle: interview.application?.job?.title || 'Unknown Position',
    type: interview.type,
    status: interview.status,
    scheduledAt: new Date(interview.scheduledAt),
    duration: interview.duration,
    format: interview.format,
    interviewerName: interview.interviewerName,
    meetingUrl: interview.meetingUrl,
  }));

  // No longer need createInterviewMutation - using AI Interview Launcher instead



  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-48'}`}>
        <Header />
        <main className="flex-1 overflow-y-auto bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b border-gray-200 px-8 py-4">
              <TabsList className="grid w-full grid-cols-7">
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4" />
                  Calendar
                  {calendarInterviews.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{calendarInterviews.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="rounds" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Rounds
                  {interviewRounds.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{interviewRounds.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sessions" className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Sessions
                  {interviews.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{interviews.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="evaluations" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Evaluations
                  {evaluations.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{evaluations.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="decisions" className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Decisions
                  {decisionMatrix.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{decisionMatrix.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="offers" className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Offers
                  {jobOffers.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{jobOffers.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="onboarding" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Onboarding
                  {onboardingTasks.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{onboardingTasks.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="calendar" className="mt-0 p-6">
              <CalendarTab 
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                interviews={calendarInterviews}
              />
            </TabsContent>

            <TabsContent value="rounds" className="mt-0 p-6">
              <RoundsTab 
                interviewRounds={interviewRounds}
                jobs={jobs}
                queryClient={queryClient}
              />
            </TabsContent>

            <TabsContent value="sessions" className="mt-0 p-6">
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
            </TabsContent>

            <TabsContent value="evaluations" className="mt-0 p-6">
              <EvaluationsTab 
                evaluations={evaluations}
                filters={filters}
                setFilters={setFilters}
                jobs={jobs}
              />
            </TabsContent>

            <TabsContent value="decisions" className="mt-0 p-6">
              <DecisionsTab 
                decisionMatrix={decisionMatrix}
                applications={applications}
                candidates={candidates}
                jobs={jobs}
                evaluations={evaluations}
                queryClient={queryClient}
              />
            </TabsContent>

            <TabsContent value="offers" className="mt-0 p-6">
              <OffersTab 
                jobOffers={jobOffers}
                candidates={candidates}
                jobs={jobs}
                queryClient={queryClient}
              />
            </TabsContent>

            <TabsContent value="onboarding" className="mt-0 p-6">
              <OnboardingTab 
                onboardingTasks={onboardingTasks}
                candidates={candidates}
                jobOffers={jobOffers}
                queryClient={queryClient}
              />
            </TabsContent>
          </Tabs>
        </main>
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

function RoundsTab({ interviewRounds, jobs, queryClient }: any) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    jobId: "",
    title: "",
    roundNumber: 1,
    type: "technical",
    duration: 60,
    format: "video",
    requiredScore: 70,
    interviewerRole: "",
    interviewerId: "", // Add interviewer field
  });
  const { toast } = useToast();

  // Fetch users for interviewer selection
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: isCreateDialogOpen,
  });

  const createRoundMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/interview-rounds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create round');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interview-rounds'] });
      toast({ title: 'Success', description: 'Interview round created successfully' });
      setIsCreateDialogOpen(false);
      setFormData({
        jobId: "",
        title: "",
        roundNumber: 1,
        type: "technical",
        duration: 60,
        format: "video",
        requiredScore: 70,
        interviewerRole: "",
        interviewerId: "",
      });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create interview round', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate mandatory interviewer field for rounds 2 and above
    if (formData.roundNumber >= 2 && !formData.interviewerId) {
      toast({ 
        title: 'Error', 
        description: 'Please select an interviewer for round 2 and above', 
        variant: 'destructive' 
      });
      return;
    }
    
    createRoundMutation.mutate({
      ...formData,
      jobId: parseInt(formData.jobId),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Round
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Interview Round</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="jobId">Job</Label>
                <Select value={formData.jobId} onValueChange={(value) => setFormData({ ...formData, jobId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs?.filter(job => job?.id && job?.title)?.map((job: any) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.title} - {job.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Round Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Technical Round 1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="roundNumber">Round Number</Label>
                  <Input
                    id="roundNumber"
                    type="number"
                    value={formData.roundNumber}
                    onChange={(e) => setFormData({ ...formData, roundNumber: parseInt(e.target.value) })}
                    min="1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="managerial">Managerial</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    min="15"
                    max="180"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="requiredScore">Required Score (%)</Label>
                  <Input
                    id="requiredScore"
                    type="number"
                    value={formData.requiredScore}
                    onChange={(e) => setFormData({ ...formData, requiredScore: parseInt(e.target.value) })}
                    min="0"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="interviewerRole">Interviewer Role</Label>
                <Select value={formData.interviewerRole} onValueChange={(value) => setFormData({ ...formData, interviewerRole: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interviewer role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical_lead">Technical Lead</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="panel">Panel</SelectItem>
                    <SelectItem value="director">Director</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="interviewerId">Assigned Interviewer *</Label>
                <Select value={formData.interviewerId} onValueChange={(value) => setFormData({ ...formData, interviewerId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select interviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createRoundMutation.isPending}>
                  {createRoundMutation.isPending ? 'Creating...' : 'Create Round'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Interview Rounds Table */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Rounds</CardTitle>
        </CardHeader>
        <CardContent>
          {interviewRounds.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No interview rounds configured</p>
              <p className="text-gray-400 text-sm mt-1">Create rounds to define your interview process</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Required Score</TableHead>
                  <TableHead>Interviewer Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {interviewRounds.map((round: any) => {
                  const job = jobs.find((j: any) => j.id === round.jobId);
                  return (
                    <TableRow key={round.id}>
                      <TableCell className="font-medium">{job?.title || 'Unknown Job'}</TableCell>
                      <TableCell>{round.roundNumber} - {round.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{round.type}</Badge>
                      </TableCell>
                      <TableCell>{round.duration} min</TableCell>
                      <TableCell>{round.requiredScore}%</TableCell>
                      <TableCell>{round.interviewerRole}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
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
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    roundId: "",
    applicationId: "",
    scheduledAt: "",
    notes: ""
  });
  const { toast } = useToast();

  const scheduleInterviewMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/interview-rounds/${data.roundId}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to schedule interview');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/interviews'] });
      toast({ title: 'Success', description: 'Interview scheduled successfully' });
      setIsScheduleDialogOpen(false);
      setScheduleForm({
        roundId: "",
        applicationId: "",
        scheduledAt: "",
        notes: ""
      });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to schedule interview', variant: 'destructive' });
    },
  });

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.roundId || !scheduleForm.applicationId || !scheduleForm.scheduledAt) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }
    scheduleInterviewMutation.mutate(scheduleForm);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interview Scheduling */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Schedule Interview from Round
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Interview
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Schedule Interview Session</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleScheduleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="roundId">Interview Round</Label>
                    <Select 
                      value={scheduleForm.roundId} 
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, roundId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select interview round" />
                      </SelectTrigger>
                      <SelectContent>
                        {interviewRounds.map((round: any) => {
                          const job = jobs.find((j: any) => j.id === round.jobId);
                          return (
                            <SelectItem key={round.id} value={round.id.toString()}>
                              {job?.title} - Round {round.roundNumber}: {round.title}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="applicationId">Candidate</Label>
                    <Select 
                      value={scheduleForm.applicationId} 
                      onValueChange={(value) => setScheduleForm({ ...scheduleForm, applicationId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select candidate" />
                      </SelectTrigger>
                      <SelectContent>
                        {candidateApplications.map((app: CandidateApplication) => (
                          <SelectItem key={app.applicationId} value={app.applicationId.toString()}>
                            {app.firstName} {app.lastName} - {app.jobTitle}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="scheduledAt">Schedule Date & Time</Label>
                    <Input
                      id="scheduledAt"
                      type="datetime-local"
                      value={scheduleForm.scheduledAt}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                      placeholder="Any special instructions..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={scheduleInterviewMutation.isPending}
                  >
                    {scheduleInterviewMutation.isPending ? 'Scheduling...' : 'Schedule Interview'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Interview Launcher */}
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
            
            {selectedApplicationId && (() => {
              // Find the interview for the selected application using interviews data
              const selectedInterview = interviews?.find((interview: any) => interview.applicationId === selectedApplicationId);
              const selectedCandidate = candidateApplications.find(app => app.applicationId === selectedApplicationId);
              
              // Only show AIInterviewLauncher if we found a matching interview
              if (selectedInterview && selectedCandidate) {
                return (
                  <AIInterviewLauncher 
                    interviewId={selectedInterview.id}
                    candidateName={`${selectedCandidate.firstName} ${selectedCandidate.lastName}`}
                    positionName={selectedCandidate.jobTitle}
                  />
                );
              }
              
              // If no interview found, show a message
              return (
                <div className="mt-4 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <p className="text-yellow-800">
                    No interview found for this application. Please create an interview first.
                  </p>
                </div>
              );
            })()}
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
                  const job = jobs?.find((j: any) => j.id === application?.jobId);
                  
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
  const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleViewDetails = (evaluation: any) => {
    setSelectedEvaluation(evaluation);
    setShowDetails(true);
  };

  const handleBackToResults = () => {
    setShowDetails(false);
    setSelectedEvaluation(null);
  };

  if (showDetails && selectedEvaluation) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToResults}>
            ← Back to Results
          </Button>
          <h2 className="text-xl font-semibold">Evaluation Details</h2>
        </div>
        
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Candidate Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Interview ID:</span> {selectedEvaluation.interviewId}</p>
                  <p><span className="font-medium">Technical Score:</span> {selectedEvaluation.technicalScore}%</p>
                  <p><span className="font-medium">Behavioral Score:</span> {selectedEvaluation.behavioralScore}%</p>
                  <p><span className="font-medium">Overall Score:</span> {selectedEvaluation.overallScore}%</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Recommendation</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Status:</span> {selectedEvaluation.recommendation}</p>
                  <p><span className="font-medium">Interview Date:</span> {new Date(selectedEvaluation.interviewDate).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            {selectedEvaluation.feedback && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Detailed Feedback</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{selectedEvaluation.feedback}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Interview Evaluations</h2>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {evaluations.filter((e: any) => e.recommendation?.toLowerCase().includes('hire')).length}
                </p>
                <p className="text-sm text-gray-600">Hire Recommended</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">
                  {evaluations.filter((e: any) => e.recommendation?.toLowerCase().includes('maybe') || e.recommendation?.toLowerCase().includes('consider')).length}
                </p>
                <p className="text-sm text-gray-600">Maybe/Consider</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {evaluations.filter((e: any) => e.recommendation?.toLowerCase().includes('reject') || e.recommendation?.toLowerCase().includes('no')).length}
                </p>
                <p className="text-sm text-gray-600">Not Recommended</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {evaluations.length > 0 ? Math.round(evaluations.reduce((sum: number, e: any) => sum + (e.overallScore || 0), 0) / evaluations.length) : 0}%
                </p>
                <p className="text-sm text-gray-600">Average Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Evaluations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Results</CardTitle>
        </CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No evaluations found</p>
              <p className="text-gray-400 text-sm mt-1">Evaluations will appear here after interviews are completed</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interview ID</TableHead>
                  <TableHead>Technical Score</TableHead>
                  <TableHead>Behavioral Score</TableHead>
                  <TableHead>Overall Score</TableHead>
                  <TableHead>Recommendation</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evaluations.map((evaluation: any) => (
                  <TableRow key={evaluation.id}>
                    <TableCell className="font-medium">{evaluation.interviewId}</TableCell>
                    <TableCell>{evaluation.technicalScore}%</TableCell>
                    <TableCell>{evaluation.behavioralScore}%</TableCell>
                    <TableCell>
                      <span className={
                        evaluation.overallScore >= 80 ? 'text-green-600 font-semibold' :
                        evaluation.overallScore >= 60 ? 'text-yellow-600 font-semibold' :
                        'text-red-600 font-semibold'
                      }>
                        {evaluation.overallScore}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        evaluation.recommendation?.toLowerCase().includes('hire') ? 'default' :
                        evaluation.recommendation?.toLowerCase().includes('maybe') ? 'secondary' :
                        'destructive'
                      }>
                        {evaluation.recommendation}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(evaluation.interviewDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(evaluation)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionsTab({ decisionMatrix, applications, candidates, jobs, evaluations, queryClient }: any) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<any>(null);
  const [formData, setFormData] = useState({
    applicationId: "",
    evaluationId: "",
    decision: "pending",
    notes: "",
    nextRound: "",
  });
  const { toast } = useToast();

  // Fetch offers and onboarding tasks for workflow display
  const { data: offers = [] } = useQuery({
    queryKey: ['/api/job-offers'],
    queryFn: async () => {
      const response = await fetch('/api/job-offers');
      if (!response.ok) throw new Error('Failed to fetch offers');
      return response.json();
    }
  });

  const { data: onboardingTasks = [] } = useQuery({
    queryKey: ['/api/onboarding-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/onboarding-tasks');
      if (!response.ok) throw new Error('Failed to fetch onboarding tasks');
      return response.json();
    }
  });

  const createDecisionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/decision-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create decision');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/decision-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['/api/job-offers'] });
      toast({ title: 'Success', description: 'Decision created successfully' });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create decision', variant: 'destructive' });
    },
  });

  const updateDecisionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/decision-matrix/${editingDecision.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update decision');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/decision-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['/api/job-offers'] });
      toast({ title: 'Success', description: 'Decision updated successfully' });
      setIsEditDialogOpen(false);
      setEditingDecision(null);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update decision', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      applicationId: "",
      evaluationId: "",
      decision: "pending",
      notes: "",
      nextRound: "",
    });
  };

  const handleEditDecision = (decision: any) => {
    setEditingDecision(decision);
    setFormData({
      applicationId: decision.applicationId.toString(),
      evaluationId: decision.evaluationId ? decision.evaluationId.toString() : "none",
      decision: decision.finalRecommendation || decision.decision || "pending",
      notes: decision.decisionNotes || "",
      nextRound: decision.nextRound || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const decisionData = {
      ...formData,
      applicationId: parseInt(formData.applicationId),
      evaluationId: formData.evaluationId && formData.evaluationId !== "none" ? parseInt(formData.evaluationId) : null,
    };

    if (editingDecision) {
      updateDecisionMutation.mutate(decisionData);
    } else {
      createDecisionMutation.mutate(decisionData);
    }
  };

  return (
    <div className="space-y-6">
      {/* Automated Workflow Progress */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950/20 dark:to-green-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Automated Hiring Workflow
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Our intelligent system automatically handles the hiring pipeline with minimal human involvement
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {/* Decisions Stage */}
            <div className="flex flex-col items-center text-center min-w-0 flex-1">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full mb-2">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium text-sm mb-1">1. Decisions</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Make hiring decisions</p>
              <Badge variant="secondary" className="text-xs">
                {decisionMatrix.length} decisions made
              </Badge>
            </div>

            {/* Arrow */}
            <div className="flex items-center mx-4">
              <div className="h-0.5 w-8 bg-gray-300 dark:bg-gray-600"></div>
              <TrendingUp className="h-4 w-4 text-gray-400 mx-1" />
              <div className="h-0.5 w-8 bg-gray-300 dark:bg-gray-600"></div>
            </div>

            {/* Offers Stage */}
            <div className="flex flex-col items-center text-center min-w-0 flex-1">
              <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full mb-2">
                <Briefcase className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-sm mb-1">2. Auto-Offers</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Generated when "hire" decided</p>
              <Badge variant="secondary" className="text-xs">
                {offers.length} offers created
              </Badge>
            </div>

            {/* Arrow */}
            <div className="flex items-center mx-4">
              <div className="h-0.5 w-8 bg-gray-300 dark:bg-gray-600"></div>
              <TrendingUp className="h-4 w-4 text-gray-400 mx-1" />
              <div className="h-0.5 w-8 bg-gray-300 dark:bg-gray-600"></div>
            </div>

            {/* Onboarding Stage */}
            <div className="flex flex-col items-center text-center min-w-0 flex-1">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full mb-2">
                <UserCheck className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium text-sm mb-1">3. Auto-Onboarding</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Created when offer accepted</p>
              <Badge variant="secondary" className="text-xs">
                {onboardingTasks.length} tasks created
              </Badge>
            </div>
          </div>

          {/* Workflow Benefits */}
          <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <Award className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">90% Faster</p>
              </div>
              <div>
                <CheckCircle className="h-4 w-4 text-green-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">100% Automated</p>
              </div>
              <div>
                <Users className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                <p className="text-xs text-gray-600 dark:text-gray-400">Zero Manual Work</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Hiring Decisions</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Decision
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Hiring Decision</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="applicationId">Application</Label>
                <Select value={formData.applicationId} onValueChange={(value) => setFormData({ ...formData, applicationId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map((app: any) => {
                      const candidate = candidates.find((c: any) => c.id === app.candidateId);
                      const job = jobs.find((j: any) => j.id === app.jobId);
                      return (
                        <SelectItem key={app.id} value={app.id.toString()}>
                          {candidate?.firstName} {candidate?.lastName} - {job?.title}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="evaluationId">Evaluation (Optional)</Label>
                <Select value={formData.evaluationId} onValueChange={(value) => setFormData({ ...formData, evaluationId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select evaluation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No evaluation</SelectItem>
                    {evaluations.map((evaluation: any) => (
                      <SelectItem key={evaluation.id} value={evaluation.id.toString()}>
                        Interview {evaluation.interviewId} - {evaluation.recommendation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="decision">Decision</Label>
                <Select value={formData.decision} onValueChange={(value) => setFormData({ ...formData, decision: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="proceed">Proceed to Next Round</SelectItem>
                    <SelectItem value="hire">Hire</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nextRound">Next Round (if proceeding)</Label>
                <Input
                  id="nextRound"
                  value={formData.nextRound}
                  onChange={(e) => setFormData({ ...formData, nextRound: e.target.value })}
                  placeholder="e.g., Technical Round 2"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Decision notes and feedback"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDecisionMutation.isPending}>
                  {createDecisionMutation.isPending ? 'Creating...' : 'Create Decision'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Decision Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Hiring Decision</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="decision">Decision</Label>
                <Select value={formData.decision} onValueChange={(value) => setFormData({ ...formData, decision: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="proceed">Proceed to Next Round</SelectItem>
                    <SelectItem value="hire">Hire</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="nextRound">Next Round (if proceeding)</Label>
                <Input
                  id="nextRound"
                  value={formData.nextRound}
                  onChange={(e) => setFormData({ ...formData, nextRound: e.target.value })}
                  placeholder="e.g., Technical Round 2"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Decision notes and feedback"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingDecision(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateDecisionMutation.isPending}>
                  {updateDecisionMutation.isPending ? 'Updating...' : 'Update Decision'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Decision Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          {decisionMatrix.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No decisions recorded</p>
              <p className="text-gray-400 text-sm mt-1">Add decisions for candidate applications</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Next Round</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {decisionMatrix.map((decision: any) => {
                  const application = applications.find((app: any) => app.id === decision.applicationId);
                  const candidate = candidates.find((c: any) => c.id === application?.candidateId);
                  const job = jobs?.find((j: any) => j.id === application?.jobId);
                  
                  return (
                    <TableRow key={decision.id}>
                      <TableCell className="font-medium">
                        {candidate?.firstName} {candidate?.lastName}
                      </TableCell>
                      <TableCell>{job?.title}</TableCell>
                      <TableCell>
                        <Badge variant={
                          decision.finalRecommendation === 'hire' ? 'default' :
                          decision.finalRecommendation === 'proceed' ? 'secondary' :
                          decision.finalRecommendation === 'reject' ? 'destructive' :
                          'outline'
                        }>
                          {decision.finalRecommendation}
                        </Badge>
                      </TableCell>
                      <TableCell>{decision.nextRound || '-'}</TableCell>
                      <TableCell>{new Date(decision.decisionMadeAt || decision.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => handleEditDecision(decision)}>
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OffersTab({ jobOffers, candidates, jobs, queryClient }: any) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any>(null);
  const [formData, setFormData] = useState({
    candidateId: "",
    jobId: "",
    salary: "",
    benefits: "",
    startDate: "",
    deadline: "",
    status: "pending",
  });
  const { toast } = useToast();

  const createOfferMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/job-offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create offer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-offers'] });
      toast({ title: 'Success', description: 'Job offer created successfully' });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create job offer', variant: 'destructive' });
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ data, offerId }: { data: any, offerId?: number }) => {
      const id = offerId || editingOffer?.id;
      if (!id) throw new Error('No offer ID provided');
      
      const response = await fetch(`/api/job-offers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update offer');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-offers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-tasks'] });
      toast({ title: 'Success', description: 'Job offer updated successfully' });
      setIsEditDialogOpen(false);
      setEditingOffer(null);
      resetForm();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update job offer', variant: 'destructive' });
    },
  });

  const resetForm = () => {
    setFormData({
      candidateId: "",
      jobId: "",
      salary: "",
      benefits: "",
      startDate: "",
      deadline: "",
      status: "pending",
    });
  };

  const handleEditOffer = (offer: any) => {
    setEditingOffer(offer);
    setFormData({
      candidateId: offer.candidateId.toString(),
      jobId: offer.jobId.toString(),
      salary: offer.baseSalary || "",
      benefits: Array.isArray(offer.benefits) ? offer.benefits.join(', ') : offer.benefits || "",
      startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : "",
      deadline: offer.expiredAt ? new Date(offer.expiredAt).toISOString().split('T')[0] : "",
      status: offer.status || "pending",
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const offerData = {
      candidateId: parseInt(formData.candidateId),
      jobId: parseInt(formData.jobId),
      baseSalary: formData.salary,
      benefits: formData.benefits ? formData.benefits.split(',').map(b => b.trim()) : [],
      startDate: formData.startDate ? new Date(formData.startDate) : null,
      expiredAt: formData.deadline ? new Date(formData.deadline) : null,
      status: formData.status,
      ...(editingOffer ? {} : { offerTitle: 'Job Offer', department: 'General', workType: 'onsite' })
    };

    if (editingOffer) {
      updateOfferMutation.mutate({ data: offerData });
    } else {
      createOfferMutation.mutate(offerData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Job Offer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="candidateId">Candidate</Label>
                <Select value={formData.candidateId} onValueChange={(value) => setFormData({ ...formData, candidateId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates.map((candidate: any) => (
                      <SelectItem key={candidate.id} value={candidate.id.toString()}>
                        {candidate.firstName} {candidate.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="jobId">Job Position</Label>
                <Select value={formData.jobId} onValueChange={(value) => setFormData({ ...formData, jobId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs?.filter(job => job?.id && job?.title)?.map((job: any) => (
                      <SelectItem key={job.id} value={job.id.toString()}>
                        {job.title} - {job.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="salary">Salary Offer</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="Annual salary"
                  required
                />
              </div>

              <div>
                <Label htmlFor="benefits">Benefits Package</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Health insurance, vacation days, etc."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Response Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createOfferMutation.isPending}>
                  {createOfferMutation.isPending ? 'Creating...' : 'Create Offer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Offer Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Job Offer</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="salary">Salary Offer</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="Annual salary"
                  required
                />
              </div>

              <div>
                <Label htmlFor="benefits">Benefits Package</Label>
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Health insurance, vacation days, etc."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deadline">Response Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingOffer(null);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateOfferMutation.isPending}>
                  {updateOfferMutation.isPending ? 'Updating...' : 'Update Offer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Job Offers</CardTitle>
        </CardHeader>
        <CardContent>
          {jobOffers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No job offers created</p>
              <p className="text-gray-400 text-sm mt-1">Create offers for selected candidates</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobOffers.map((offer: any) => {
                  const candidate = candidates.find((c: any) => c.id === offer.candidateId);
                  const job = jobs?.find((j: any) => j.id === offer.jobId);
                  
                  return (
                    <TableRow key={offer.id}>
                      <TableCell className="font-medium">
                        {candidate?.firstName} {candidate?.lastName}
                      </TableCell>
                      <TableCell>{job?.title}</TableCell>
                      <TableCell>${offer.salary?.toLocaleString()}</TableCell>
                      <TableCell>{new Date(offer.startDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(offer.deadline).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          offer.status === 'accepted' ? 'default' :
                          offer.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {offer.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditOffer(offer)}>
                            Edit
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Status <ChevronDown className="h-4 w-4 ml-1" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => updateOfferMutation.mutate({ data: { status: 'accepted' }, offerId: offer.id })}>
                                Mark as Accepted
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateOfferMutation.mutate({ data: { status: 'rejected' }, offerId: offer.id })}>
                                Mark as Rejected
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateOfferMutation.mutate({ data: { status: 'pending' }, offerId: offer.id })}>
                                Mark as Pending
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OnboardingTab({ onboardingTasks, candidates, jobOffers, queryClient }: any) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [formData, setFormData] = useState({
    candidateId: "",
    title: "",
    description: "",
    dueDate: "",
    priority: "medium",
    category: "documentation",
    assignedTo: "",
  });
  const [taskFormData, setTaskFormData] = useState({
    taskTitle: "",
    taskDescription: "",
    taskType: "",
    status: "",
    dueDate: "",
  });
  const { toast } = useToast();

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/onboarding-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-tasks'] });
      toast({ title: 'Success', description: 'Onboarding task created successfully' });
      setIsCreateDialogOpen(false);
      setFormData({
        candidateId: "",
        title: "",
        description: "",
        dueDate: "",
        priority: "medium",
        category: "documentation",
        assignedTo: "",
      });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to create onboarding task', variant: 'destructive' });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/onboarding-tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding-tasks'] });
      toast({ title: 'Success', description: 'Onboarding task updated successfully' });
      setIsEditDialogOpen(false);
      setEditingTask(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update onboarding task', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTaskMutation.mutate({
      ...formData,
      candidateId: parseInt(formData.candidateId),
    });
  };

  const handleEditTask = (task: any) => {
    setEditingTask(task);
    setTaskFormData({
      taskTitle: task.taskTitle,
      taskDescription: task.taskDescription,
      taskType: task.taskType,
      status: task.status,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTaskMutation.mutate(taskFormData);
  };

  // Get candidates who have accepted job offers
  const acceptedCandidates = candidates.filter((candidate: any) =>
    jobOffers.some((offer: any) => offer.candidateId === candidate.id && offer.status === 'accepted')
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Onboarding Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="candidateId">New Hire</Label>
                <Select value={formData.candidateId} onValueChange={(value) => setFormData({ ...formData, candidateId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new hire" />
                  </SelectTrigger>
                  <SelectContent>
                    {acceptedCandidates.length === 0 ? (
                      <SelectItem value="none" disabled>No candidates with accepted offers</SelectItem>
                    ) : (
                      acceptedCandidates.map((candidate: any) => (
                        <SelectItem key={candidate.id} value={candidate.id.toString()}>
                          {candidate.firstName} {candidate.lastName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Complete I-9 form"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task details and instructions"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="documentation">Documentation</SelectItem>
                      <SelectItem value="equipment">Equipment Setup</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="orientation">Orientation</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Input
                    id="assignedTo"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    placeholder="HR manager, etc."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Onboarding Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <Label htmlFor="taskTitle">Task Title</Label>
                <Input
                  id="taskTitle"
                  value={taskFormData.taskTitle}
                  onChange={(e) => setTaskFormData({ ...taskFormData, taskTitle: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="taskDescription">Description</Label>
                <textarea
                  id="taskDescription"
                  className="w-full min-h-[80px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                  value={taskFormData.taskDescription}
                  onChange={(e) => setTaskFormData({ ...taskFormData, taskDescription: e.target.value })}
                  placeholder="Task details and instructions"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taskType">Type</Label>
                  <Select value={taskFormData.taskType} onValueChange={(value) => setTaskFormData({ ...taskFormData, taskType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Documentation</SelectItem>
                      <SelectItem value="system_access">System Access</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={taskFormData.status} onValueChange={(value) => setTaskFormData({ ...taskFormData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={taskFormData.dueDate}
                  onChange={(e) => setTaskFormData({ ...taskFormData, dueDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTaskMutation.isPending}>
                  {updateTaskMutation.isPending ? 'Updating...' : 'Update Task'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Onboarding Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {onboardingTasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No onboarding tasks created</p>
              <p className="text-gray-400 text-sm mt-1">Create tasks for new hires</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>New Hire</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {onboardingTasks.map((task: any) => {
                  const candidate = candidates.find((c: any) => c.id === task.candidateId);
                  
                  return (
                    <TableRow key={task.id}>
                      <TableCell className="font-medium">
                        {candidate?.firstName} {candidate?.lastName}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{task.taskTitle}</div>
                          <div className="text-sm text-gray-500">{task.taskDescription}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{task.taskType}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          task.status === 'completed' ? 'default' : 'secondary'
                        }>
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{new Date(task.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{task.createdBy}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditTask(task)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
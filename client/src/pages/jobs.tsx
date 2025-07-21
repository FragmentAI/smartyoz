import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import JobsTable from "@/components/jobs/jobs-table";
import CreateJobDialog from "@/components/jobs/create-job-dialog";
import JobDetailsDialog from "@/components/jobs/job-details-dialog";
import ManageJobDialog from "@/components/jobs/job-manage-dialog";
import PlatformPostingDialog from "@/components/jobs/platform-posting-dialog";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { 
  FileText, 
  Users, 
  Globe, 
  CheckCircle, 
  Bot,
  CalendarDays,
  Monitor,
  Clock,
  PlayCircle,
  UserCheck,
  AlertTriangle,
  TrendingUp,
  Filter,
  ChevronRight,
  Building2,
  Search,
  MessageSquare,
  Archive,
  Settings,
  Plus,
  Send,
  Linkedin,
  ExternalLink,
  Loader2,
  RefreshCw,
  Zap
} from "lucide-react";
import { Job } from "@shared/schema";

export default function Jobs() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [isPlatformPostingOpen, setIsPlatformPostingOpen] = useState(false);
  const [jobToPost, setJobToPost] = useState<Job | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [activePlatform, setActivePlatform] = useState<string | null>(null);


  // API queries
  const { data: jobs = [], isLoading: jobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: isAuthenticated,
  });

  const { data: archivedJobs = [], isLoading: archivedJobsLoading } = useQuery<Job[]>({
    queryKey: ["/api/jobs/archived"],
    enabled: isAuthenticated,
  });

  const { data: applications = [] } = useQuery<any[]>({
    queryKey: ["/api/applications"],
    enabled: isAuthenticated,
  });

  // Platform configuration queries
  const { data: platformConfigs = [] } = useQuery<any[]>({
    queryKey: ["/api/platform-configs"],
    enabled: isAuthenticated,
  });

  const { data: platformStatuses = [] } = useQuery<any[]>({
    queryKey: ["/api/platform-configs/status"],
    enabled: isAuthenticated,
  });

  const { data: jobPostings = [] } = useQuery<any[]>({
    queryKey: ["/api/job-postings"],
    enabled: isAuthenticated,
  });



  // Platform mutations
  const bulkPostMutation = useMutation({
    mutationFn: async (data: { platformConfigIds: number[], customizations: any }) => {
      return await apiRequest('/api/jobs/bulk-post-to-platforms', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Posting Successful",
        description: data.message || "Jobs posted to platforms successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Posting Failed",
        description: error.message || "Failed to post jobs to platforms",
        variant: "destructive"
      });
    }
  });

  const bulkSyncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/platform-configs/bulk-sync', {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Successful",
        description: data.message || "Applications synced successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync applications",
        variant: "destructive"
      });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: async (configId: number) => {
      return await apiRequest(`/api/platform-configs/${configId}/test`, {
        method: 'POST'
      });
    },
    onSuccess: (data, configId) => {
      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-configs/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Failed to test connection",
        variant: "destructive"
      });
    }
  });

  // Hiring workflow mutation
  const advanceStageMutation = useMutation({
    mutationFn: async ({ applicationId, newStatus }: { applicationId: number, newStatus: string }) => {
      return await apiRequest('/api/hiring/advance-stage', {
        method: 'POST',
        body: JSON.stringify({ applicationId, newStatus })
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Stage Advanced",
        description: data.message,
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Advance Stage",
        description: error.message || "Failed to advance hiring stage",
        variant: "destructive"
      });
    }
  });

  // Computed values
  const activeJobs = jobs.filter(job => job.status !== 'closed' && job.status !== 'dropped');

  // Process flow stage statistics
  const getJobStageStats = () => {
    const stats = {
      created: 0,
      posted: 0,
      applications: 0,
      screened: 0,
      interviews: 0,
      rounds: 0,
      offers: 0,
      hired: 0
    };

    activeJobs.forEach(job => {
      const jobApplications = applications.filter(app => app.jobId === job.id);
      
      stats.created++;
      if (job.status === 'active') stats.posted++;
      
      if (jobApplications.length > 0) {
        stats.applications++;
        
        const screenedApps = jobApplications.filter(app => 
          app.status === 'qualified' || app.status === 'interviewed' || app.status === 'offered' || app.status === 'hired'
        );
        if (screenedApps.length > 0) stats.screened++;
        
        const interviewedApps = jobApplications.filter(app => 
          app.status === 'interviewed' || app.status === 'offered' || app.status === 'hired'
        );
        if (interviewedApps.length > 0) stats.interviews++;
        
        const roundsApps = jobApplications.filter(app => 
          app.status === 'technical_round' || app.status === 'final_round' || app.status === 'offered' || app.status === 'hired'
        );
        if (roundsApps.length > 0) stats.rounds++;
        
        const offeredApps = jobApplications.filter(app => 
          app.status === 'offered' || app.status === 'hired'
        );
        if (offeredApps.length > 0) stats.offers++;
        
        const hiredApps = jobApplications.filter(app => 
          app.status === 'hired'
        );
        if (hiredApps.length > 0) stats.hired++;
      }
    });

    return stats;
  };

  const stageStats = getJobStageStats();

  const processStages = [
    {
      id: 'created',
      title: 'Job Created',
      description: 'New jobs posted to system',
      icon: FileText,
      count: stageStats.created,
      color: 'bg-blue-100 text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      id: 'posted',
      title: 'Posted to Platforms',
      description: 'Live on job boards',
      icon: Globe,
      count: stageStats.posted,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      id: 'applications',
      title: 'Applications Received',
      description: 'Candidates applied',
      icon: Users,
      count: stageStats.applications,
      color: 'bg-orange-100 text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'screened',
      title: 'Profiles Screened',
      description: 'AI screening completed',
      icon: Bot,
      count: stageStats.screened,
      color: 'bg-purple-100 text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      id: 'interviews',
      title: 'Interviews Scheduled',
      description: 'Initial interviews planned',
      icon: CalendarDays,
      count: stageStats.interviews,
      color: 'bg-pink-100 text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      id: 'rounds',
      title: 'Interview Rounds',
      description: 'Technical & final rounds',
      icon: Users,
      count: stageStats.rounds,
      color: 'bg-indigo-100 text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      id: 'offers',
      title: 'Offers Extended',
      description: 'Job offers sent',
      icon: CheckCircle,
      count: stageStats.offers,
      color: 'bg-emerald-100 text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      id: 'hired',
      title: 'Hired',
      description: 'Candidates onboarded',
      icon: CheckCircle,
      count: stageStats.hired,
      color: 'bg-green-100 text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  // Choose jobs to display based on showArchived state
  const jobsToShow = showArchived ? archivedJobs : activeJobs;
  
  const filteredJobs = selectedFilter === "all" || showArchived ? jobsToShow : 
    jobsToShow.filter(job => {
      const jobApplications = applications.filter(app => app.jobId === job.id);
      
      switch (selectedFilter) {
        case 'created':
          return true;
        case 'posted':
          return job.status === 'active';
        case 'applications':
          return jobApplications.length > 0;
        case 'screened':
          return jobApplications.some(app => 
            app.status === 'qualified' || app.status === 'interviewed' || app.status === 'offered' || app.status === 'hired'
          );
        case 'interviews':
          return jobApplications.some(app => 
            app.status === 'interviewed' || app.status === 'offered' || app.status === 'hired'
          );
        case 'rounds':
          return jobApplications.some(app => 
            app.status === 'technical_round' || app.status === 'final_round' || app.status === 'offered' || app.status === 'hired'
          );
        case 'offers':
          return jobApplications.some(app => 
            app.status === 'offered' || app.status === 'hired'
          );
        case 'hired':
          return jobApplications.some(app => 
            app.status === 'hired'
          );
        default:
          return true;
      }
    });

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-48'}`}>
        <Header />
        <main className="flex-1 overflow-y-auto bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b border-gray-200 px-8 py-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Job
                  </Button>
                </div>
              </div>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Jobs</TabsTrigger>
                <TabsTrigger value="platforms">Multi-Platform</TabsTrigger>
              </TabsList>
            </div>



            <TabsContent value="active" className="mt-0 p-8">
              {/* Job Listings Content */}
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Pipeline Active
                  </Badge>
                  <Button
                    variant="outline"
                    onClick={() => setShowArchived(!showArchived)}
                    className="flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    {showArchived ? 'Show Active Jobs' : `Archived Jobs (${archivedJobs.length})`}
                  </Button>
                </div>

              {/* Process Flow Filter */}
              {!showArchived && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Filter by stage:</span>
                  </div>
                  <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      <SelectItem value="created">Job Created</SelectItem>
                      <SelectItem value="posted">Posted to Platforms</SelectItem>
                      <SelectItem value="applications">Applications Received</SelectItem>
                      <SelectItem value="screened">Profiles Screened</SelectItem>
                      <SelectItem value="interviews">Interviews Scheduled</SelectItem>
                      <SelectItem value="rounds">Interview Rounds</SelectItem>
                      <SelectItem value="offers">Offers Extended</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                    </SelectContent>
                  </Select>
                  <Badge variant="outline" className="ml-2">
                    {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}

              {showArchived && (
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Archived Jobs</span>
                  </div>
                  <Badge variant="outline">
                    {archivedJobs.length} archived job{archivedJobs.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
              )}

              {/* Modern Horizontal Hiring Pipeline */}
              {!showArchived && (
                <Card className="mb-8 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <TrendingUp className="w-5 h-5 text-primary" />
                          Hiring Pipeline
                        </CardTitle>
                        <CardDescription className="text-sm">Click any stage to view candidates</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>
                        Live
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {processStages.map((stage, index) => (
                        <div key={stage.id} className="flex items-center flex-shrink-0">
                          <button
                            onClick={() => {
                              setSelectedFilter(stage.id);
                              // Scroll to jobs list
                              const jobsList = document.querySelector('[data-jobs-list]');
                              if (jobsList) {
                                jobsList.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            className={`group relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:scale-105 active:scale-95 min-w-[120px] ${
                              selectedFilter === stage.id 
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                          >
                            {/* Stage Icon */}
                            <div className={`p-2 rounded-lg mb-2 transition-colors ${
                              selectedFilter === stage.id
                                ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400'
                                : stage.color
                            }`}>
                              <stage.icon className="w-4 h-4" />
                            </div>
                            
                            {/* Count */}
                            <div className={`text-xl font-bold mb-1 transition-colors ${
                              selectedFilter === stage.id
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-900 dark:text-gray-100'
                            }`}>
                              {stage.count}
                            </div>
                            
                            {/* Title */}
                            <div className={`text-xs font-medium text-center leading-tight transition-colors ${
                              selectedFilter === stage.id
                                ? 'text-blue-700 dark:text-blue-300'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {stage.title}
                            </div>
                            
                            {/* Hover Effect */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 transition-all duration-300"></div>
                          </button>
                          
                          {/* Connector Arrow */}
                          {index < processStages.length - 1 && (
                            <div className="flex-shrink-0 mx-1">
                              <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    

                  </CardContent>
                </Card>
              )}

              {/* Jobs Table */}
              <div data-jobs-list className="bg-card rounded-lg border border-border">
                <div className="p-6">
                  {jobsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading jobs...</p>
                    </div>
                  ) : filteredJobs.length > 0 ? (
                    <JobsTable
                      jobs={filteredJobs}
                      isLoading={showArchived ? archivedJobsLoading : jobsLoading}
                      onViewJob={(job) => {
                        setSelectedJob(job);
                        setIsDetailsDialogOpen(true);
                      }}
                      onManageJob={(job) => {
                        setSelectedJob(job);
                        setIsManageDialogOpen(true);
                      }}
                      onPostToPlatforms={(job) => {
                        setJobToPost(job);
                        setIsPlatformPostingOpen(true);
                      }}
                      archived={showArchived}
                    />
                  ) : (
                    <div className="text-center py-12">
                      <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {showArchived 
                          ? "No Archived Jobs" 
                          : selectedFilter === "all" 
                            ? "No Active Jobs" 
                            : `No Jobs in ${processStages.find(s => s.id === selectedFilter)?.title}`
                        }
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {selectedFilter === "all" 
                          ? "Create your first job to start the hiring process"
                          : "No jobs have reached this stage yet"
                        }
                      </p>
                      {selectedFilter === "all" && (
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          Create New Job
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              </div>
            </TabsContent>

            <TabsContent value="platforms" className="mt-0 p-8">
              {/* Multi-Platform Job Distribution */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Multi-Platform Job Distribution</h2>
                    <p className="text-muted-foreground">Click on platforms to view detailed information and manage postings</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedPlatforms.length === 6}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPlatforms(['linkedin', 'naukri', 'indeed', 'glassdoor', 'monster', 'shine']);
                          } else {
                            setSelectedPlatforms([]);
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      Select All
                    </label>
                    <Badge variant="outline" className="ml-2">
                      {selectedPlatforms.length} selected
                    </Badge>
                  </div>
                </div>

                {/* Interactive Platform Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'linkedin', displayName: 'LinkedIn', description: 'Professional Network', color: 'blue' },
                    { name: 'naukri', displayName: 'Naukri.com', description: "India's Job Portal", color: 'purple' },
                    { name: 'indeed', displayName: 'Indeed', description: 'Global Job Search', color: 'green' },
                    { name: 'glassdoor', displayName: 'Glassdoor', description: 'Company Reviews', color: 'emerald' },
                    { name: 'monster', displayName: 'Monster', description: 'Career Network', color: 'orange' },
                    { name: 'shine', displayName: 'Shine.com', description: 'Career Portal', color: 'red' }
                  ].map((platform) => {
                    const status = platformStatuses.find(s => s.platformName === platform.name);
                    const activePosts = jobPostings.filter(p => p.platformName === platform.name && p.status === 'posted').length;
                    const isConnected = status?.isConnected || false;
                    const isSelected = selectedPlatforms.includes(platform.name);
                    const isActive = activePlatform === platform.name;
                    
                    return (
                      <Card 
                        key={platform.name}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          isActive ? 'ring-2 ring-blue-500 shadow-lg' : ''
                        } ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        onClick={() => setActivePlatform(activePlatform === platform.name ? null : platform.name)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  if (e.target.checked) {
                                    setSelectedPlatforms([...selectedPlatforms, platform.name]);
                                  } else {
                                    setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform.name));
                                  }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className={`p-2 rounded-lg bg-${platform.color}-100 dark:bg-${platform.color}-900`}>
                                {platform.name === 'linkedin' ? 
                                  <Linkedin className={`w-5 h-5 text-${platform.color}-600 dark:text-${platform.color}-400`} /> :
                                  <Globe className={`w-5 h-5 text-${platform.color}-600 dark:text-${platform.color}-400`} />
                                }
                              </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          </div>
                          
                          <div>
                            <h3 className="font-semibold text-sm mb-1">{platform.displayName}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{platform.description}</p>
                            <div className="flex justify-between text-xs">
                              <span className="text-gray-500">Posts: {activePosts}</span>
                              <span className={`font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                                {isConnected ? 'Connected' : 'Offline'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Platform Details Table */}
                {activePlatform && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                          {activePlatform === 'linkedin' ? 
                            <Linkedin className="w-5 h-5 text-blue-600 dark:text-blue-400" /> :
                            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          }
                        </div>
                        {activePlatform === 'naukri' ? 'Naukri.com' : 
                         activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)} Details
                      </CardTitle>
                      <CardDescription>
                        Detailed information and posting history for {activePlatform}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{jobPostings.filter(p => p.platformName === activePlatform && p.status === 'posted').length}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Active Posts</div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">0</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Applications</div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">0</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Views</div>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">0%</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Response Rate</div>
                        </div>
                      </div>

                      {/* Platform-specific job postings table */}
                      <div className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b">
                          <h4 className="font-semibold text-sm">Recent Job Postings</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job Title</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posted Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applications</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                              {jobPostings.filter(p => p.platformName === activePlatform).length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    No jobs posted on {activePlatform} yet
                                  </td>
                                </tr>
                              ) : (
                                jobPostings
                                  .filter(p => p.platformName === activePlatform)
                                  .map((posting) => {
                                    const job = activeJobs.find(j => j.id === posting.jobId);
                                    return (
                                      <tr key={posting.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-4 py-3">
                                          <div className="font-medium text-sm">{job?.title || 'Unknown Job'}</div>
                                          <div className="text-xs text-gray-500">{job?.department}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                          {new Date(posting.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                          <Badge 
                                            variant={posting.status === 'posted' ? 'default' : 'secondary'}
                                            className="text-xs"
                                          >
                                            {posting.status}
                                          </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">0</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">0</td>
                                        <td className="px-4 py-3">
                                          <Button variant="outline" size="sm">
                                            <ExternalLink className="w-3 h-3 mr-1" />
                                            View
                                          </Button>
                                        </td>
                                      </tr>
                                    );
                                  })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Dialog Components */}
          <CreateJobDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          />

          {selectedJob && (
            <>
              <JobDetailsDialog
                job={selectedJob}
                open={isDetailsDialogOpen}
                onOpenChange={(open) => {
                  setIsDetailsDialogOpen(open);
                  if (!open) setSelectedJob(null);
                }}
              />

              <ManageJobDialog
                job={selectedJob}
                open={isManageDialogOpen}
                onOpenChange={(open) => {
                  setIsManageDialogOpen(open);
                  if (!open) setSelectedJob(null);
                }}
              />
            </>
          )}

          <PlatformPostingDialog
            open={isPlatformPostingOpen}
            onOpenChange={setIsPlatformPostingOpen}
            job={jobToPost}
          />
        </main>
      </div>
    </div>
  );
}
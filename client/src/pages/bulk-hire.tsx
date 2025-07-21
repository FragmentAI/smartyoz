import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Upload, 
  FileSpreadsheet, 
  Users, 
  GraduationCap, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  Download,
  Calendar,
  Target,
  FileText,
  Search,
  Star,
  UserCheck,
  Settings,
  Brain,
  Code,
  Plus,
  Edit,
  Trash2,
  Sparkles,
  Wand2,
  Import,
  Mail,
  UserPlus,
  AlertCircle
} from "lucide-react";
import { Job } from "@shared/schema";

interface BulkJob {
  id: number;
  name: string;
  description: string;
  jobId: number;
  jobTitle: string;
  totalCandidates: number;
  processedCandidates: number;
  shortlistedCandidates: number;
  status: 'processing' | 'completed' | 'failed';
  createdAt: string;
}

interface BulkCandidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skills: string[];
  experience: number;
  matchingScore: number;
  isShortlisted: boolean;
  addedToMainList: boolean;
  resumeText: string;
}

interface DriveCandidate {
  id: number;
  name: string;
  email: string;
  phone: string;
  college?: string;
  driveSessionId: number;
  sessionName: string;
  status: 'invited' | 'registered' | 'aptitude_completed' | 'aptitude_qualified' | 'technical_completed' | 'technical_qualified' | 'interview_scheduled' | 'selected' | 'rejected';
  aptitudeScore?: number;
  technicalScore?: number;
  currentRound: number; // 1: Aptitude, 2: Technical, 3: Interview
  aptitudeCompletedAt?: string;
  technicalCompletedAt?: string;
  registeredAt?: string;
}

interface DriveSession {
  id: number;
  name: string;
  type: 'walk-in' | 'campus';
  jobId: number;
  jobTitle: string;
  totalCandidates: number;
  registeredCandidates: number;
  aptitudeCompleted: number;
  aptitudeQualified: number;
  technicalCompleted: number;
  technicalQualified: number;
  interviewScheduled: number;
  finalSelected: number;
  aptitudeCutoff: number;
  technicalCutoff: number;
  status: 'draft' | 'registration' | 'aptitude' | 'technical' | 'interview' | 'completed';
  createdAt: string;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  testRound: number;
  tags: string[];
}

export default function BulkHire() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("processing");
  const queryClient = useQueryClient();
  
  // Drive creation state
  const [driveForm, setDriveForm] = useState({
    name: '',
    type: 'walk-in' as 'walk-in' | 'campus',
    jobId: '',
    aptitudeCutoff: 60,
    technicalCutoff: 70,
    description: '',
    testDuration: 60,
    questionCount: 50
  });
  
  // Bulk processing state
  const [bulkForm, setBulkForm] = useState({
    name: '',
    description: '',
    jobId: ''
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBulkFiles, setSelectedBulkFiles] = useState<File[]>([]);
  const [isCreatingDrive, setIsCreatingDrive] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  
  // Bulk candidate management state
  const [selectedBulkJobId, setSelectedBulkJobId] = useState<number | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<number[]>([]);
  const [isBulkCandidateDialogOpen, setIsBulkCandidateDialogOpen] = useState(false);
  const [isShortlisting, setIsShortlisting] = useState(false);
  const [isAddingToMainList, setIsAddingToMainList] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);

  // Drive session management state
  const [selectedDriveSession, setSelectedDriveSession] = useState<DriveSession | null>(null);
  const [isCutoffDialogOpen, setIsCutoffDialogOpen] = useState(false);
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  const [cutoffForm, setCutoffForm] = useState({
    aptitudeCutoff: 60,
    technicalCutoff: 70
  });

  // Question Bank state
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);
  const [activeQuestionTab, setActiveQuestionTab] = useState("aptitude");

  // Enhanced cutoff and filtering state
  const [candidateFilters, setCandidateFilters] = useState({
    minAptitude: 0,
    maxAptitude: 100,
    minTechnical: 0,
    maxTechnical: 100,
    status: 'all',
    currentRound: 'all'
  });
  const [filteredCandidates, setFilteredCandidates] = useState<DriveCandidate[]>([]);
  const [selectedDriveCandidates, setSelectedDriveCandidates] = useState<number[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);
  const [isUpdatingCutoffs, setIsUpdatingCutoffs] = useState(false);
  const [isBulkScheduling, setIsBulkScheduling] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Candidate details state
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
  const [candidateDetailsOpen, setCandidateDetailsOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    difficulty: 'medium' as const,
    category: '',
    testRound: 1,
    tags: '',
    driveSessionId: '',
    jobId: 'all'
  });
  const [aiForm, setAiForm] = useState({
    count: 5,
    difficulty: 'medium' as const,
    jobId: 'general',
    topics: ''
  });

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

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: isAuthenticated,
  });

  const { data: driveSessions = [] } = useQuery<DriveSession[]>({
    queryKey: ["/api/drive-sessions"],
    enabled: isAuthenticated,
  });

  const { data: driveCandidates = [] } = useQuery<DriveCandidate[]>({
    queryKey: ["/api/drive-candidates"],
    enabled: isAuthenticated,
  });

  const { data: bulkJobs = [] } = useQuery<BulkJob[]>({
    queryKey: ["/api/bulk-jobs"],
    enabled: isAuthenticated,
  });

  // Question Bank queries
  const { data: questions = [], isLoading: isQuestionsLoading } = useQuery<Question[]>({
    queryKey: ['/api/aptitude-questions/all'],
    enabled: isAuthenticated,
  });

  // Bulk candidates query
  const { data: bulkCandidates = [] } = useQuery<BulkCandidate[]>({
    queryKey: ['/api/bulk-candidates', selectedBulkJobId],
    enabled: isAuthenticated && selectedBulkJobId !== null,
  });

  // Query for candidate test details
  const { data: candidateTestDetails, isLoading: candidateDetailsLoading, error: candidateDetailsError } = useQuery({
    queryKey: ['/api/drive-candidates', selectedCandidate?.id, 'test-details'],
    queryFn: async () => {
      if (!selectedCandidate?.id) return null;
      const response = await fetch(`/api/drive-candidates/${selectedCandidate.id}/test-details`);
      if (!response.ok) throw new Error('Failed to fetch candidate details');
      return response.json();
    },
    enabled: candidateDetailsOpen && !!selectedCandidate?.id,
    retry: 1
  });

  // Filter questions by round
  const aptitudeQuestions = questions.filter(q => q.testRound === 1);
  const technicalQuestions = questions.filter(q => q.testRound === 2);

  // Question Bank mutations
  const createQuestionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/aptitude-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aptitude-questions/all'] });
      setIsCreateDialogOpen(false);
      resetQuestionForm();
      toast({ title: "Question created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create question", variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/aptitude-questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aptitude-questions/all'] });
      setEditingQuestion(null);
      resetQuestionForm();
      toast({ title: "Question updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update question", variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/aptitude-questions/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete question');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/aptitude-questions/all'] });
      toast({ title: "Question deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete question", variant: "destructive" });
    },
  });

  const generateAIMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/aptitude-questions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate questions');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/aptitude-questions/all'] });
      setIsAIDialogOpen(false);
      resetAiForm();
      toast({ 
        title: "AI questions generated successfully", 
        description: `Generated ${data.count} questions using AI`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to generate questions", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const activeJobs = jobs?.filter(job => job.status === 'active') || [];
  const activeDriveSessions = driveSessions.filter(session => session.status === 'active');
  const completedDriveSessions = driveSessions.filter(session => session.status === 'completed');
  const activeBulkJobs = bulkJobs.filter(job => job.status === 'processing');
  const completedBulkJobs = bulkJobs.filter(job => job.status === 'completed');

  // Question Bank helper functions
  const resetQuestionForm = () => {
    setQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      difficulty: 'medium',
      category: '',
      testRound: activeQuestionTab === 'aptitude' ? 1 : 2,
      tags: '',
      driveSessionId: '',
      jobId: 'all'
    });
  };

  const resetAiForm = () => {
    setAiForm({
      count: 5,
      difficulty: 'medium',
      jobId: 'general',
      topics: ''
    });
  };

  const handleQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!questionForm.question.trim() || questionForm.options.some(opt => !opt.trim())) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    const data = {
      ...questionForm,
      testRound: activeQuestionTab === 'aptitude' ? 1 : 2,
      category: activeQuestionTab === 'aptitude' ? 'aptitude' : 'technical',
      tags: questionForm.tags ? questionForm.tags.split(',').map(t => t.trim()) : [],
      jobId: questionForm.jobId && questionForm.jobId !== 'all' ? parseInt(questionForm.jobId) : null,
      driveSessionId: null
    };

    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const handleAISubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (aiForm.count <= 0 || aiForm.count > 20) {
      toast({ title: "Please enter a valid count (1-20)", variant: "destructive" });
      return;
    }

    const data = {
      ...aiForm,
      testRound: activeQuestionTab === 'aptitude' ? 1 : 2,
      category: activeQuestionTab === 'aptitude' ? 'aptitude' : 'technical',
      jobId: aiForm.jobId && aiForm.jobId !== 'general' ? aiForm.jobId : null
    };

    generateAIMutation.mutate(data);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      difficulty: question.difficulty,
      category: question.category,
      testRound: question.testRound,
      tags: question.tags.join(', '),
      driveSessionId: '',
      jobId: 'all'
    });
    setIsCreateDialogOpen(true);
  };

  const handleDeleteQuestion = (id: number) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      deleteQuestionMutation.mutate(id);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template for drive recruitment candidate upload
    const csvContent = [
      ['Name', 'Email', 'Phone', 'College'],
      ['John Doe', 'john.doe@example.com', '+1234567890', 'MIT'],
      ['Jane Smith', 'jane.smith@example.com', '+1234567891', 'Stanford'],
      ['Mike Johnson', 'mike.johnson@example.com', '+1234567892', 'Harvard']
    ];
    
    const csvString = csvContent.map(row => row.join(',')).join('\n');
    
    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'candidate-upload-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Template Downloaded",
      description: "CSV template downloaded successfully. Fill in your candidate data and upload as CSV or Excel (.xlsx, .xls) file.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
        'application/csv' // .csv (alternative MIME type)
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File",
          description: "Please upload an Excel (.xlsx, .xls) or CSV file",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleBulkFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (allowedTypes.includes(file.type)) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      }
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid File Types",
          description: `Some files were skipped: ${invalidFiles.join(', ')}. Only PDF, DOC, and DOCX files are allowed.`,
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        setSelectedBulkFiles(validFiles);
        toast({
          title: "Files Selected",
          description: `${validFiles.length} resume files selected for bulk processing.`,
        });
      }
    }
  };

  const handleCreateDrive = async () => {
    if (!driveForm.name || !driveForm.jobId || !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload a candidate file",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingDrive(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', driveForm.name);
      formData.append('type', driveForm.type);
      formData.append('jobId', driveForm.jobId);
      formData.append('aptitudeCutoff', driveForm.aptitudeCutoff.toString());
      formData.append('technicalCutoff', driveForm.technicalCutoff.toString());
      formData.append('description', driveForm.description);
      formData.append('testDuration', driveForm.testDuration.toString());
      formData.append('questionCount', driveForm.questionCount.toString());

      const response = await fetch('/api/drive-sessions/create', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to create drive session');
      }

      const result = await response.json();
      
      toast({
        title: "Drive Session Created",
        description: `Created ${driveForm.type} drive for ${result.candidateCount} candidates. Registration emails sent.`,
      });

      // Reset form
      setDriveForm({
        name: '',
        type: 'walk-in',
        jobId: '',
        aptitudeCutoff: 60,
        technicalCutoff: 70,
        description: '',
        testDuration: 60,
        questionCount: 50
      });
      setSelectedFile(null);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create drive session",
        variant: "destructive",
      });
    } finally {
      setIsCreatingDrive(false);
    }
  };

  // Bulk candidate management functions
  const handleViewBulkCandidates = (bulkJobId: number) => {
    setSelectedBulkJobId(bulkJobId);
    setSelectedCandidateIds([]);
    setIsBulkCandidateDialogOpen(true);
  };

  const handleCandidateSelection = (candidateId: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedCandidateIds(prev => [...prev, candidateId]);
    } else {
      setSelectedCandidateIds(prev => prev.filter(id => id !== candidateId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedCandidateIds(bulkCandidates.map(c => c.id));
    } else {
      setSelectedCandidateIds([]);
    }
  };

  const handleShortlistCandidates = async () => {
    if (!selectedBulkJobId || selectedCandidateIds.length === 0) return;
    
    setIsShortlisting(true);
    try {
      const response = await fetch(`/api/bulk-jobs/${selectedBulkJobId}/shortlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds: selectedCandidateIds }),
      });

      if (!response.ok) throw new Error('Failed to shortlist candidates');

      toast({
        title: "Candidates Shortlisted",
        description: `${selectedCandidateIds.length} candidates have been shortlisted successfully.`,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-candidates', selectedBulkJobId] });
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-jobs'] });
      setSelectedCandidateIds([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to shortlist candidates",
        variant: "destructive",
      });
    } finally {
      setIsShortlisting(false);
    }
  };

  const handleAddToMainList = async () => {
    if (!selectedBulkJobId || selectedCandidateIds.length === 0) return;
    
    setIsAddingToMainList(true);
    try {
      const response = await fetch(`/api/bulk-jobs/${selectedBulkJobId}/add-to-main-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds: selectedCandidateIds }),
      });

      if (!response.ok) throw new Error('Failed to add candidates to main list');

      toast({
        title: "Candidates Added",
        description: `${selectedCandidateIds.length} candidates added to main candidate list.`,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-candidates', selectedBulkJobId] });
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      setSelectedCandidateIds([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add candidates to main list",
        variant: "destructive",
      });
    } finally {
      setIsAddingToMainList(false);
    }
  };

  const handleSendScreeningEmails = async () => {
    if (!selectedBulkJobId || selectedCandidateIds.length === 0) return;
    
    setIsSendingEmails(true);
    try {
      const response = await fetch(`/api/bulk-jobs/${selectedBulkJobId}/send-screening-emails`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateIds: selectedCandidateIds }),
      });

      if (!response.ok) throw new Error('Failed to send screening emails');

      toast({
        title: "Screening Emails Sent",
        description: `Screening emails sent to ${selectedCandidateIds.length} candidates.`,
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/bulk-candidates', selectedBulkJobId] });
      setSelectedCandidateIds([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send screening emails",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmails(false);
    }
  };

  const getMatchingScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-100 text-green-800">Excellent ({score}%)</Badge>;
    if (score >= 60) return <Badge className="bg-blue-100 text-blue-800">Good ({score}%)</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-100 text-yellow-800">Fair ({score}%)</Badge>;
    return <Badge className="bg-red-100 text-red-800">Poor ({score}%)</Badge>;
  };



  const handleSetCutoffScores = (session: DriveSession) => {
    setSelectedDriveSession(session);
    setCutoffForm({
      aptitudeCutoff: session.aptitudeCutoff,
      technicalCutoff: session.technicalCutoff
    });
    setIsCutoffDialogOpen(true);
  };

  // Enhanced cutoff update with recalculation
  const handleUpdateCutoffs = async () => {
    if (!selectedDriveSession) return;
    
    setIsUpdatingCutoffs(true);
    try {
      const response = await fetch(`/api/drive-sessions/${selectedDriveSession.id}/update-cutoffs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cutoffForm),
      });

      if (!response.ok) throw new Error('Failed to update cutoffs');

      const result = await response.json();
      toast({
        title: "Cutoffs Updated",
        description: `Cutoffs updated. ${result.requalifiedCandidates} candidates now qualify.`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/drive-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/drive-candidates'] });
      setIsCutoffDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update cutoffs",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingCutoffs(false);
    }
  };

  // Advanced candidate filtering
  const handleFilterCandidates = async () => {
    if (!selectedDriveSession) return;
    
    setIsFiltering(true);
    try {
      const params = new URLSearchParams({
        driveSessionId: selectedDriveSession.id.toString(),
        minAptitude: candidateFilters.minAptitude.toString(),
        maxAptitude: candidateFilters.maxAptitude.toString(),
        minTechnical: candidateFilters.minTechnical.toString(),
        maxTechnical: candidateFilters.maxTechnical.toString(),
        status: candidateFilters.status,
        currentRound: candidateFilters.currentRound
      });

      const response = await fetch(`/api/drive-candidates/filter?${params}`);
      if (!response.ok) throw new Error('Failed to filter candidates');

      const filtered = await response.json();
      setFilteredCandidates(filtered);
      
      toast({
        title: "Filters Applied",
        description: `Found ${filtered.length} candidates matching your criteria.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to filter candidates",
        variant: "destructive",
      });
    } finally {
      setIsFiltering(false);
    }
  };

  // Bulk interview scheduling
  const handleBulkScheduleInterviews = async () => {
    if (!selectedDriveSession || selectedDriveCandidates.length === 0) return;
    
    setIsBulkScheduling(true);
    try {
      const response = await fetch(`/api/drive-candidates/bulk-schedule-interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driveSessionId: selectedDriveSession.id,
          candidateIds: selectedDriveCandidates
        }),
      });

      if (!response.ok) throw new Error('Failed to schedule interviews');

      const result = await response.json();
      toast({
        title: "Interviews Scheduled",
        description: `Scheduled ${result.interviewsScheduled} interviews for selected candidates.`,
      });

      queryClient.invalidateQueries({ queryKey: ['/api/drive-candidates'] });
      setSelectedDriveCandidates([]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule interviews",
        variant: "destructive",
      });
    } finally {
      setIsBulkScheduling(false);
    }
  };

  // Export filtered candidates
  const handleExportCandidates = async () => {
    if (!selectedDriveSession) return;
    
    try {
      const candidates = filteredCandidates.length > 0 ? filteredCandidates : driveCandidates?.data || [];
      const params = new URLSearchParams({
        driveSessionId: selectedDriveSession.id.toString(),
        format: 'csv'
      });

      const response = await fetch(`/api/drive-candidates/export?${params}`);
      if (!response.ok) throw new Error('Failed to export candidates');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `drive-${selectedDriveSession.name}-candidates.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Complete",
        description: "Candidate data exported successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export candidates",
        variant: "destructive",
      });
    }
  };

  const handleViewResults = (session: DriveSession) => {
    setSelectedDriveSession(session);
    setIsResultsDialogOpen(true);
  };

  const handleSendNextRound = async (session: DriveSession) => {
    try {
      const response = await fetch(`/api/drive-sessions/${session.id}/send-next-round`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to send next round emails');
      }

      const result = await response.json();
      
      toast({
        title: "Next Round Emails Sent",
        description: `Sent emails to ${result.emailsSent} qualified candidates for the next round.`,
      });

      // Refresh drive sessions data
      await queryClient.invalidateQueries({ queryKey: ['/api/drive-sessions'] });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send next round emails",
        variant: "destructive",
      });
    }
  };

  const handleScheduleInterviews = async (session: DriveSession) => {
    try {
      const response = await fetch(`/api/drive-sessions/${session.id}/schedule-interviews`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to schedule interviews');
      }

      const result = await response.json();
      
      toast({
        title: "Interviews Scheduled",
        description: `Scheduled interviews for ${result.interviewsScheduled} qualified candidates.`,
      });

      // Refresh drive sessions data
      await queryClient.invalidateQueries({ queryKey: ['/api/drive-sessions'] });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule interviews",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDriveSession = async (session: DriveSession) => {
    if (!confirm(`Are you sure you want to delete the drive session "${session.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/drive-sessions/${session.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete drive session');
      }

      toast({
        title: "Drive Session Deleted",
        description: `Drive session "${session.name}" has been deleted successfully.`,
      });

      // Refresh drive sessions data
      await queryClient.invalidateQueries({ queryKey: ['/api/drive-sessions'] });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete drive session",
        variant: "destructive",
      });
    }
  };

  const handleBulkProcessing = async () => {
    if (!bulkForm.name || !bulkForm.jobId || selectedBulkFiles.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and upload resume files",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingBulk(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Append all selected files
      selectedBulkFiles.forEach((file) => {
        formData.append('resumes', file);
      });
      
      formData.append('name', bulkForm.name);
      formData.append('description', bulkForm.description);
      formData.append('jobId', bulkForm.jobId);

      const response = await fetch('/api/bulk-jobs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = 'Failed to process bulk resumes';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || errorMessage;
        } catch {
          // If response is not JSON (e.g., HTML error page), use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      toast({
        title: "Bulk Processing Started",
        description: `Processing ${result.totalFiles} resume files for matching against the job requirements.`,
      });

      // Reset form
      setBulkForm({
        name: '',
        description: '',
        jobId: ''
      });
      setSelectedBulkFiles([]);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process bulk resumes",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBulk(false);
    }
  };

  // Handler function for viewing candidate details
  const handleViewCandidate = async (candidate: DriveCandidate) => {
    setSelectedCandidate(candidate);
    setCandidateDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRegistrationStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <Badge className="bg-green-100 text-green-800">Registered</Badge>;
      case 'test_completed':
        return <Badge className="bg-blue-100 text-blue-800">Test Done</Badge>;
      case 'qualified':
        return <Badge className="bg-emerald-100 text-emerald-800">Qualified</Badge>;
      case 'interview_scheduled':
        return <Badge className="bg-purple-100 text-purple-800">Interview Scheduled</Badge>;
      case 'interview_completed':
        return <Badge className="bg-orange-100 text-orange-800">Interview Completed</Badge>;
      case 'selected':
        return <Badge className="bg-green-100 text-green-800">Selected</Badge>;
      case 'hired':
        return <Badge className="bg-green-200 text-green-900">Hired</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-48'}`}>
        <Header />
        <main className="flex-1 overflow-y-auto bg-white">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <div className="border-b border-gray-200 px-8 py-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="processing" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Bulk Processing
                {activeBulkJobs.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{activeBulkJobs.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="drive" className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4" />
                Drive Recruitment
                {activeDriveSessions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">{activeDriveSessions.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="processing" className="mt-0 p-8">
                  {/* Page Header */}
                  <div className="flex justify-between items-center mb-8">
                    <div>
                    </div>
                  </div>

                  {/* Create Bulk Job Form */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-500" />
                        Create Bulk Processing Job
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="bulkName">Job Name</Label>
                          <Input
                            id="bulkName"
                            placeholder="e.g., Senior Developer Position Screening"
                            value={bulkForm.name}
                            onChange={(e) => setBulkForm({...bulkForm, name: e.target.value})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="bulkJobSelect">Target Job Position</Label>
                          <Select value={bulkForm.jobId} onValueChange={(value) => setBulkForm({...bulkForm, jobId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select job position" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeJobs?.filter(job => job?.id && job?.title)?.map((job) => (
                                <SelectItem key={job.id} value={job.id.toString()}>
                                  {job.title} - {job.department}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bulkDescription">Description</Label>
                        <Textarea
                          id="bulkDescription"
                          placeholder="Describe the screening criteria and expectations..."
                          value={bulkForm.description}
                          onChange={(e) => setBulkForm({...bulkForm, description: e.target.value})}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="resumeUpload">Upload Resume Files</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                          <input
                            type="file"
                            id="resumeUpload"
                            multiple
                            accept=".pdf,.doc,.docx"
                            onChange={handleBulkFileUpload}
                            className="hidden"
                          />
                          <label htmlFor="resumeUpload" className="cursor-pointer flex flex-col items-center">
                            <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-4" />
                            <p className="text-lg font-medium text-gray-900">
                              {selectedBulkFiles.length > 0 ? `${selectedBulkFiles.length} resume files selected` : "Click to upload resume files"}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {selectedBulkFiles.length > 0 
                                ? selectedBulkFiles.map(f => f.name).join(', ').length > 50 
                                  ? selectedBulkFiles.map(f => f.name).join(', ').substring(0, 50) + '...'
                                  : selectedBulkFiles.map(f => f.name).join(', ')
                                : "Support for PDF, DOC, and DOCX files (multiple files allowed)"
                              }
                            </p>
                          </label>
                        </div>
                      </div>

                      <Button
                        onClick={handleBulkProcessing}
                        disabled={isProcessingBulk}
                        className="w-full"
                        size="lg"
                      >
                        {isProcessingBulk ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Processing Resumes...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-2" />
                            Start Bulk Processing
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Bulk Jobs List */}
                  <div className="space-y-6">
                    {activeBulkJobs.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Processing Jobs</h2>
                        <div className="grid gap-4">
                          {activeBulkJobs.map((job) => (
                            <Card key={job.id}>
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900">{job.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{job.jobTitle}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                      <span>{job.totalCandidates} candidates</span>
                                      <span>{job.processedCandidates} processed</span>
                                      <span>{job.shortlistedCandidates} shortlisted</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(job.status)}
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewBulkCandidates(job.id)}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      Review Candidates
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {completedBulkJobs.length > 0 && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Completed Processing Jobs</h2>
                        <div className="grid gap-4">
                          {completedBulkJobs.map((job) => (
                            <Card key={job.id}>
                              <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h3 className="text-lg font-medium text-gray-900">{job.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{job.jobTitle}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                      <span>{job.totalCandidates} candidates</span>
                                      <span>{job.shortlistedCandidates} shortlisted</span>
                                      <span>Completed {new Date(job.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusBadge(job.status)}
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewBulkCandidates(job.id)}
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      Review Candidates
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {bulkJobs.length === 0 && (
                      <Card>
                        <CardContent className="p-8 text-center">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Bulk Processing Jobs</h3>
                          <p className="text-gray-600">Create your first bulk processing job to start screening resumes with AI.</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
          </TabsContent>

          <TabsContent value="drive" className="mt-0 p-8">
            <div>
                  {/* Page Header */}
                  <div className="flex justify-end items-center mb-8">
                    <div className="flex gap-3">
                      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Settings className="w-4 h-4 mr-2" />
                            Question Bank
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <Settings className="w-5 h-5" />
                              Question Bank Configuration
                            </DialogTitle>
                          </DialogHeader>
                          {/* Question Bank Management Interface */}
                          <div className="space-y-6">
                            {/* Statistics Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Aptitude Questions</CardTitle>
                                  <Brain className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">{aptitudeQuestions.length}</div>
                                  <p className="text-xs text-muted-foreground">Round 1 questions</p>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Technical Questions</CardTitle>
                                  <Code className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">{technicalQuestions.length}</div>
                                  <p className="text-xs text-muted-foreground">Round 2 questions</p>
                                </CardContent>
                              </Card>

                              <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                  <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                  <div className="text-2xl font-bold">{questions.length}</div>
                                  <p className="text-xs text-muted-foreground">Across all rounds</p>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Question Management */}
                            <div className="flex gap-3 mb-4">
                              <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" onClick={resetAiForm}>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate with AI
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      <Wand2 className="w-5 h-5" />
                                      Generate {activeQuestionTab === 'aptitude' ? 'Aptitude' : 'Technical'} Questions with AI
                                    </DialogTitle>
                                  </DialogHeader>
                                  <form onSubmit={handleAISubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor="count">Number of Questions</Label>
                                        <Input
                                          id="count"
                                          type="number"
                                          min="1"
                                          max="20"
                                          value={aiForm.count}
                                          onChange={(e) => setAiForm({ ...aiForm, count: parseInt(e.target.value) || 1 })}
                                          required
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="ai-difficulty">Difficulty Level</Label>
                                        <Select
                                          value={aiForm.difficulty}
                                          onValueChange={(value: 'easy' | 'medium' | 'hard') => setAiForm({ ...aiForm, difficulty: value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div>
                                      <Label htmlFor="ai-jobId">Job Role (Optional)</Label>
                                      <Select
                                        value={aiForm.jobId}
                                        onValueChange={(value) => setAiForm({ ...aiForm, jobId: value })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select job for role-specific questions..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="general">General Questions</SelectItem>
                                          {jobs?.filter(job => job?.id && job?.title)?.map((job) => (
                                            <SelectItem key={job.id} value={job.id.toString()}>
                                              {job.title}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    {activeQuestionTab === 'aptitude' ? (
                                      <div>
                                        <Label htmlFor="ai-topics">Focus Topics (Optional)</Label>
                                        <Input
                                          id="ai-topics"
                                          value={aiForm.topics}
                                          onChange={(e) => setAiForm({ ...aiForm, topics: e.target.value })}
                                          placeholder="e.g., logical reasoning, numerical ability, verbal comprehension"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Comma-separated topics for targeted question generation</p>
                                      </div>
                                    ) : (
                                      <div>
                                        <Label htmlFor="ai-topics">Technical Topics (Optional)</Label>
                                        <Input
                                          id="ai-topics"
                                          value={aiForm.topics}
                                          onChange={(e) => setAiForm({ ...aiForm, topics: e.target.value })}
                                          placeholder="e.g., algorithms, databases, system design, programming languages"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Comma-separated technical topics for focused questions</p>
                                      </div>
                                    )}

                                    <div className="flex justify-end gap-3">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsAIDialogOpen(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button 
                                        type="submit" 
                                        disabled={generateAIMutation.isPending}
                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                      >
                                        {generateAIMutation.isPending ? (
                                          <>
                                            <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                                            Generating...
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            Generate Questions
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>

                              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button onClick={resetQuestionForm}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Manually
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      {editingQuestion ? 'Edit Question' : `Add ${activeQuestionTab === 'aptitude' ? 'Aptitude' : 'Technical'} Question`}
                                    </DialogTitle>
                                  </DialogHeader>
                                  <form onSubmit={handleQuestionSubmit} className="space-y-4">
                                    <div>
                                      <Label htmlFor="question">Question</Label>
                                      <Textarea
                                        id="question"
                                        value={questionForm.question}
                                        onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                                        placeholder="Enter the question..."
                                        required
                                      />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      {questionForm.options.map((option, index) => (
                                        <div key={index}>
                                          <Label htmlFor={`option-${index}`}>Option {index + 1}</Label>
                                          <Input
                                            id={`option-${index}`}
                                            value={option}
                                            onChange={(e) => {
                                              const newOptions = [...questionForm.options];
                                              newOptions[index] = e.target.value;
                                              setQuestionForm({ ...questionForm, options: newOptions });
                                            }}
                                            placeholder={`Option ${index + 1}...`}
                                            required
                                          />
                                        </div>
                                      ))}
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                      <div>
                                        <Label htmlFor="correctAnswer">Correct Answer</Label>
                                        <Select
                                          value={questionForm.correctAnswer.toString()}
                                          onValueChange={(value) => setQuestionForm({ ...questionForm, correctAnswer: parseInt(value) })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="0">Option 1</SelectItem>
                                            <SelectItem value="1">Option 2</SelectItem>
                                            <SelectItem value="2">Option 3</SelectItem>
                                            <SelectItem value="3">Option 4</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label htmlFor="difficulty">Difficulty</Label>
                                        <Select
                                          value={questionForm.difficulty}
                                          onValueChange={(value: 'easy' | 'medium' | 'hard') => setQuestionForm({ ...questionForm, difficulty: value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="easy">Easy</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="hard">Hard</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>

                                      <div>
                                        <Label htmlFor="jobId">Job (Optional)</Label>
                                        <Select
                                          value={questionForm.jobId}
                                          onValueChange={(value) => setQuestionForm({ ...questionForm, jobId: value })}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select job..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="all">All Jobs</SelectItem>
                                            {jobs?.filter(job => job?.id && job?.title)?.map((job) => (
                                              <SelectItem key={job.id} value={job.id.toString()}>
                                                {job.title}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    </div>

                                    <div>
                                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                                      <Input
                                        id="tags"
                                        value={questionForm.tags}
                                        onChange={(e) => setQuestionForm({ ...questionForm, tags: e.target.value })}
                                        placeholder="e.g., logic, mathematics, programming"
                                      />
                                    </div>

                                    <div className="flex justify-end gap-3">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateDialogOpen(false)}
                                      >
                                        Cancel
                                      </Button>
                                      <Button type="submit" disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}>
                                        {editingQuestion ? 'Update Question' : 'Create Question'}
                                      </Button>
                                    </div>
                                  </form>
                                </DialogContent>
                              </Dialog>
                            </div>

                            {/* Question Tabs */}
                            <Tabs value={activeQuestionTab} onValueChange={setActiveQuestionTab}>
                              <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="aptitude" className="flex items-center gap-2">
                                  <Brain className="w-4 h-4" />
                                  Aptitude & General Intelligence
                                </TabsTrigger>
                                <TabsTrigger value="technical" className="flex items-center gap-2">
                                  <Code className="w-4 h-4" />
                                  Technical Assessment
                                </TabsTrigger>
                              </TabsList>

                              <TabsContent value="aptitude" className="mt-4">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Round 1: Aptitude & General Intelligence Questions</h3>
                                    <Badge variant="outline">{aptitudeQuestions.length} questions</Badge>
                                  </div>
                                  {isQuestionsLoading ? (
                                    <div className="text-center py-8">Loading questions...</div>
                                  ) : aptitudeQuestions.length > 0 ? (
                                    <div className="rounded-md border">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Question</TableHead>
                                            <TableHead>Difficulty</TableHead>
                                            <TableHead>Tags</TableHead>
                                            <TableHead>Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {aptitudeQuestions.map((question) => (
                                            <TableRow key={question.id}>
                                              <TableCell className="max-w-md">
                                                <div className="truncate">{question.question}</div>
                                              </TableCell>
                                              <TableCell>
                                                <Badge variant={question.difficulty === 'easy' ? 'default' : question.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                                                  {question.difficulty}
                                                </Badge>
                                              </TableCell>
                                              <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                  {question.tags.map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                      {tag}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="flex gap-2">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditQuestion(question)}
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteQuestion(question.id)}
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-gray-500">
                                      No aptitude questions found. Click "Add Manually" or "Generate with AI" to create questions.
                                    </div>
                                  )}
                                </div>
                              </TabsContent>

                              <TabsContent value="technical" className="mt-4">
                                <div className="space-y-4">
                                  <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold">Round 2: Technical Assessment Questions</h3>
                                    <Badge variant="outline">{technicalQuestions.length} questions</Badge>
                                  </div>
                                  {isQuestionsLoading ? (
                                    <div className="text-center py-8">Loading questions...</div>
                                  ) : technicalQuestions.length > 0 ? (
                                    <div className="rounded-md border">
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Question</TableHead>
                                            <TableHead>Difficulty</TableHead>
                                            <TableHead>Tags</TableHead>
                                            <TableHead>Actions</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {technicalQuestions.map((question) => (
                                            <TableRow key={question.id}>
                                              <TableCell className="max-w-md">
                                                <div className="truncate">{question.question}</div>
                                              </TableCell>
                                              <TableCell>
                                                <Badge variant={question.difficulty === 'easy' ? 'default' : question.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                                                  {question.difficulty}
                                                </Badge>
                                              </TableCell>
                                              <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                  {question.tags.map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                      {tag}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </TableCell>
                                              <TableCell>
                                                <div className="flex gap-2">
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditQuestion(question)}
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </Button>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteQuestion(question.id)}
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </Button>
                                                </div>
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                      </Table>
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-gray-500">
                                      No technical questions found. Click "Add Manually" or "Generate with AI" to create questions.
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button onClick={handleDownloadTemplate}>
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                      </Button>
                    </div>
                  </div>

                  {/* Create Drive Form */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-500" />
                        Create New Drive Session
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="driveName">Drive Name</Label>
                          <Input
                            id="driveName"
                            placeholder="e.g., IIT Delhi Campus Drive 2025"
                            value={driveForm.name}
                            onChange={(e) => setDriveForm({...driveForm, name: e.target.value})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="driveType">Drive Type</Label>
                          <Select value={driveForm.type} onValueChange={(value: 'walk-in' | 'campus') => setDriveForm({...driveForm, type: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="campus">Campus Recruitment</SelectItem>
                              <SelectItem value="walk-in">Walk-in Drive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="jobSelect">Job Position</Label>
                          <Select value={driveForm.jobId} onValueChange={(value) => setDriveForm({...driveForm, jobId: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select job position" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeJobs?.filter(job => job?.id && job?.title)?.map((job) => (
                                <SelectItem key={job.id} value={job.id.toString()}>
                                  {job.title} - {job.department}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="aptitudeCutoff">Aptitude Cutoff (%)</Label>
                          <Input
                            id="aptitudeCutoff"
                            type="number"
                            min="0"
                            max="100"
                            value={driveForm.aptitudeCutoff}
                            onChange={(e) => setDriveForm({...driveForm, aptitudeCutoff: parseInt(e.target.value)})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="technicalCutoff">Technical Cutoff (%)</Label>
                          <Input
                            id="technicalCutoff"
                            type="number"
                            min="0"
                            max="100"
                            value={driveForm.technicalCutoff}
                            onChange={(e) => setDriveForm({...driveForm, technicalCutoff: parseInt(e.target.value)})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="testDuration">Test Duration (minutes)</Label>
                          <Input
                            id="testDuration"
                            type="number"
                            min="30"
                            max="180"
                            value={driveForm.testDuration}
                            onChange={(e) => setDriveForm({...driveForm, testDuration: parseInt(e.target.value)})}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="questionCount">Number of Questions</Label>
                          <Input
                            id="questionCount"
                            type="number"
                            min="20"
                            max="100"
                            value={driveForm.questionCount}
                            onChange={(e) => setDriveForm({...driveForm, questionCount: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Drive Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe the drive details, requirements, and process..."
                          value={driveForm.description}
                          onChange={(e) => setDriveForm({...driveForm, description: e.target.value})}
                          rows={3}
                        />
                      </div>

                      {/* File Upload */}
                      <div className="space-y-2">
                        <Label htmlFor="candidateFile">Candidate Data File</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                          <div className="text-center">
                            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4">
                              <label htmlFor="candidateFile" className="cursor-pointer">
                                <span className="text-blue-600 hover:text-blue-500">Upload Excel or CSV file</span>
                                <input
                                  id="candidateFile"
                                  type="file"
                                  className="sr-only"
                                  accept=".xlsx,.xls,.csv"
                                  onChange={handleFileUpload}
                                />
                              </label>
                              <p className="text-gray-500 text-sm mt-1">
                                Excel (.xlsx, .xls) or CSV file with candidate details (Name, Email, Phone, College)
                              </p>
                            </div>
                            {selectedFile && (
                              <div className="mt-2 text-sm text-green-600">
                                ✓ {selectedFile.name} selected
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handleCreateDrive}
                        disabled={isCreatingDrive}
                        className="w-full"
                        size="lg"
                      >
                        {isCreatingDrive ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Creating Drive Session...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Create Drive & Send Registration Links
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Active Drive Sessions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-green-500" />
                        Active Drive Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {activeDriveSessions.length === 0 ? (
                        <div className="text-center py-8">
                          <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No Active Drives</h3>
                          <p className="mt-2 text-gray-500">Create a new drive session to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {activeDriveSessions.map((session) => (
                            <div key={session.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg">{session.name}</h3>
                                  <p className="text-gray-600">{session.jobTitle}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <span>Type: {session.type}</span>
                                    <span>Cutoff: {session.cutoffScore}%</span>
                                    <span>Created: {new Date(session.createdAt).toLocaleDateString()}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  {getStatusBadge(session.status)}
                                  <div className="mt-2 space-y-1 text-sm">
                                    <div>Total: {session.totalCandidates}</div>
                                    <div>Registered: {session.registeredCandidates}</div>
                                    <div>Aptitude Done: {session.aptitudeCompleted}</div>
                                    <div>Aptitude Qualified: {session.aptitudeQualified}</div>
                                    <div>Technical Done: {session.technicalCompleted}</div>
                                    <div>Technical Qualified: {session.technicalQualified}</div>
                                    <div>Interview Scheduled: {session.interviewScheduled}</div>
                                    <div>Final Selected: {session.finalSelected}</div>
                                  </div>
                                </div>
                              </div>
                              {/* Multi-Stage Workflow Progress */}
                              <div className="mt-4 mb-4">
                                <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                                  <span>Registration</span>
                                  <span>Aptitude Test</span>
                                  <span>Technical Test</span>
                                  <span>Interview</span>
                                  <span>Selection</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={`h-2 flex-1 rounded ${session.registeredCandidates > 0 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                                  <div className={`h-2 flex-1 rounded ${session.aptitudeCompleted > 0 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                  <div className={`h-2 flex-1 rounded ${session.technicalCompleted > 0 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                                  <div className={`h-2 flex-1 rounded ${session.interviewScheduled > 0 ? 'bg-purple-500' : 'bg-gray-200'}`}></div>
                                  <div className={`h-2 flex-1 rounded ${session.finalSelected > 0 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                                </div>
                              </div>

                              <div className="flex gap-2 mt-4">
                                <Button variant="outline" size="sm" onClick={() => handleViewResults(session)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Results
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleSetCutoffScores(session)}>
                                  <Target className="w-4 h-4 mr-2" />
                                  Set Cutoff Scores
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleSendNextRound(session)}>
                                  <Mail className="w-4 h-4 mr-2" />
                                  Send Next Round
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleScheduleInterviews(session)}>
                                  <Users className="w-4 h-4 mr-2" />
                                  Schedule Interviews
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleDeleteDriveSession(session)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Candidates Section within Drive Tab */}
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Drive Candidates</h2>
                  
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600">Manage candidates from all drive sessions</p>
                    <div className="flex gap-2">
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export Data
                      </Button>
                      <Button>
                        <Send className="w-4 h-4 mr-2" />
                        Send Bulk Emails
                      </Button>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        All Drive Candidates ({driveCandidates.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {driveCandidates.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="mx-auto h-12 w-12 text-gray-400" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900">No Candidates</h3>
                          <p className="mt-2 text-gray-500">Candidates will appear here after creating drive sessions</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left p-2">Select</th>
                                <th className="text-left p-2">Name</th>
                                <th className="text-left p-2">Email</th>
                                <th className="text-left p-2">Phone</th>
                                <th className="text-left p-2">College</th>
                                <th className="text-left p-2">Status</th>
                                <th className="text-left p-2">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {driveCandidates.map((candidate) => (
                                <tr key={candidate.id} className="border-b">
                                  <td className="p-2">
                                    <Checkbox
                                      checked={selectedDriveCandidates.includes(candidate.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedDriveCandidates(prev => [...prev, candidate.id]);
                                        } else {
                                          setSelectedDriveCandidates(prev => prev.filter(id => id !== candidate.id));
                                        }
                                      }}
                                    />
                                  </td>
                                  <td className="p-2">{candidate.name}</td>
                                  <td className="p-2">{candidate.email}</td>
                                  <td className="p-2">{candidate.phone}</td>
                                  <td className="p-2">{candidate.college || '-'}</td>
                                  <td className="p-2">
                                    {getRegistrationStatusBadge(candidate.registrationStatus)}
                                  </td>
                                  <td className="p-2">
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleViewCandidate(candidate)}
                                    >
                                      View
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
          </TabsContent>
        </Tabs>
        </main>
      </div>

      {/* Bulk Candidate Management Dialog */}
      <Dialog open={isBulkCandidateDialogOpen} onOpenChange={setIsBulkCandidateDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Bulk Candidate Review & Management
            </DialogTitle>
          </DialogHeader>
          
          {selectedBulkJobId && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selectedCandidateIds.length === bulkCandidates.length && bulkCandidates.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-gray-600">
                    {selectedCandidateIds.length} of {bulkCandidates.length} candidates selected
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleShortlistCandidates}
                    disabled={selectedCandidateIds.length === 0 || isShortlisting}
                  >
                    {isShortlisting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Shortlisting...
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-2" />
                        Shortlist Selected
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleAddToMainList}
                    disabled={selectedCandidateIds.length === 0 || isAddingToMainList}
                  >
                    {isAddingToMainList ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add to Main List
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={handleSendScreeningEmails}
                    disabled={selectedCandidateIds.length === 0 || isSendingEmails}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSendingEmails ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Screening Emails
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Candidates Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>AI Matching Score</TableHead>
                      <TableHead>Skills Match</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bulkCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCandidateIds.includes(candidate.id)}
                            onCheckedChange={(checked) => 
                              handleCandidateSelection(candidate.id, checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {candidate.firstName} {candidate.lastName}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-32">
                              {candidate.skills.length > 0 ? candidate.skills.join(', ') : 'No skills listed'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{candidate.email}</div>
                            <div className="text-gray-500">{candidate.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getMatchingScoreBadge(candidate.matchingScore)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {candidate.skills.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {candidate.skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {candidate.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{candidate.skills.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">No skills</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {candidate.experience} years
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {candidate.isShortlisted && (
                              <Badge className="bg-yellow-100 text-yellow-800">Shortlisted</Badge>
                            )}
                            {candidate.addedToMainList && (
                              <Badge className="bg-green-100 text-green-800">In Main List</Badge>
                            )}
                            {!candidate.isShortlisted && !candidate.addedToMainList && (
                              <Badge variant="outline">Pending Review</Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {bulkCandidates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Candidates Found</h3>
                  <p>This bulk job doesn't have any processed candidates yet.</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Cutoff Score Management Dialog */}
      <Dialog open={isCutoffDialogOpen} onOpenChange={setIsCutoffDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Manage Cutoff Scores
            </DialogTitle>
            <DialogDescription>
              Adjust cutoff scores for {selectedDriveSession?.name}. Changes will recalculate candidate qualifications.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="cutoffs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="cutoffs">Cutoff Scores</TabsTrigger>
              <TabsTrigger value="filter">Filter Candidates</TabsTrigger>
              <TabsTrigger value="actions">Bulk Actions</TabsTrigger>
            </TabsList>
            
            <TabsContent value="cutoffs" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="aptitudeCutoff">Aptitude Test Cutoff (%)</Label>
                  <Input
                    id="aptitudeCutoff"
                    type="number"
                    min="0"
                    max="100"
                    value={cutoffForm.aptitudeCutoff}
                    onChange={(e) => setCutoffForm(prev => ({ ...prev, aptitudeCutoff: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Current qualified: {selectedDriveSession?.aptitudeQualified || 0}
                  </p>
                </div>
                
                <div>
                  <Label htmlFor="technicalCutoff">Technical Test Cutoff (%)</Label>
                  <Input
                    id="technicalCutoff"
                    type="number"
                    min="0"
                    max="100"
                    value={cutoffForm.technicalCutoff}
                    onChange={(e) => setCutoffForm(prev => ({ ...prev, technicalCutoff: parseInt(e.target.value) || 0 }))}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Current qualified: {selectedDriveSession?.technicalQualified || 0}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCutoffDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateCutoffs} 
                  disabled={isUpdatingCutoffs}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdatingCutoffs ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4 mr-2" />
                      Update & Recalculate
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="filter" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Aptitude Score Range</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={candidateFilters.minAptitude}
                      onChange={(e) => setCandidateFilters(prev => ({ ...prev, minAptitude: parseInt(e.target.value) || 0 }))}
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={candidateFilters.maxAptitude}
                      onChange={(e) => setCandidateFilters(prev => ({ ...prev, maxAptitude: parseInt(e.target.value) || 100 }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Technical Score Range</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={candidateFilters.minTechnical}
                      onChange={(e) => setCandidateFilters(prev => ({ ...prev, minTechnical: parseInt(e.target.value) || 0 }))}
                    />
                    <span>to</span>
                    <Input
                      type="number"
                      placeholder="Max"
                      value={candidateFilters.maxTechnical}
                      onChange={(e) => setCandidateFilters(prev => ({ ...prev, maxTechnical: parseInt(e.target.value) || 100 }))}
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Current Round</Label>
                  <Select 
                    value={candidateFilters.currentRound} 
                    onValueChange={(value) => setCandidateFilters(prev => ({ ...prev, currentRound: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rounds</SelectItem>
                      <SelectItem value="1">Round 1 (Aptitude)</SelectItem>
                      <SelectItem value="2">Round 2 (Technical)</SelectItem>
                      <SelectItem value="3">Round 3 (Interview)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={candidateFilters.status} 
                    onValueChange={(value) => setCandidateFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="registered">Registered</SelectItem>
                      <SelectItem value="aptitude_completed">Aptitude Completed</SelectItem>
                      <SelectItem value="aptitude_qualified">Aptitude Qualified</SelectItem>
                      <SelectItem value="technical_completed">Technical Completed</SelectItem>
                      <SelectItem value="technical_qualified">Technical Qualified</SelectItem>
                      <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleFilterCandidates} 
                  disabled={isFiltering}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isFiltering ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Filtering...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Apply Filters
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={handleExportCandidates}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
                
                {filteredCandidates.length > 0 && (
                  <Badge variant="secondary" className="px-3 py-1">
                    {filteredCandidates.length} candidates found
                  </Badge>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="actions" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Bulk Interview Scheduling</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Select qualified candidates to schedule AI video interviews. 
                    {selectedDriveCandidates.length > 0 && ` ${selectedDriveCandidates.length} candidates selected.`}
                  </p>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleBulkScheduleInterviews}
                      disabled={selectedDriveCandidates.length === 0 || isBulkScheduling}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isBulkScheduling ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Scheduling...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4 mr-2" />
                          Schedule Selected ({selectedDriveCandidates.length})
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedDriveCandidates([])}
                      disabled={selectedDriveCandidates.length === 0}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <Mail className="w-4 h-4 mr-2" />
                      Send Reminders
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download Reports
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Results Management Dialog */}
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Drive Results: {selectedDriveSession?.name}</DialogTitle>
            <DialogDescription>
              Complete test results and candidate progression through all rounds
            </DialogDescription>
          </DialogHeader>
          
          {selectedDriveSession && (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{selectedDriveSession.totalCandidates}</div>
                  <div className="text-sm text-blue-800">Total Registered</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{selectedDriveSession.aptitudeQualified}</div>
                  <div className="text-sm text-green-800">Aptitude Qualified</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{selectedDriveSession.technicalQualified}</div>
                  <div className="text-sm text-yellow-800">Technical Qualified</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{selectedDriveSession.interviewScheduled}</div>
                  <div className="text-sm text-purple-800">Interview Scheduled</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{selectedDriveSession.finalSelected}</div>
                  <div className="text-sm text-red-800">Final Selected</div>
                </div>
              </div>

              {/* Progress Visualization */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Progression Overview</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium">Registration</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                    <div className="w-16 text-sm text-right">{selectedDriveSession.totalCandidates}</div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium">Aptitude Test</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${(selectedDriveSession.aptitudeQualified / selectedDriveSession.totalCandidates) * 100}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-sm text-right">{selectedDriveSession.aptitudeQualified}</div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium">Technical Test</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${(selectedDriveSession.technicalQualified / selectedDriveSession.totalCandidates) * 100}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-sm text-right">{selectedDriveSession.technicalQualified}</div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium">Interview Round</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{ width: `${(selectedDriveSession.interviewScheduled / selectedDriveSession.totalCandidates) * 100}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-sm text-right">{selectedDriveSession.interviewScheduled}</div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium">Final Selection</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${(selectedDriveSession.finalSelected / selectedDriveSession.totalCandidates) * 100}%` }}
                      ></div>
                    </div>
                    <div className="w-16 text-sm text-right">{selectedDriveSession.finalSelected}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </Button>
                <Button variant="outline" className="flex-1">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Next Round Invites
                </Button>
                <Button variant="outline" className="flex-1">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Interviews
                </Button>
                <Button onClick={() => setIsResultsDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Candidate Test Details Dialog */}
      <Dialog open={candidateDetailsOpen} onOpenChange={setCandidateDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Test Results: {selectedCandidate?.name}
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of test performance and scoring
            </DialogDescription>
          </DialogHeader>
          
          {candidateDetailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : candidateTestDetails ? (
            <div className="space-y-6">
              {/* Candidate Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Candidate Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <div>
                        <p className="font-medium text-lg">{candidateTestDetails?.candidate?.name || selectedCandidate?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">{candidateTestDetails?.candidate?.email || selectedCandidate?.email || 'No email'}</p>
                        <p className="text-sm text-gray-600">{candidateTestDetails?.candidate?.phone || selectedCandidate?.phone || 'No phone'}</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm"><span className="font-medium">College:</span> {candidateTestDetails?.candidate?.college || selectedCandidate?.college || 'Not specified'}</p>
                        <p className="text-sm"><span className="font-medium">Registration Date:</span> {candidateTestDetails?.candidate?.registeredAt ? new Date(candidateTestDetails.candidate.registeredAt).toLocaleDateString() : 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm"><span className="font-medium">Current Round:</span> {candidateTestDetails?.candidate?.currentRound || selectedCandidate?.currentRound || 'N/A'}</p>
                        <p className="text-sm"><span className="font-medium">Status:</span> {candidateTestDetails?.candidate?.registrationStatus || selectedCandidate?.status || 'Unknown'}</p>
                        <p className="text-sm"><span className="font-medium">Qualification:</span> {candidateTestDetails?.candidate?.qualificationStatus || 'Pending'}</p>
                      </div>
                      <div className="pt-2">
                        <p className="text-sm"><span className="font-medium">Aptitude Score:</span> {candidateTestDetails?.candidate?.aptitudeScore || selectedCandidate?.aptitudeScore || 'N/A'}%</p>
                        <p className="text-sm"><span className="font-medium">Technical Score:</span> {candidateTestDetails?.candidate?.technicalScore || selectedCandidate?.technicalScore || 'N/A'}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Test Results */}
              {candidateTestDetails?.testDetails && candidateTestDetails.testDetails.length > 0 ? candidateTestDetails.testDetails.map((test: any, index: number) => (
                <Card key={test.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {test.testRound === 1 ? <Brain className="h-5 w-5 text-blue-500" /> : <Code className="h-5 w-5 text-green-500" />}
                      Round {test.testRound}: {test.roundType}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Score Overview */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">{test.scorePercentage}%</div>
                          <div className="text-sm text-blue-800">Final Score</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-green-600">{test.correctAnswers}</div>
                          <div className="text-sm text-green-800">Correct Answers</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-yellow-600">{test.actualQuestionsAsked}</div>
                          <div className="text-sm text-yellow-800">Questions Asked</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-600">{test.testRound === 1 ? candidateTestDetails.driveSession.aptitudeCutoff : candidateTestDetails.driveSession.technicalCutoff}%</div>
                          <div className="text-sm text-purple-800">Cutoff Required</div>
                        </div>
                      </div>

                      {/* Score Calculation Explanation */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Score Calculation</h4>
                        <p className="text-sm text-gray-700">
                          Score = (Correct Answers ÷ Questions Asked) × 100
                        </p>
                        <p className="text-sm text-gray-700">
                          {test.correctAnswers} ÷ {test.actualQuestionsAsked} × 100 = <span className="font-bold">{test.scorePercentage}%</span>
                        </p>
                        <p className="text-sm mt-2">
                          <span className={`font-medium ${test.passed ? 'text-green-600' : 'text-red-600'}`}>
                            {test.passed ? '✓ Qualified' : '✗ Not Qualified'} 
                          </span>
                          {' '}(Required: {test.testRound === 1 ? candidateTestDetails?.driveSession?.aptitudeCutoff : candidateTestDetails?.driveSession?.technicalCutoff}%)
                        </p>
                      </div>

                      {/* Test Details */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p><span className="font-medium">Test Duration:</span> {candidateTestDetails?.driveSession?.testDuration || 'N/A'} minutes</p>
                          <p><span className="font-medium">Started At:</span> {test.createdAt ? new Date(test.createdAt).toLocaleString() : 'N/A'}</p>
                        </div>
                        <div>
                          <p><span className="font-medium">Completed At:</span> {test.completedAt ? new Date(test.completedAt).toLocaleString() : 'N/A'}</p>
                          <p><span className="font-medium">Status:</span> <Badge variant={test.status === 'completed' ? 'default' : 'secondary'}>{test.status}</Badge></p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                      No Test Sessions Found
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">This candidate hasn't completed any tests yet, or test session data is not available.</p>
                    {candidateTestDetails?.candidate && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900">Current Status Summary</h4>
                        <div className="mt-2 space-y-1 text-sm text-blue-800">
                          <p>• Registration Status: {candidateTestDetails.candidate.registrationStatus}</p>
                          <p>• Current Round: Round {candidateTestDetails.candidate.currentRound}</p>
                          {candidateTestDetails.candidate.aptitudeScore && (
                            <p>• Aptitude Score: {candidateTestDetails.candidate.aptitudeScore}%</p>
                          )}
                          {candidateTestDetails.candidate.technicalScore && (
                            <p>• Technical Score: {candidateTestDetails.candidate.technicalScore}%</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setCandidateDetailsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No test details available for this candidate.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
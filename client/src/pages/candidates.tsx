import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import CandidateTable from "@/components/candidates/candidate-table";
import AddCandidateDialog from "@/components/candidates/add-candidate-dialog";
import CandidateDetailsDialog from "@/components/candidates/candidate-details-dialog";
import ScreeningEmailDialog from "@/components/candidates/screening-email-dialog";
import ScheduleInterviewDialog from "@/components/candidates/schedule-interview-dialog";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Archive, RotateCcw } from "lucide-react";
import { Candidate, Job } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Candidates() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    jobId: "all",
    status: "all",
    scoreRange: "all",
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

  const { data: candidates = [], isLoading: candidatesLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates"],
    enabled: isAuthenticated,
  });

  const { data: archivedCandidates = [], isLoading: archivedLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates/archived"],
    enabled: isAuthenticated,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ["/api/jobs"],
    enabled: isAuthenticated,
  });

  const deleteCandidateMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      console.log("Making delete request for candidate:", candidateId);
      return apiRequest("DELETE", `/api/candidates/${candidateId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "Success",
        description: "Candidate deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Delete candidate error:", error);
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message || "Failed to delete candidate",
        variant: "destructive",
      });
    },
  });

  const archiveCandidateMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      return apiRequest("POST", `/api/candidates/${candidateId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates/archived"] });
      toast({
        title: "Success",
        description: "Candidate archived successfully",
      });
    },
    onError: (error) => {
      console.error("Archive candidate error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to archive candidate",
        variant: "destructive",
      });
    },
  });

  const handleDeleteCandidate = (candidate: Candidate) => {
    console.log("Deleting candidate:", candidate.id);
    deleteCandidateMutation.mutate(candidate.id);
  };

  const handleArchiveCandidate = (candidate: Candidate) => {
    archiveCandidateMutation.mutate(candidate.id);
  };

  const restoreCandidateMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      return apiRequest("POST", `/api/candidates/${candidateId}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates/archived"] });
      toast({
        title: "Success",
        description: "Candidate restored successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore candidate",
        variant: "destructive",
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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-48'}`}>
        <Header />
        <main className="flex-1 flex flex-col bg-background p-8 min-h-0">
          {/* Page Header */}
          <div className="flex justify-end items-center mb-8">
            <div className="flex items-center gap-4">
              {!showArchived && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  Add New Candidate
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowArchived(!showArchived)}
                className="flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                {showArchived ? 'Show Active Candidates' : `Archived Candidates (${archivedCandidates.length})`}
              </Button>
            </div>
          </div>

          {/* Filters - Only show for active candidates */}
          {!showArchived && (
            <Card className="mb-6">
              <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Job Position</label>
                            <Select value={filters.jobId} onValueChange={(value) => setFilters(prev => ({ ...prev, jobId: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="All Positions" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Positions</SelectItem>
                                {jobs.map((job) => (
                                  <SelectItem key={job.id} value={job.id.toString()}>
                                    {job.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Status</label>
                            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="All Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="interviewed">Interview Scheduled</SelectItem>
                                <SelectItem value="offered">Offer Extended</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-2">Score Range</label>
                            <Select value={filters.scoreRange} onValueChange={(value) => setFilters(prev => ({ ...prev, scoreRange: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="All Scores" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Scores</SelectItem>
                                <SelectItem value="90-100">90-100</SelectItem>
                                <SelectItem value="80-89">80-89</SelectItem>
                                <SelectItem value="70-79">70-79</SelectItem>
                                <SelectItem value="below-70">Below 70</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-end">
                            <Button className="w-full">Apply Filters</Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
          )}

          {/* Main Content */}
          {showArchived ? (
            archivedLoading ? (
              <div className="bg-card rounded-lg shadow-sm border border-border animate-pulse">
                <div className="p-6">
                  <div className="h-6 bg-muted rounded mb-4"></div>
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex space-x-4">
                        <div className="h-4 bg-muted rounded flex-1"></div>
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-4 bg-muted rounded w-16"></div>
                        <div className="h-4 bg-muted rounded w-20"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : archivedCandidates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No archived candidates</p>
                <p className="text-muted-foreground mt-2 opacity-60">Candidates you archive will appear here</p>
              </div>
            ) : (
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Archive className="w-5 h-5" />
                    Archived Candidates ({archivedCandidates.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Archived Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {archivedCandidates.map((candidate) => (
                        <TableRow key={candidate.id} className="opacity-75">
                          <TableCell className="font-medium">
                            {candidate.firstName} {candidate.lastName}
                          </TableCell>
                          <TableCell>{candidate.email}</TableCell>
                          <TableCell>{candidate.position || "-"}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              Archived
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {candidate.experience ? `${candidate.experience} years` : "-"}
                          </TableCell>
                          <TableCell>{candidate.location || "-"}</TableCell>
                          <TableCell>
                            {candidate.archivedAt ? new Date(candidate.archivedAt).toLocaleDateString() : "Unknown"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restoreCandidateMutation.mutate(candidate.id)}
                              disabled={restoreCandidateMutation.isPending}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restore
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          ) : (
            <div className="flex-1 min-h-0 overflow-hidden">
              <CandidateTable 
                candidates={candidates} 
                isLoading={candidatesLoading}
                onViewCandidate={(candidate) => {
                  setSelectedCandidate(candidate);
                  setIsDetailsDialogOpen(true);
                }}
                onEmailCandidate={(candidate) => {
                  setSelectedCandidate(candidate);
                  setIsEmailDialogOpen(true);
                }}
                onScheduleInterview={(candidate) => {
                  setSelectedCandidate(candidate);
                  setIsScheduleDialogOpen(true);
                }}
                onDelete={handleDeleteCandidate}
                onArchive={handleArchiveCandidate}
              />
            </div>
          )}

        {/* Dialogs */}
        <AddCandidateDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen}
          jobs={jobs}
        />

        <CandidateDetailsDialog
          candidate={selectedCandidate}
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          onEmail={(candidate) => {
            setSelectedCandidate(candidate);
            setIsDetailsDialogOpen(false);
            setIsEmailDialogOpen(true);
          }}
          onSchedule={(candidate) => {
            setSelectedCandidate(candidate);
            setIsDetailsDialogOpen(false);
            setIsScheduleDialogOpen(true);
          }}
        />

        <ScreeningEmailDialog
          candidate={selectedCandidate}
          open={isEmailDialogOpen}
          onOpenChange={setIsEmailDialogOpen}
        />

        <ScheduleInterviewDialog
          candidate={selectedCandidate}
          open={isScheduleDialogOpen}
          onOpenChange={setIsScheduleDialogOpen}
        />
        </main>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Archive, Trash2, Eye, Edit, Send } from "lucide-react";
import { Job } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface JobsTableProps {
  jobs: Job[];
  onViewJob?: (job: Job) => void;
  onManageJob?: (job: Job) => void;
  onPostToPlatforms?: (job: Job) => void;
  onViewDetails?: (job: Job) => void;
  onManage?: (job: Job) => void;
  isLoading?: boolean;
  archived?: boolean;
}

export default function JobsTable({ 
  jobs, 
  onViewJob, 
  onManageJob, 
  onPostToPlatforms,
  onViewDetails, 
  onManage,
  isLoading,
  archived 
}: JobsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [dropReason, setDropReason] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-amber-100 text-amber-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      case "dropped":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canTransitionToStatus = (currentStatus: string, newStatus: string) => {
    const allowedTransitions: Record<string, string[]> = {
      draft: ["active"],
      active: ["closed", "dropped"],
      closed: [],
      dropped: [],
    };
    return allowedTransitions[currentStatus]?.includes(newStatus) || false;
  };

  const updateJobMutation = useMutation({
    mutationFn: async ({ id, status, dropReason }: { id: number; status: string; dropReason?: string }) => {
      return apiRequest("PATCH", `/api/jobs/${id}`, { status, dropReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job status updated successfully.",
      });
      setDropDialogOpen(false);
      setDropReason("");
      setSelectedJob(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job status.",
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/jobs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (job: Job, newStatus: string) => {
    if (newStatus === "dropped") {
      setSelectedJob(job);
      setDropDialogOpen(true);
    } else {
      updateJobMutation.mutate({ id: job.id, status: newStatus });
    }
  };

  const handleDropJob = () => {
    if (!selectedJob || !dropReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for dropping this job.",
        variant: "destructive",
      });
      return;
    }
    updateJobMutation.mutate({
      id: selectedJob.id,
      status: "dropped",
      dropReason: dropReason.trim(),
    });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Separate active and archived jobs
  const activeJobs = jobs.filter(job => job.status === "draft" || job.status === "active");
  const archivedJobs = jobs.filter(job => job.status === "closed" || job.status === "dropped");

  return (
    <div className="space-y-8">
      {/* Active Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Active Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Work Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Positions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeJobs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                    No active jobs found
                  </TableCell>
                </TableRow>
              ) : (
                activeJobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell className="capitalize">{job.workType}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{job.positions}</TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => (onViewJob || onViewDetails)?.(job)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => (onManageJob || onManage)?.(job)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          {job.status === 'draft' ? 'Publish' : 'Manage'}
                        </Button>
                        {job.status === 'active' && onPostToPlatforms && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                            onClick={() => onPostToPlatforms(job)}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            Post to Platforms
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canTransitionToStatus(job.status, "active") && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(job, "active")}
                              >
                                Activate Job
                              </DropdownMenuItem>
                            )}
                            {canTransitionToStatus(job.status, "closed") && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(job, "closed")}
                              >
                                <Archive className="w-4 h-4 mr-2" />
                                Close Job
                              </DropdownMenuItem>
                            )}
                            {canTransitionToStatus(job.status, "dropped") && (
                              <DropdownMenuItem
                                onClick={() => handleStatusChange(job, "dropped")}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Drop Job
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => deleteJobMutation.mutate(job.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Archived Jobs Table */}
      {archivedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archived Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Work Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Positions</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedJobs.map((job) => (
                  <TableRow key={job.id} className="opacity-75">
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>{job.department}</TableCell>
                    <TableCell className="capitalize">{job.workType}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{job.positions}</TableCell>
                    <TableCell>{formatDate(job.createdAt)}</TableCell>
                    <TableCell>
                      {job.status === "dropped" && job.dropReason ? (
                        <span className="text-sm text-gray-600" title={job.dropReason}>
                          {job.dropReason.length > 30 
                            ? `${job.dropReason.substring(0, 30)}...` 
                            : job.dropReason}
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(job)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Drop Job Dialog */}
      <Dialog open={dropDialogOpen} onOpenChange={setDropDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Drop Job</DialogTitle>
            <DialogDescription>
              Please provide a reason for dropping this job posting. This action will archive the job.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Enter reason for dropping this job..."
              value={dropReason}
              onChange={(e) => setDropReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDropDialogOpen(false);
                  setDropReason("");
                  setSelectedJob(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDropJob}
                disabled={!dropReason.trim() || updateJobMutation.isPending}
              >
                Drop Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
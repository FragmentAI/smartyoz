import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Job } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface JobManageDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function JobManageDialog({
  job,
  open,
  onOpenChange
}: JobManageDialogProps) {
  const [formData, setFormData] = useState({
    status: job?.status || 'draft',
    positions: job?.positions || 1,
    salaryMin: job?.salaryMin || '',
    salaryMax: job?.salaryMax || '',
  });

  // Define allowed status transitions
  const getAvailableStatuses = (currentStatus: string) => {
    const statusMap: Record<string, { value: string; label: string }[]> = {
      draft: [
        { value: 'draft', label: 'Draft' },
        { value: 'active', label: 'Active' }
      ],
      active: [
        { value: 'active', label: 'Active' },
        { value: 'closed', label: 'Closed' },
        { value: 'dropped', label: 'Dropped' }
      ],
      closed: [
        { value: 'closed', label: 'Closed' }
      ],
      dropped: [
        { value: 'dropped', label: 'Dropped' }
      ]
    };
    return statusMap[currentStatus] || [{ value: currentStatus, label: currentStatus }];
  };

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateJobMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!job) throw new Error('No job selected');
      
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Updated",
        description: "Job details have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update job",
        variant: "destructive",
      });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async () => {
      if (!job) throw new Error('No job selected');
      
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Job Deleted",
        description: "Job has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    },
  });

  const handleUpdateJob = () => {
    const updateData: any = {};
    
    if (formData.status !== job?.status) {
      updateData.status = formData.status;
    }
    if (formData.positions !== job?.positions) {
      updateData.positions = formData.positions;
    }
    if (formData.salaryMin !== job?.salaryMin) {
      updateData.salaryMin = formData.salaryMin ? Number(formData.salaryMin) : null;
    }
    if (formData.salaryMax !== job?.salaryMax) {
      updateData.salaryMax = formData.salaryMax ? Number(formData.salaryMax) : null;
    }

    if (Object.keys(updateData).length > 0) {
      updateJobMutation.mutate(updateData);
    } else {
      onOpenChange(false);
    }
  };

  const handleDeleteJob = () => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      deleteJobMutation.mutate();
    }
  };

  if (!job) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-amber-100 text-amber-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" aria-describedby="job-manage-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold">Manage Job</h2>
              <p className="text-gray-600 text-sm">{job.title}</p>
            </div>
            <Badge className={getStatusColor(job.status)}>
              {job.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div id="job-manage-description" className="space-y-4">
          <div>
            <Label>Job Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {getAvailableStatuses(job.status).map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="positions">Number of Positions</Label>
            <Input
              id="positions"
              type="number"
              min="1"
              value={formData.positions}
              onChange={(e) => setFormData(prev => ({ ...prev, positions: parseInt(e.target.value) || 1 }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="salaryMin">Minimum Salary</Label>
              <Input
                id="salaryMin"
                type="number"
                placeholder="e.g. 50000"
                value={formData.salaryMin}
                onChange={(e) => setFormData(prev => ({ ...prev, salaryMin: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="salaryMax">Maximum Salary</Label>
              <Input
                id="salaryMax"
                type="number"
                placeholder="e.g. 80000"
                value={formData.salaryMax}
                onChange={(e) => setFormData(prev => ({ ...prev, salaryMax: e.target.value }))}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Applications:</span>
                <span className="ml-2 font-medium">0</span>
              </div>
              <div>
                <span className="text-gray-600">Qualified:</span>
                <span className="ml-2 font-medium">0</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDeleteJob}
            disabled={deleteJobMutation.isPending}
          >
            {deleteJobMutation.isPending ? "Deleting..." : "Delete Job"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateJobMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateJob}
              disabled={updateJobMutation.isPending}
            >
              {updateJobMutation.isPending ? "Updating..." : "Update Job"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
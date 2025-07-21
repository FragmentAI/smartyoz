import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Users, Calendar, DollarSign, FileText, Settings } from "lucide-react";
import { Job } from "@shared/schema";

interface JobDetailsDialogProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManage?: (job: Job) => void;
}

export default function JobDetailsDialog({
  job,
  open,
  onOpenChange,
  onManage
}: JobDetailsDialogProps) {
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" aria-describedby="job-details-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-semibold">{job.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-600">{job.department}</span>
                <Badge className={getStatusColor(job.status)}>
                  {job.status}
                </Badge>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div id="job-details-description" className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Job Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Location</span>
                  <p className="text-sm">{job.location || 'Not specified'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Work Type</span>
                  <p className="text-sm">{job.workType}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Experience Required</span>
                  <p className="text-sm">{job.experienceLevel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Positions</span>
                  <p className="text-sm">{job.positions} open position{job.positions !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Salary Information */}
          {(job.salaryMin || job.salaryMax) && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Compensation</h3>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium text-gray-500">Salary Range</span>
                  <p className="text-sm">
                    {job.salaryMin && job.salaryMax 
                      ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                      : job.salaryMin 
                      ? `From $${job.salaryMin.toLocaleString()}`
                      : job.salaryMax 
                      ? `Up to $${job.salaryMax.toLocaleString()}`
                      : 'Not specified'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Job Description */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Job Description</h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">Requirements</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.requirements}</p>
                </div>
              </div>
            </>
          )}

          {/* Benefits */}
          {job.benefits && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">Benefits</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{job.benefits}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Timeline</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Created</span>
                <p className="text-sm">{formatDate(job.createdAt)}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Last Updated</span>
                <p className="text-sm">{formatDate(job.updatedAt)}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={() => {
                onOpenChange(false);
                onManage?.(job);
              }}
              className="flex-1"
            >
              <Settings className="w-4 h-4 mr-2" />
              {job.status === 'draft' ? 'Publish Job' : 'Manage Job'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
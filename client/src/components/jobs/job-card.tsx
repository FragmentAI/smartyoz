import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Job } from "@shared/schema";

interface JobCardProps {
  job: Job;
  onViewDetails?: (job: Job) => void;
  onManage?: (job: Job) => void;
}

export default function JobCard({ job, onViewDetails, onManage }: JobCardProps) {
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
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
            <p className="text-sm text-gray-600">{job.department} • {job.workType}</p>
          </div>
          <Badge className={getStatusColor(job.status)}>
            {job.status}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Applications</span>
            <span className="text-sm font-medium text-gray-900">{(job as any).applicationCount || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Qualified</span>
            <span className="text-sm font-medium text-gray-900">0</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Positions</span>
            <span className="text-sm font-medium text-gray-900">{job.positions}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {job.status === 'draft' ? 'Created' : 'Posted'}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {formatDate(job.createdAt)}
            </span>
          </div>
        </div>
        
        <div className="mt-6 flex space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onViewDetails?.(job)}
          >
            View Details
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => onManage?.(job)}
          >
            {job.status === 'draft' ? 'Publish' : 'Manage'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

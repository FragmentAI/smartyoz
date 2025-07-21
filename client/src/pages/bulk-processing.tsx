import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import UploadArea from "@/components/bulk-processing/upload-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Job } from "@shared/schema";
import { BulkJobWithDetails } from "@/types";

export default function BulkHire() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const { data: bulkJobs = [] } = useQuery<BulkJobWithDetails[]>({
    queryKey: ["/api/bulk-jobs"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Complete</Badge>;
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Bulk Processing</h1>
            <p className="text-gray-600 mt-2">Upload multiple resumes and automatically screen them for a specific job</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Section */}
            <div className="lg:col-span-2">
              <UploadArea jobs={jobs} />
            </div>

            {/* Status and Recent Jobs */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Processing Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Files</span>
                      <span className="text-sm font-medium text-gray-900">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Processed</span>
                      <span className="text-sm font-medium text-gray-900">0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Qualified</span>
                      <span className="text-sm font-medium text-gray-900">0</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: "0%" }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Bulk Jobs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bulkJobs.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No bulk jobs yet</p>
                    ) : (
                      bulkJobs.slice(0, 5).map((bulkJob) => (
                        <div 
                          key={bulkJob.id} 
                          className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                          onClick={() => navigate(`/bulk-results/${bulkJob.id}`)}
                        >
                          <div>
                            <p className="text-sm font-medium text-blue-600 hover:text-blue-800">
                              {bulkJob.job.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {bulkJob.processedFiles}/{bulkJob.totalFiles} processed
                            </p>
                          </div>
                          {getStatusBadge(bulkJob.status)}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

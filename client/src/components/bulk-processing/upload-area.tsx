import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Upload } from "lucide-react";
import { Job } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

interface UploadAreaProps {
  jobs: Job[];
}

export default function UploadArea({ jobs }: UploadAreaProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processingOptions, setProcessingOptions] = useState({
    autoScreening: true,
    jdMatching: true,
    autoSchedule: false,
  });

  const bulkProcessMutation = useMutation({
    mutationFn: async ({ jobId, files, options }: { 
      jobId: string; 
      files: File[]; 
      options: typeof processingOptions 
    }) => {
      const formData = new FormData();
      formData.append('jobId', jobId);
      formData.append('autoScreening', options.autoScreening.toString());
      formData.append('jdMatching', options.jdMatching.toString());
      formData.append('autoSchedule', options.autoSchedule.toString());
      
      files.forEach((file) => {
        formData.append('resumes', file);
      });

      const response = await fetch('/api/bulk-jobs', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/bulk-jobs"] });
      toast({
        title: "Success",
        description: "Bulk processing started successfully. Redirecting to results page...",
      });
      setSelectedFiles([]);
      setSelectedJobId("");
      
      // Navigate to results page after a short delay
      setTimeout(() => {
        navigate(`/bulk-results/${data.id}`);
      }, 1500);
    },
    onError: (error) => {
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
        description: "Failed to start bulk processing",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleSubmit = () => {
    if (!selectedJobId) {
      toast({
        title: "Error",
        description: "Please select a job position",
        variant: "destructive",
      });
      return;
    }

    if (selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    bulkProcessMutation.mutate({
      jobId: selectedJobId,
      files: selectedFiles,
      options: processingOptions,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Resume Folder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Job Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Target Job</label>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a job position..." />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id.toString()}>
                  {job.title} (Job ID: {job.id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4">
            <label className="cursor-pointer">
              <span className="text-primary font-medium">Click to upload</span>
              <span className="text-gray-500"> or drag and drop</span>
              <input 
                type="file" 
                className="sr-only" 
                multiple 
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX up to 10MB each</p>
          
          {selectedFiles.length > 0 && (
            <div className="mt-4 text-left">
              <p className="text-sm font-medium text-gray-900 mb-2">
                Selected files ({selectedFiles.length}):
              </p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {selectedFiles.map((file, index) => (
                  <p key={index} className="text-xs text-gray-600 truncate">
                    {file.name}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Processing Options */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="autoScreening"
              checked={processingOptions.autoScreening}
              onCheckedChange={(checked) => 
                setProcessingOptions(prev => ({ ...prev, autoScreening: checked as boolean }))
              }
            />
            <label htmlFor="autoScreening" className="text-sm text-gray-700">
              Automatic initial screening
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="jdMatching"
              checked={processingOptions.jdMatching}
              onCheckedChange={(checked) => 
                setProcessingOptions(prev => ({ ...prev, jdMatching: checked as boolean }))
              }
            />
            <label htmlFor="jdMatching" className="text-sm text-gray-700">
              JD matching analysis
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="autoSchedule"
              checked={processingOptions.autoSchedule}
              onCheckedChange={(checked) => 
                setProcessingOptions(prev => ({ ...prev, autoSchedule: checked as boolean }))
              }
            />
            <label htmlFor="autoSchedule" className="text-sm text-gray-700">
              Auto-schedule qualified candidates
            </label>
          </div>
        </div>

        <Button 
          className="w-full" 
          onClick={handleSubmit}
          disabled={bulkProcessMutation.isPending || !selectedJobId || selectedFiles.length === 0}
        >
          {bulkProcessMutation.isPending ? "Processing..." : "Start Bulk Processing"}
        </Button>
      </CardContent>
    </Card>
  );
}

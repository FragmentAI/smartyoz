import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlayIcon, UserIcon, BriefcaseIcon, CalendarIcon, MailIcon, RefreshCwIcon } from 'lucide-react';

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

export default function InterviewLauncher() {
  const [, setLocation] = useLocation();
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch candidates with their applications
  const { data: candidateApplications, isLoading: candidatesLoading, refetch: refetchCandidates } = useQuery<CandidateApplication[]>({
    queryKey: ['/api/candidates-with-applications'],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache data
  });

  // Create interview session mutation
  const createInterviewMutation = useMutation({
    mutationFn: async (applicationId: number) => {
      const response = await fetch('/api/interview-sessions/create-dev', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });
      if (!response.ok) {
        throw new Error('Failed to create interview session');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Navigate to the interview page with the generated token
      setLocation(`/interview/${data.token}`);
    }
  });

  const selectedApplication = candidateApplications?.find(app => app.applicationId === selectedApplicationId);

  const handleLaunchInterview = () => {
    if (selectedApplicationId) {
      createInterviewMutation.mutate(selectedApplicationId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Interview Launcher
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Development tool for testing AI video interviews with actual candidates
          </p>
        </div>

        <Card className="bg-white dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <PlayIcon className="h-5 w-5 text-blue-500" />
                <span>Launch AI Interview</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchCandidates()}
                className="flex items-center space-x-1"
              >
                <RefreshCwIcon className="h-4 w-4" />
                <span>Refresh</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Candidate Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Candidate Application
              </label>
              <Select
                value={selectedApplicationId?.toString() || ''}
                onValueChange={(value) => setSelectedApplicationId(parseInt(value))}
                disabled={candidatesLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a candidate application for the interview" />
                </SelectTrigger>
                <SelectContent>
                  {candidateApplications?.map((app) => (
                    <SelectItem key={app.applicationId} value={app.applicationId.toString()}>
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4" />
                        <span>{app.firstName} {app.lastName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {app.jobTitle}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Selected Candidate Details */}
            {selectedApplication && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <UserIcon className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedApplication.firstName} {selectedApplication.lastName}
                  </h3>
                  <Badge variant="outline">{selectedApplication.status}</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MailIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {selectedApplication.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BriefcaseIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">
                      {selectedApplication.jobTitle}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-300">
                      Applied: {new Date(selectedApplication.appliedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 dark:text-gray-300">
                      Match Score: {selectedApplication.matchingScore}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Launch Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleLaunchInterview}
                disabled={!selectedApplicationId || createInterviewMutation.isPending}
                className="w-full max-w-md"
                size="lg"
              >
                {createInterviewMutation.isPending ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating Interview Session...
                  </>
                ) : (
                  <>
                    <PlayIcon className="mr-2 h-4 w-4" />
                    Launch AI Interview
                  </>
                )}
              </Button>
            </div>

            {/* Status Messages */}
            {candidatesLoading && (
              <div className="text-center text-gray-500 dark:text-gray-400">
                Loading candidates...
              </div>
            )}
            
            {!candidatesLoading && candidateApplications?.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400">
                No candidate applications found. Please add candidates first.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
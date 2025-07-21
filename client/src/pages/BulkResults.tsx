import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle2, 
  Users, 
  FileCheck, 
  ArrowLeft,
  Plus,
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface BulkCandidate {
  id: number;
  fileName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  experience: number | null;
  matchingScore: number | null;
  skillsMatch: number | null;
  experienceMatch: number | null;
  analysis: string | null;
  isShortlisted: boolean;
  addedToMainList: boolean;
}

interface BulkJob {
  id: number;
  totalFiles: number;
  processedFiles: number;
  qualifiedCandidates: number;
  status: string;
  job: {
    id: number;
    title: string;
    department: string;
  };
}

export default function BulkResults() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);

  const { data: bulkJob, isLoading: loadingJob } = useQuery({
    queryKey: [`/api/bulk-jobs/${id}`],
    enabled: !!id,
  });

  const { data: candidates = [], isLoading: loadingCandidates } = useQuery({
    queryKey: [`/api/bulk-jobs/${id}/candidates`],
    enabled: !!id && bulkJob?.status === 'completed',
  });

  const shortlistMutation = useMutation({
    mutationFn: async (candidateIds: number[]) => {
      return apiRequest(`/api/bulk-jobs/${id}/shortlist`, {
        method: 'POST',
        body: { candidateIds },
      });
    },
    onSuccess: () => {
      toast({
        title: "Candidates Shortlisted",
        description: "Selected candidates have been shortlisted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/bulk-jobs/${id}/candidates`] });
      setSelectedCandidates([]);
    },
  });

  const addToMainListMutation = useMutation({
    mutationFn: async (candidateIds: number[]) => {
      return apiRequest(`/api/bulk-jobs/${id}/add-to-main-list`, {
        method: 'POST',
        body: { candidateIds },
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Candidates Added",
        description: `${data.addedCandidates.length} candidates added to main candidate list.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/bulk-jobs/${id}/candidates`] });
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      setSelectedCandidates([]);
    },
  });

  const handleSelectCandidate = (candidateId: number) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleSelectAll = () => {
    const unshortlistedCandidates = candidates
      .filter((c: BulkCandidate) => !c.isShortlisted && !c.addedToMainList)
      .map((c: BulkCandidate) => c.id);
    
    setSelectedCandidates(
      selectedCandidates.length === unshortlistedCandidates.length 
        ? [] 
        : unshortlistedCandidates
    );
  };

  const getScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number | null) => {
    if (!score) return 'secondary';
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (loadingJob) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!bulkJob) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-900">Bulk Job Not Found</h2>
          <p className="text-gray-600 mt-2">The bulk processing job you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/bulk-processing')} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Bulk Processing
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/bulk-processing')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Bulk Processing Results
            </h1>
            <p className="text-gray-600">
              {bulkJob.job?.title || 'Unknown Job'} • {bulkJob.job?.department || 'Unknown Department'}
            </p>
          </div>
        </div>
        
        {bulkJob.status === 'completed' && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={selectedCandidates.length === 0}
              onClick={() => shortlistMutation.mutate(selectedCandidates)}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Shortlist Selected ({selectedCandidates.length})
            </Button>
            <Button
              size="sm"
              disabled={selectedCandidates.length === 0}
              onClick={() => addToMainListMutation.mutate(selectedCandidates)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Main List ({selectedCandidates.length})
            </Button>
          </div>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Files</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bulkJob.totalFiles}</div>
            <p className="text-xs text-muted-foreground">Resumes uploaded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bulkJob.processedFiles}</div>
            <Progress 
              value={(bulkJob.processedFiles / bulkJob.totalFiles) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bulkJob.qualifiedCandidates}
            </div>
            <p className="text-xs text-muted-foreground">
              {bulkJob.processedFiles > 0 
                ? `${Math.round((bulkJob.qualifiedCandidates / bulkJob.processedFiles) * 100)}% qualification rate`
                : 'Processing...'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={bulkJob.status === 'completed' ? 'default' : 'secondary'}>
              {bulkJob.status}
            </Badge>
            {bulkJob.status === 'processing' && (
              <p className="text-xs text-muted-foreground mt-2">
                Please wait while we process the resumes...
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      {bulkJob.status === 'completed' && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Candidate Results</CardTitle>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectedCandidates.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm text-gray-600">Select All Unprocessed</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingCandidates ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No candidates found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {candidates.map((candidate: BulkCandidate) => (
                  <div 
                    key={candidate.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      candidate.addedToMainList 
                        ? 'bg-green-50 border-green-200' 
                        : candidate.isShortlisted 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {!candidate.isShortlisted && !candidate.addedToMainList && (
                          <Checkbox
                            checked={selectedCandidates.includes(candidate.id)}
                            onCheckedChange={() => handleSelectCandidate(candidate.id)}
                          />
                        )}
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-gray-900">
                              {candidate.firstName || 'Unknown'} {candidate.lastName || ''}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {candidate.fileName}
                            </Badge>
                            {candidate.isShortlisted && (
                              <Badge variant="secondary">Shortlisted</Badge>
                            )}
                            {candidate.addedToMainList && (
                              <Badge variant="default">Added to Main List</Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            {candidate.email && (
                              <span>{candidate.email}</span>
                            )}
                            {candidate.experience && (
                              <span>{candidate.experience} years experience</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className={`text-lg font-semibold ${getScoreColor(candidate.matchingScore)}`}>
                            {candidate.matchingScore || 0}%
                          </div>
                          <div className="text-xs text-gray-500">Overall Match</div>
                        </div>
                        
                        <div className="text-center">
                          <div className={`text-sm font-medium ${getScoreColor(candidate.skillsMatch)}`}>
                            {candidate.skillsMatch || 0}%
                          </div>
                          <div className="text-xs text-gray-500">Skills</div>
                        </div>
                        
                        <div className="text-center">
                          <div className={`text-sm font-medium ${getScoreColor(candidate.experienceMatch)}`}>
                            {candidate.experienceMatch || 0}%
                          </div>
                          <div className="text-xs text-gray-500">Experience</div>
                        </div>

                        <Badge variant={getScoreBadgeVariant(candidate.matchingScore)}>
                          {(candidate.matchingScore || 0) >= 70 ? 'Qualified' : 'Not Qualified'}
                        </Badge>
                      </div>
                    </div>

                    {candidate.analysis && (
                      <>
                        <Separator className="my-3" />
                        <div className="text-sm text-gray-600">
                          <strong>AI Analysis:</strong> {candidate.analysis}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
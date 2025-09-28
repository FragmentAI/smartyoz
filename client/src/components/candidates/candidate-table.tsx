import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Mail, Phone, FileText, MoreHorizontal, Calendar, RefreshCw, TrendingUp, Trash2, Archive, CheckCircle, Clock, Users, MessageCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import GenerateInterviewLink from "./generate-interview-link";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Candidate } from "@shared/schema";

interface CandidateWithApplication extends Candidate {
  application?: {
    id: number;
    jobTitle: string;
    status: string;
    overallScore?: number;
    matchingScore?: number;
    skillsMatch?: number;
    experienceMatch?: number;
    appliedAt: string;
  };
}

function MatchingScore({ candidate }: { candidate: CandidateWithApplication }) {
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const calculateMatchMutation = useMutation({
    mutationFn: async () => {
      if (!candidate.application?.id) throw new Error("No application found");
      console.log("🚀 FRONTEND: Starting match calculation for application:", candidate.application.id);
      console.log("🎯 FRONTEND: Candidate data:", {
        name: candidate.name,
        skills: candidate.skills,
        experience: candidate.experience,
        position: candidate.position
      });
      
      const response = await apiRequest("POST", `/api/applications/${candidate.application.id}/calculate-match`);
      const result = await response.json(); // Parse the JSON from the response
      console.log("📥 FRONTEND: Received match calculation result:", result);
      return result;
    },
    onSuccess: (data) => {
      console.log("✅ FRONTEND: Match calculation successful!", {
        matchingScore: data.matchingScore,
        skillsMatch: data.skillsMatch,
        experienceMatch: data.experienceMatch,
        analysis: data.analysis
      });
      
      toast({
        title: "Match Score Calculated",
        description: `Overall match: ${data.matchingScore}% (Skills: ${data.skillsMatch}%, Experience: ${data.experienceMatch}%)`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
    },
    onError: (error: any) => {
      console.error("❌ FRONTEND: Match calculation failed:", error);
      toast({
        title: "Calculation Failed",
        description: error.message || "Failed to calculate matching score",
        variant: "destructive",
      });
    },
    onSettled: () => {
      console.log("🏁 FRONTEND: Match calculation process completed");
      setIsCalculating(false);
    },
  });

  const handleCalculate = () => {
    console.log("🎯 FRONTEND: User clicked calculate match button");
    console.log("📊 FRONTEND: Current candidate application data:", {
      applicationId: candidate.application?.id,
      currentMatchingScore: candidate.application?.matchingScore,
      currentSkillsMatch: candidate.application?.skillsMatch,
      currentExperienceMatch: candidate.application?.experienceMatch
    });
    
    setIsCalculating(true);
    calculateMatchMutation.mutate();
  };

  if (!candidate.application) {
    return <span className="text-sm text-gray-400">No application</span>;
  }

  const { matchingScore, skillsMatch, experienceMatch } = candidate.application;

  if (matchingScore !== undefined && matchingScore !== null) {
    const score = parseFloat(matchingScore.toString());
    const skillsScore = skillsMatch ? parseFloat(skillsMatch.toString()) : 0;
    const experienceScore = experienceMatch ? parseFloat(experienceMatch.toString()) : 0;
    
    console.log("📊 FRONTEND: Displaying existing match scores:", {
      candidateName: candidate.name,
      applicationId: candidate.application?.id,
      overallScore: score,
      skillsScore,
      experienceScore,
      scoreColor: score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red'
    });
    
    const getScoreColor = (score: number) => {
      if (score >= 80) return "text-green-600 bg-green-50";
      if (score >= 60) return "text-yellow-600 bg-yellow-50";
      return "text-red-600 bg-red-50";
    };

    return (
      <div className="space-y-1">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(score)}`}>
          <TrendingUp className="w-3 h-3 mr-1" />
          {score.toFixed(0)}% Match
        </div>
        {skillsMatch !== undefined && experienceMatch !== undefined && (
          <div className="text-xs text-gray-500">
            Skills: {skillsScore.toFixed(0)}% | Exp: {experienceScore.toFixed(0)}%
          </div>
        )}
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCalculate}
      disabled={isCalculating}
      className="h-8 text-xs"
    >
      {isCalculating ? (
        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
      ) : (
        <TrendingUp className="w-3 h-3 mr-1" />
      )}
      {isCalculating ? "Calculating..." : "Calculate"}
    </Button>
  );
}

function CandidateStatus({ candidate }: { candidate: CandidateWithApplication }) {
  if (!candidate.application) {
    return (
      <Badge variant="outline" className="text-xs">
        <Users className="w-3 h-3 mr-1" />
        No Application
      </Badge>
    );
  }

  const status = candidate.application.status;
  
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'new':
        return {
          label: 'Profile Submitted',
          color: 'bg-blue-100 text-blue-800',
          icon: <Users className="w-3 h-3 mr-1" />
        };
      case 'screening':
        return {
          label: 'Under Review',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="w-3 h-3 mr-1" />
        };
      case 'qualified':
        return {
          label: 'Profile Screened',
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="w-3 h-3 mr-1" />
        };
      case 'interview_scheduled':
      case 'interviewed':
        return {
          label: 'Interview Scheduled',
          color: 'bg-purple-100 text-purple-800',
          icon: <Calendar className="w-3 h-3 mr-1" />
        };
      case 'interview_completed':
        return {
          label: 'Interview Completed',
          color: 'bg-indigo-100 text-indigo-800',
          icon: <MessageCircle className="w-3 h-3 mr-1" />
        };
      case 'offered':
        return {
          label: 'Offer Extended',
          color: 'bg-emerald-100 text-emerald-800',
          icon: <CheckCircle className="w-3 h-3 mr-1" />
        };
      case 'hired':
        return {
          label: 'Hired',
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="w-3 h-3 mr-1" />
        };
      case 'rejected':
        return {
          label: 'Not Selected',
          color: 'bg-red-100 text-red-800',
          icon: <Users className="w-3 h-3 mr-1" />
        };
      case 'applied':
        return {
          label: 'Applied',
          color: 'bg-blue-100 text-blue-800',
          icon: <Users className="w-3 h-3 mr-1" />
        };
      default:
        return {
          label: 'Unknown Status',
          color: 'bg-gray-100 text-gray-800',
          icon: <Users className="w-3 h-3 mr-1" />
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <Badge className={`${statusInfo.color} text-xs font-medium`}>
      {statusInfo.icon}
      {statusInfo.label}
    </Badge>
  );
}

interface CandidateTableProps {
  candidates: CandidateWithApplication[];
  isLoading: boolean;
  onViewCandidate: (candidate: Candidate) => void;
  onEmailCandidate: (candidate: Candidate) => void;
  onScheduleInterview: (candidate: Candidate) => void;
  onDelete: (candidate: Candidate) => void;
  onArchive: (candidate: Candidate) => void;
}

export default function CandidateTable({ 
  candidates, 
  isLoading, 
  onViewCandidate, 
  onEmailCandidate, 
  onScheduleInterview,
  onDelete,
  onArchive
}: CandidateTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Candidate List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (candidates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Candidate List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No candidates found</p>
            <p className="text-gray-400 text-sm mt-1">Add candidates to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Candidate List</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0">
        <div className="h-full overflow-auto px-6 pb-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
            <thead className="bg-muted sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[250px]">
                  Candidate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[80px]">
                  Experience
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[180px]">
                  Skills
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[120px]">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[100px]">
                  Match Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[100px]">
                  Location
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[90px]">
                  Added
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider min-w-[140px]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-background divide-y divide-border">
              {candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-sm font-medium text-muted-foreground">
                            {candidate.firstName.charAt(0)}{candidate.lastName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-foreground">
                          {candidate.firstName} {candidate.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">{candidate.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {candidate.experience ? `${candidate.experience} years` : 'Not specified'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills?.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      )) || <span className="text-sm text-muted-foreground">No skills listed</span>}
                      {candidate.skills && candidate.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{candidate.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <CandidateStatus candidate={candidate} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <MatchingScore candidate={candidate} />
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {candidate.location || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onViewCandidate(candidate)}
                        className="h-8 px-2"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEmailCandidate(candidate)}>
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onScheduleInterview(candidate)}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Schedule Interview
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onArchive(candidate)}>
                            <Archive className="w-4 h-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {candidate.firstName} {candidate.lastName}? 
                                  This action cannot be undone and will remove all associated applications and interview data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => onDelete(candidate)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

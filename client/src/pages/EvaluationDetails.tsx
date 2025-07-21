import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Clock, User, Video } from "lucide-react";
import { useLocation } from "wouter";

export default function EvaluationDetails() {
  const [, params] = useRoute("/evaluation/:id");
  const [, setLocation] = useLocation();
  const evaluationId = params?.id;

  const { data: evaluation, isLoading, error } = useQuery({
    queryKey: ['/api/evaluations', evaluationId],
    queryFn: async () => {
      const response = await fetch(`/api/evaluations/${evaluationId}`);
      if (!response.ok) {
        throw new Error('Evaluation not found');
      }
      return response.json();
    },
    enabled: !!evaluationId
  });

  const getRecommendationBadge = (recommendation: string) => {
    const normalizedRec = recommendation.toLowerCase();
    
    if (normalizedRec.includes('hire')) {
      return <Badge className="bg-green-100 text-green-800">Hire</Badge>;
    } else if (normalizedRec.includes('maybe') || normalizedRec.includes('consider')) {
      return <Badge className="bg-yellow-100 text-yellow-800">Maybe</Badge>;
    } else if (normalizedRec.includes('reject') || normalizedRec.includes('no')) {
      return <Badge className="bg-red-100 text-red-800">Reject</Badge>;
    } else {
      return <Badge variant="outline">{recommendation}</Badge>;
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return "text-gray-600";
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Evaluation Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">The evaluation you're looking for doesn't exist or has been removed.</p>
              <Button 
                onClick={() => setLocation('/results')} 
                className="mt-4"
                variant="outline"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setLocation('/results')} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Interview Evaluation</h1>
        </div>

        {/* Candidate Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Candidate Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg">
                  {evaluation.interview.application.candidate.firstName} {evaluation.interview.application.candidate.lastName}
                </h3>
                <p className="text-gray-600">{evaluation.interview.application.candidate.email}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Applied for: <span className="font-medium">{evaluation.interview.application.job.title}</span>
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  Interview Date: {new Date(evaluation.interview.scheduledAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  Duration: {evaluation.interview.duration} minutes
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Video className="h-4 w-4" />
                  Type: AI Video Interview
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluation Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(evaluation.overallScore)}`}>
                  {evaluation.overallScore || 0}
                </div>
                <p className="text-sm text-gray-600 mt-1">Overall Score</p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(evaluation.technicalScore)}`}>
                  {evaluation.technicalScore || '-'}
                </div>
                <p className="text-sm text-gray-600 mt-1">Technical Skills</p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(evaluation.communicationScore)}`}>
                  {evaluation.communicationScore || '-'}
                </div>
                <p className="text-sm text-gray-600 mt-1">Communication</p>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(evaluation.culturalFitScore)}`}>
                  {evaluation.culturalFitScore || '-'}
                </div>
                <p className="text-sm text-gray-600 mt-1">Cultural Fit</p>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Recommendation:</span>
                {getRecommendationBadge(evaluation.recommendation)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>AI Evaluation Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {evaluation.feedback}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Interview Responses */}
        {evaluation.interview.responses && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Interview Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {JSON.parse(evaluation.interview.responses).map((response: any, index: number) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-gray-900">Question {index + 1}</h4>
                      <p className="text-sm text-gray-600 mt-1">{response.question}</p>
                    </div>
                    <div className="bg-gray-50 rounded p-3">
                      <p className="text-sm text-gray-700">
                        <strong>Response:</strong> {response.answer}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Duration: {Math.round(response.duration || 0)}s
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
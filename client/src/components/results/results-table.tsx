import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EvaluationWithDetails } from "@/types";
import { Play, Video, ChevronRight, ChevronDown } from "lucide-react";
import { useState } from "react";
import React from "react";

interface ResultsTableProps {
  evaluations: EvaluationWithDetails[];
  isLoading: boolean;
}

export default function ResultsTable({ evaluations, isLoading }: ResultsTableProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);

  const toggleRowExpansion = (evaluationId: number) => {
    setExpandedRows(prev => 
      prev.includes(evaluationId) 
        ? prev.filter(id => id !== evaluationId)
        : [...prev, evaluationId]
    );
  };
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Results</CardTitle>
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

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No evaluation results found</p>
            <p className="text-gray-400 text-sm mt-1">Evaluations will appear here after interviews are completed</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case "hire":
        return <Badge className="bg-green-100 text-green-800">Hire</Badge>;
      case "maybe":
        return <Badge className="bg-yellow-100 text-yellow-800">Maybe</Badge>;
      case "reject":
        return <Badge className="bg-red-100 text-red-800">Reject</Badge>;
      default:
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

  const getScoreBarColor = (score: number | undefined) => {
    if (!score) return "bg-gray-200";
    if (score >= 90) return "bg-green-600";
    if (score >= 80) return "bg-green-600";
    if (score >= 70) return "bg-yellow-600";
    return "bg-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluation Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overall Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technical
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Communication
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cultural Fit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recommendation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {evaluations.map((evaluation) => (
                <>
                  <tr key={evaluation.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {evaluation.interview.application.candidate.firstName.charAt(0)}
                              {evaluation.interview.application.candidate.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {evaluation.interview.application.candidate.firstName} {evaluation.interview.application.candidate.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {evaluation.interview.application.candidate.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {evaluation.interview.application.job.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`text-lg font-bold ${getScoreColor(evaluation.overallScore)}`}>
                          {evaluation.overallScore || 0}
                        </div>
                        <div className="ml-2 w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${getScoreBarColor(evaluation.overallScore)} h-2 rounded-full`}
                            style={{ width: `${evaluation.overallScore || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {evaluation.technicalScore || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {evaluation.communicationScore || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {evaluation.culturalFitScore || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRecommendationBadge(evaluation.recommendation)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleRowExpansion(evaluation.id)}
                        >
                          {expandedRows.includes(evaluation.id) ? (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4 mr-1" />
                              Details
                            </>
                          )}
                        </Button>
                        {evaluation.recommendation === 'hire' && (
                          <Button variant="ghost" size="sm" className="text-green-600">
                            Offer
                          </Button>
                        )}
                        {evaluation.recommendation === 'maybe' && (
                          <Button variant="ghost" size="sm" className="text-yellow-600">
                            Re-interview
                          </Button>
                        )}
                        {evaluation.recommendation === 'reject' && (
                          <Button variant="ghost" size="sm" className="text-red-600">
                            Reject
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedRows.includes(evaluation.id) && (
                    <tr key={`${evaluation.id}-details`}>
                      <td colSpan={8} className="px-6 py-4 bg-gray-50">
                        <div className="space-y-4">
                          {/* Feedback Section */}
                          <div>
                            <h4 className="font-medium mb-2">Feedback</h4>
                            <p className="text-sm text-gray-700">{evaluation.feedback}</p>
                          </div>
                          
                          {/* Skills Assessment */}
                          <div>
                            <h4 className="font-medium mb-2">Skills Assessment</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {evaluation.interview.application.candidate.skills?.map((skill: string, index: number) => (
                                <div key={index} className="flex justify-between items-center">
                                  <span className="text-sm">{skill}</span>
                                  <Badge variant="outline">Assessed</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Video Interview Recordings */}
                          {evaluation.interview.type === 'ai_video' && evaluation.interview.responses && (
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Interview Recordings
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {JSON.parse(evaluation.interview.responses).map((response: any, index: number) => (
                                  <div key={index} className="bg-white p-4 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="text-sm font-medium">Question {index + 1}</p>
                                        <p className="text-xs text-gray-500 mb-2">
                                          Duration: {Math.floor(response.duration / 60)}:{(response.duration % 60).toString().padStart(2, '0')}
                                        </p>
                                        <p className="text-xs text-gray-600">{response.answer?.substring(0, 80)}...</p>
                                      </div>
                                      {response.videoUrl ? (
                                        <Button size="sm" variant="outline" asChild>
                                          <a href={response.videoUrl} target="_blank" rel="noopener noreferrer">
                                            <Play className="w-4 h-4 mr-1" />
                                            Watch
                                          </a>
                                        </Button>
                                      ) : (
                                        <span className="text-xs text-gray-400">Video not available</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

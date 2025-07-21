import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import ResultsTable from "@/components/results/results-table-simple";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, BarChart3 } from "lucide-react";
import { Job } from "@shared/schema";
import { EvaluationWithDetails } from "@/types";

export default function Results() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [filters, setFilters] = useState({
    jobId: "all",
    stage: "all",
    scoreRange: "all",
    dateRange: "last-30-days",
    recommendation: "all",
  });

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

  const { data: evaluations = [], isLoading: evaluationsLoading } = useQuery<EvaluationWithDetails[]>({
    queryKey: ["/api/evaluations", filters],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate summary metrics with normalized recommendation values
  const hireRecommended = evaluations.filter(e => e.recommendation.toLowerCase().includes('hire')).length;
  const maybeRecommended = evaluations.filter(e => 
    e.recommendation.toLowerCase().includes('maybe') || 
    e.recommendation.toLowerCase().includes('consider')
  ).length;
  const rejected = evaluations.filter(e => 
    e.recommendation.toLowerCase().includes('reject') || 
    e.recommendation.toLowerCase().includes('no')
  ).length;
  const avgScore = evaluations.length > 0 
    ? (evaluations.reduce((sum, e) => sum + (e.overallScore || 0), 0) / evaluations.length).toFixed(1)
    : 0;

  const summaryCards = [
    {
      title: "Hire Recommended",
      value: hireRecommended,
      icon: CheckCircle,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Maybe",
      value: maybeRecommended,
      icon: AlertTriangle,
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
    },
    {
      title: "Rejected",
      value: rejected,
      icon: XCircle,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Avg Score",
      value: avgScore,
      icon: BarChart3,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  ];

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-8">
          <div className="mb-8">
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Position</label>
                  <Select 
                    value={filters.jobId} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, jobId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Positions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Positions</SelectItem>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recommendation</label>
                  <Select 
                    value={filters.recommendation} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, recommendation: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Recommendations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Recommendations</SelectItem>
                      <SelectItem value="hire">Hire</SelectItem>
                      <SelectItem value="maybe">Maybe</SelectItem>
                      <SelectItem value="reject">Reject</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Score Range</label>
                  <Select 
                    value={filters.scoreRange} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, scoreRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Scores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Scores</SelectItem>
                      <SelectItem value="90-100">Excellent (90-100)</SelectItem>
                      <SelectItem value="80-89">Good (80-89)</SelectItem>
                      <SelectItem value="70-79">Average (70-79)</SelectItem>
                      <SelectItem value="60-69">Below Average (60-69)</SelectItem>
                      <SelectItem value="0-59">Poor (&lt; 60)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <Select 
                    value={filters.dateRange} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-7-days">Last 7 days</SelectItem>
                      <SelectItem value="last-30-days">Last 30 days</SelectItem>
                      <SelectItem value="last-3-months">Last 3 months</SelectItem>
                      <SelectItem value="all-time">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button className="w-full">Apply Filters</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <ResultsTable 
            evaluations={evaluations} 
            isLoading={evaluationsLoading} 
          />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
            {summaryCards.map((card, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 ${card.bgColor} rounded-full flex items-center justify-center`}>
                        <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-500">{card.title}</div>
                      <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

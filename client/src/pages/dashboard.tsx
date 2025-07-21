import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  UserCheck, 
  UserX, 
  Target,
  Briefcase,
  Activity,
  CheckCircle,
  UserPlus,
  TrendingDown
} from "lucide-react";
import { DashboardMetrics } from "@/types";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: metrics } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
    enabled: isAuthenticated,
  });

  const { data: jobs } = useQuery({
    queryKey: ["/api/jobs"],
    enabled: isAuthenticated,
  });

  const { data: activities } = useQuery({
    queryKey: ["/api/dashboard/activities"],
    enabled: isAuthenticated,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
      </div>
    );
  }

  const kpiData = [
    {
      title: "Active Job Postings",
      value: (jobs?.length || 0).toString(),
      icon: Briefcase,
      bgColor: "bg-cyan-500",
    },
    {
      title: "Total Candidates",
      value: (metrics?.totalApplications || 0).toString(),
      icon: Users,
      bgColor: "bg-blue-500",
    },
    {
      title: "Interviews Scheduled (Today)",
      value: (metrics?.interviewsScheduled || 0).toString(),
      icon: Calendar,
      bgColor: "bg-emerald-500",
    },
    {
      title: "Hiring Pipeline Health",
      value: (metrics?.totalApplications || 0) > 0 ? "85/100" : "0/100",
      icon: TrendingUp,
      bgColor: "bg-green-500",
    },
    {
      title: "Processed Candidates",
      value: `${metrics?.qualifiedCandidates || 0} / ${metrics?.totalApplications || 0}`,
      icon: UserCheck,
      bgColor: "bg-pink-500",
    },
    {
      title: "Avg. Time to Hire",
      value: `${metrics?.avgTimeToHire || 0} days`,
      icon: Clock,
      bgColor: "bg-orange-500",
    },
    {
      title: "Interview No-Show Rate",
      value: (metrics?.totalApplications || 0) > 0 ? "4%" : "0%",
      icon: UserX,
      bgColor: "bg-red-500",
    },
    {
      title: "Qualified to Hired Ratio",
      value: `${metrics?.qualifiedCandidates || 0}%`,
      icon: Target,
      bgColor: "bg-green-500",
    },
  ];

  const funnelData = [
    { stage: "Sourced", count: metrics?.totalApplications || 0, color: "bg-cyan-400" },
    { stage: "Screened", count: Math.floor((metrics?.totalApplications || 0) * 0.7), color: "bg-cyan-400" },
    { stage: "Assessment", count: Math.floor((metrics?.totalApplications || 0) * 0.3), color: "bg-cyan-400" },
    { stage: "Interview", count: metrics?.interviewsScheduled || 0, color: "bg-cyan-400" },
    { stage: "Offer", count: Math.floor((metrics?.qualifiedCandidates || 0) * 0.5), color: "bg-cyan-400" },
    { stage: "Hired", count: Math.floor((metrics?.qualifiedCandidates || 0) * 0.3), color: "bg-cyan-400" },
  ];

  const recentActivities = activities || [];

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-48'}`}>
        <Header />
        <main className="flex-1 overflow-y-auto bg-white">
          <div className="p-8">
            {/* Dashboard Content Header */}
            <div className="mb-8"></div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpiData.map((kpi, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-10 h-10 ${kpi.bgColor} rounded-lg flex items-center justify-center mr-4`}>
                        <kpi.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-slate-400 text-sm">{kpi.title}</p>
                        <p className="text-white text-2xl font-bold">{kpi.value}</p>
                      </div>
                    </div>
                    {/* Removed delta change display */}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Candidate Funnel */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Candidate Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelData.map((stage, index) => (
                    <div key={stage.stage} className="flex items-center">
                      <div className="w-20 text-slate-400 text-sm">{stage.stage}</div>
                      <div className="flex-1 ml-4">
                        <div className="bg-slate-700 rounded-full h-6 relative">
                          <div 
                            className={`${stage.color} h-6 rounded-full flex items-center justify-end pr-2`}
                            style={{ width: `${(stage.count / 600) * 100}%` }}
                          >
                            <span className="text-white text-xs font-medium">{stage.count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center">
                  <div className="w-3 h-3 bg-cyan-400 rounded mr-2"></div>
                  <span className="text-slate-400 text-sm">Candidates</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                  <div className="p-6 space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-slate-700/50">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            activity.status === 'positive' ? 'bg-green-400' :
                            activity.status === 'negative' ? 'bg-red-400' : 'bg-blue-400'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium">{activity.message}</p>
                            <p className="text-slate-400 text-sm">{activity.candidate} • {activity.position}</p>
                            <p className="text-slate-500 text-xs mt-1">{activity.time}</p>
                          </div>
                          {activity.status === 'positive' && (
                            <CheckCircle className="w-4 h-4 text-green-400 mt-1" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-400 text-sm">No recent activities</p>
                        <p className="text-slate-500 text-xs mt-1">Activities will appear here as candidates progress through the hiring pipeline</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
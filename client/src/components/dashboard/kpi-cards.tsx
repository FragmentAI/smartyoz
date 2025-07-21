import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calendar, CheckCircle, Clock } from "lucide-react";
import { DashboardMetrics } from "@/types";

export default function KPICards() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  const cards = [
    {
      title: "Total Applications",
      value: metrics?.totalApplications || 0,
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Interviews Scheduled",
      value: metrics?.interviewsScheduled || 0,
      icon: Calendar,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Qualified Candidates",
      value: metrics?.qualifiedCandidates || 0,
      icon: CheckCircle,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Avg. Time to Hire",
      value: `${metrics?.avgTimeToHire || 0} days`,
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            {/* Removed delta change display */}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

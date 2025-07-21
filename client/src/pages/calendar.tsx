import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import CalendarGrid from "@/components/calendar/calendar-grid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InterviewWithDetails } from "@/types";

export default function Calendar() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
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

  // Get start and end of current month for filtering
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const { data: interviews = [] } = useQuery<InterviewWithDetails[]>({
    queryKey: ["/api/interviews", { 
      startDate: monthStart.toISOString(), 
      endDate: monthEnd.toISOString() 
    }],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const upcomingInterviews = interviews
    .filter(interview => new Date(interview.scheduledAt) >= new Date())
    .slice(0, 5);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">Today</Button>
              <Button>Schedule Interview</Button>
            </div>
          </div>

          <CalendarGrid 
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            interviews={interviews}
          />

          {/* Upcoming Events */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingInterviews.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming interviews</p>
              ) : (
                <div className="space-y-4">
                  {upcomingInterviews.map((interview) => (
                    <div key={interview.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {interview.type} Interview - {interview.application.candidate.firstName} {interview.application.candidate.lastName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(interview.scheduledAt).toLocaleDateString()} at{' '}
                          {new Date(interview.scheduledAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })} • {interview.application.job.title}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

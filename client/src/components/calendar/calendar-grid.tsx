import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, MapPin, User, Mail, Video } from "lucide-react";
import { InterviewWithDetails } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface CalendarGridProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  interviews: InterviewWithDetails[];
}

export default function CalendarGrid({ currentDate, onDateChange, interviews }: CalendarGridProps) {
  const [viewMode, setViewMode] = useState<"Month" | "Week" | "Day">("Month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetails, setShowDayDetails] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Send interview invitations mutation
  const sendInvitationsMutation = useMutation({
    mutationFn: async (interviewId: number) => {
      const response = await fetch(`/api/interviews/${interviewId}/send-invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to send invitations');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meeting invitations sent to both interviewer and candidate"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/interviews'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send invitations",
        variant: "destructive"
      });
    }
  });

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const goToPrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const getInterviewsForDate = (date: Date) => {
    return interviews.filter(interview => {
      const interviewDate = new Date(interview.scheduledAt);
      return (
        interviewDate.getDate() === date.getDate() &&
        interviewDate.getMonth() === date.getMonth() &&
        interviewDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = 
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
      
      const dayInterviews = getInterviewsForDate(date);

      const handleDateClick = () => {
        if (dayInterviews.length > 0) {
          setSelectedDate(date);
          setShowDayDetails(true);
        }
      };

      days.push(
        <div
          key={i}
          onClick={handleDateClick}
          className={`h-24 p-2 border border-gray-100 rounded-lg ${
            isToday ? "bg-blue-50" : "hover:bg-gray-50"
          } ${dayInterviews.length > 0 ? "cursor-pointer hover:shadow-md" : "cursor-default"} transition-all`}
        >
          <div className={`text-sm ${
            isCurrentMonth ? 
              isToday ? "text-blue-800 font-medium" : "text-gray-900"
              : "text-gray-400"
          }`}>
            {date.getDate()}
            {isToday && <div className="text-xs text-blue-600">Today</div>}
          </div>
          
          <div className="mt-1 space-y-1">
            {dayInterviews.slice(0, 2).map((interview, idx) => {
              const colors = [
                "bg-blue-100 text-blue-800",
                "bg-green-100 text-green-800",
                "bg-purple-100 text-purple-800",
                "bg-amber-100 text-amber-800"
              ];
              
              return (
                <div
                  key={idx}
                  className={`text-xs px-1 py-0.5 rounded truncate ${colors[idx % colors.length]}`}
                  title={`${interview.type} - ${interview.candidateName}`}
                >
                  {interview.type === "technical" ? "Interview" : interview.type} - {interview.candidateName.split(' ').map(n => n.charAt(0)).join('')}
                </div>
              );
            })}
            
            {dayInterviews.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayInterviews.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <Card>
      {/* Calendar Header */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={goToPrevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <CardTitle className="text-xl font-semibold text-gray-900">
              {months[currentDate.getMonth()]} {currentDate.getFullYear()}
            </CardTitle>
            <button 
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <div className="flex items-center space-x-2">
            {["Month", "Week", "Day"].map((mode) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode(mode as "Month" | "Week" | "Day")}
                className="text-sm"
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarDays()}
        </div>
      </CardContent>

      {/* Day Details Dialog */}
      <Dialog open={showDayDetails} onOpenChange={setShowDayDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Interviews for {selectedDate?.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDate && getInterviewsForDate(selectedDate).map((interview) => (
              <div key={interview.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-lg">{interview.candidateName}</h4>
                    <p className="text-gray-600">{interview.jobTitle}</p>
                  </div>
                  <Badge variant={
                    interview.status === 'scheduled' ? 'default' :
                    interview.status === 'completed' ? 'secondary' :
                    interview.status === 'pending' ? 'outline' :
                    'destructive'
                  }>
                    {interview.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>
                      {new Date(interview.scheduledAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>{interview.format}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{interview.type}</span>
                  </div>
                </div>
                
                <div className="pt-3 flex items-center gap-3">
                  {interview.meetingUrl && (
                    <a 
                      href={interview.meetingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm underline"
                    >
                      <Video className="h-4 w-4" />
                      Join Meeting
                    </a>
                  )}
                  
                  {interview.status === 'scheduled' && (
                    <Button
                      onClick={() => sendInvitationsMutation.mutate(interview.id)}
                      disabled={sendInvitationsMutation.isPending}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      {sendInvitationsMutation.isPending ? 'Sending...' : 'Send Invitations'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

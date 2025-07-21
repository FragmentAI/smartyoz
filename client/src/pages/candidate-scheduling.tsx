import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Video, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CandidateApplication {
  id: number;
  job: {
    title: string;
    department: string;
    description: string;
  };
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  overallScore?: number;
}

interface TimeSlot {
  datetime: string;
  available: boolean;
}

export default function CandidateScheduling() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  
  // Extract token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const { data: application, isLoading } = useQuery({
    queryKey: ['/api/candidate/application', token],
    enabled: !!token,
  });

  const { data: availableSlots } = useQuery({
    queryKey: ['/api/candidate/slots', token],
    enabled: !!token,
  });

  const scheduleMutation = useMutation({
    mutationFn: async (slotDateTime: string) => {
      return await apiRequest('/api/candidate/schedule', {
        method: 'POST',
        body: JSON.stringify({
          token,
          scheduledAt: slotDateTime,
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Interview Scheduled!",
        description: "You'll receive a confirmation email with the meeting details shortly.",
      });
      setLocation('/candidate/interview-confirmed');
    },
    onError: (error) => {
      toast({
        title: "Scheduling Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Invalid Link</h2>
            <p className="text-gray-600 dark:text-gray-400">
              This scheduling link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading your interview details...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const app = application as CandidateApplication;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Briefcase className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-2xl">Schedule Your Interview</CardTitle>
                <p className="text-gray-600 dark:text-gray-400">
                  Hi {app.candidate.firstName}, please select a time slot for your interview
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{app.job.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {app.job.department}
              </p>
              <p className="text-sm">{app.job.description}</p>
              {app.overallScore && (
                <div className="mt-3">
                  <Badge variant="secondary">
                    Application Score: {app.overallScore}%
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interview Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>AI Video Interview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Duration: 30 minutes</span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium mb-2">What to expect:</h4>
                <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                  <li>• AI-powered interview based on your resume and the job requirements</li>
                  <li>• Questions about your experience, projects, and technical skills</li>
                  <li>• Professional AI avatar will conduct the interview</li>
                  <li>• Your responses will be recorded and analyzed</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time Slot Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Available Time Slots</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableSlots?.map((slot: TimeSlot) => (
                <Button
                  key={slot.datetime}
                  variant={selectedSlot === slot.datetime ? "default" : "outline"}
                  className="h-auto p-4 text-left"
                  disabled={!slot.available || scheduleMutation.isPending}
                  onClick={() => setSelectedSlot(slot.datetime)}
                >
                  <div>
                    <div className="font-medium">
                      {new Date(slot.datetime).toLocaleDateString()}
                    </div>
                    <div className="text-sm opacity-75">
                      {new Date(slot.datetime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            {selectedSlot && (
              <div className="mt-6">
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Selected Time:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(selectedSlot).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => scheduleMutation.mutate(selectedSlot)}
                        disabled={scheduleMutation.isPending}
                      >
                        {scheduleMutation.isPending ? "Scheduling..." : "Confirm Interview"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Important Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>• Please ensure you have a stable internet connection</p>
              <p>• Test your camera and microphone before the interview</p>
              <p>• Join from a quiet, well-lit environment</p>
              <p>• Have your resume and any relevant documents ready</p>
              <p>• You'll receive a meeting link via email after scheduling</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
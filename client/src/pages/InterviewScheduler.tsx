import { useState } from 'react';
import { useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle, AlertCircle, Video, User, Building } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function InterviewScheduler() {
  const [, params] = useRoute('/interview/schedule/:token');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const { toast } = useToast();
  
  const token = params?.token;

  // Verify interview token and get candidate info
  const { data: tokenData, isLoading, error } = useQuery({
    queryKey: [`/api/interview-tokens/verify/${token}`],
    enabled: !!token,
  });

  // Schedule interview mutation
  const scheduleInterviewMutation = useMutation({
    mutationFn: async (scheduleData: { token: string; scheduledDate: string; scheduledTime: string }) => {
      const scheduledAt = `${scheduleData.scheduledDate}T${scheduleData.scheduledTime}:00`;
      return apiRequest('POST', '/api/candidate/schedule', {
        token: scheduleData.token,
        scheduledAt: scheduledAt
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Interview Scheduled!",
        description: "You will receive a confirmation email with the meeting link shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/interview-tokens/verify'] });
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule interview. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleScheduleInterview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time for your interview.",
        variant: "destructive",
      });
      return;
    }

    if (token) {
      scheduleInterviewMutation.mutate({
        token,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime
      });
    }
  };

  // Generate available dates (next 7 days)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      });
    }
    
    return dates;
  };

  // Generate available times (24/7 for AI interviews)
  const getAvailableTimes = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute of [0, 30]) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        times.push({
          value: timeString,
          label: displayTime
        });
      }
    }
    return times;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Clock className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Loading Interview Scheduler</h2>
            <p className="text-gray-600">Please wait while we prepare your scheduling options...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-600">Invalid Interview Link</h2>
            <p className="text-gray-600 mb-4">
              This interview scheduling link is invalid or has expired.
            </p>
            <p className="text-sm text-gray-500">
              Please contact HR for assistance or request a new interview link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (scheduleInterviewMutation.isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4 text-green-600">Interview Scheduled!</h2>
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Calendar className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Date</p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedDate).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-sm text-gray-600">
                    {new Date(`2000-01-01T${selectedTime}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Video className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Interview Type</p>
                  <p className="text-sm text-gray-600">AI-Powered Video Interview</p>
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong> You will receive a confirmation email with your interview link within the next few minutes. 
                The AI interview will be available 15 minutes before your scheduled time.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableDates = getAvailableDates();
  const availableTimes = getAvailableTimes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Video className="w-8 h-8 text-blue-500" />
              <CardTitle className="text-2xl">Schedule Your AI Interview</CardTitle>
            </div>
            <CardDescription className="text-lg">
              Choose your preferred date and time for the AI-powered video interview
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Candidate & Job Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">{tokenData?.candidate?.firstName} {tokenData?.candidate?.lastName}</p>
                  <p className="text-sm text-gray-600">{tokenData?.candidate?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">{tokenData?.job?.title}</p>
                  <p className="text-sm text-gray-600">{tokenData?.job?.department} Department</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Scheduling Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Select Your Interview Slot
            </CardTitle>
            <CardDescription>
              AI interviews are available 24/7 for your convenience. Choose any time within the next 7 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleScheduleInterview} className="space-y-6">
              {/* Date Selection */}
              <div className="space-y-3">
                <Label htmlFor="date" className="text-base font-medium">Select Date</Label>
                <div className="grid gap-2">
                  {availableDates.map((date) => (
                    <label
                      key={date.value}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedDate === date.value
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="date"
                        value={date.value}
                        checked={selectedDate === date.value}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="sr-only"
                      />
                      <Calendar className="w-5 h-5 text-gray-500 mr-3" />
                      <span className="font-medium">{date.label}</span>
                      {selectedDate === date.value && (
                        <Badge className="ml-auto">Selected</Badge>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div className="space-y-3">
                <Label htmlFor="time" className="text-base font-medium">Select Time</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-2 border rounded-lg">
                  {availableTimes.map((time) => (
                    <label
                      key={time.value}
                      className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all text-sm ${
                        selectedTime === time.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="time"
                        value={time.value}
                        checked={selectedTime === time.value}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="sr-only"
                      />
                      {time.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-3 text-lg"
                disabled={!selectedDate || !selectedTime || scheduleInterviewMutation.isPending}
              >
                {scheduleInterviewMutation.isPending ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Scheduling Interview...
                  </>
                ) : (
                  <>
                    <Video className="w-5 h-5 mr-2" />
                    Schedule AI Interview
                  </>
                )}
              </Button>

              {/* Info Note */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">About Your AI Interview:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Duration: Approximately 30 minutes</li>
                  <li>• Format: AI-powered video interview with real-time questions</li>
                  <li>• Requirements: Webcam and microphone access</li>
                  <li>• Available 24/7 for your convenience</li>
                  <li>• You'll receive an email confirmation with the interview link</li>
                </ul>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
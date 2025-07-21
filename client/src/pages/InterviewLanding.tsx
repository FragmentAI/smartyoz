import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { VideoIcon, MicIcon, CheckCircleIcon, ClockIcon, UserIcon, BriefcaseIcon } from 'lucide-react';

interface InterviewSession {
  id: number;
  token: string;
  candidateName: string;
  jobTitle: string;
  jobDepartment: string;
  status: string;
  currentQuestion: number;
  totalQuestions: number;
  startedAt: string | null;
  questions: string[];
  responses: any[];
}

export default function InterviewLanding() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const [isReady, setIsReady] = useState(false);
  const [mediaPermissions, setMediaPermissions] = useState({
    camera: false,
    microphone: false
  });

  const { data: session, isLoading, error } = useQuery<InterviewSession>({
    queryKey: ['/api/candidate/interview', token],
    queryFn: async () => {
      const response = await fetch(`/api/candidate/interview/${token}`);
      if (!response.ok) {
        throw new Error('Interview session not found');
      }
      return response.json();
    },
    enabled: !!token
  });

  useEffect(() => {
    checkMediaPermissions();
  }, []);

  const checkMediaPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaPermissions({ camera: true, microphone: true });
      setIsReady(true);
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Media permission error:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setMediaPermissions({ camera: true, microphone: true });
      setIsReady(true);
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Permission denied:', error);
      alert('Camera and microphone access is required for the interview. Please allow permissions and try again.');
    }
  };

  const startInterview = () => {
    if (isReady && mediaPermissions.camera && mediaPermissions.microphone) {
      setLocation(`/interview/${token}/session`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Interview Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">This interview link is invalid or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const interviewStatus = session.status === 'completed' ? 'Completed' : 
                         session.startedAt ? 'In Progress' : 'Ready to Start';
  
  const progressPercentage = (session.currentQuestion / session.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <VideoIcon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Smartyoz AI Interview</h1>
                <p className="text-sm text-gray-600">Professional Video Interview Platform</p>
              </div>
            </div>
            <Badge variant={session.status === 'completed' ? 'secondary' : 'default'}>
              {interviewStatus}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Interview Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center space-x-3">
                  <UserIcon className="h-6 w-6" />
                  <span>Welcome, {session.candidateName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Position Details */}
                  <div className="flex items-center space-x-3">
                    <BriefcaseIcon className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{session.jobTitle}</h3>
                      <p className="text-sm text-gray-600">{session.jobDepartment}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Interview Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Interview Progress</span>
                      <span className="text-sm text-gray-600">
                        {session.currentQuestion} of {session.totalQuestions} questions
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <Separator />

                  {/* System Requirements */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">System Check</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${mediaPermissions.camera ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <VideoIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Camera Access</span>
                        {mediaPermissions.camera && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${mediaPermissions.microphone ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <MicIcon className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-700">Microphone Access</span>
                        {mediaPermissions.microphone && <CheckCircleIcon className="h-4 w-4 text-green-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {!isReady && (
                      <Button 
                        onClick={requestPermissions}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="lg"
                      >
                        Grant Camera & Microphone Access
                      </Button>
                    )}
                    
                    {isReady && session.status !== 'completed' && (
                      <Button 
                        onClick={startInterview}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        {session.startedAt ? 'Continue Interview' : 'Start Interview'}
                      </Button>
                    )}

                    {session.status === 'completed' && (
                      <div className="text-center p-6 bg-green-50 rounded-lg">
                        <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-green-800">Interview Completed</h3>
                        <p className="text-sm text-green-600">Thank you for completing the interview!</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Information */}
          <div className="space-y-6">
            {/* Interview Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Interview Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <ClockIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-gray-600">Approximately 30 minutes</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <VideoIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">AI Interviewer</p>
                    <p className="text-gray-600">You'll be interviewed by our AI assistant with real-time responses</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MicIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">Voice Recognition</p>
                    <p className="text-gray-600">Speak clearly and naturally. Subtitles will be provided</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Technical Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• Stable internet connection</p>
                <p>• Modern web browser (Chrome, Safari, Firefox)</p>
                <p>• Working camera and microphone</p>
                <p>• Quiet environment recommended</p>
                <p>• Well-lit room for best video quality</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
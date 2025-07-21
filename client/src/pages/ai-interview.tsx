import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Video, Mic, MicOff, VideoOff, Play, Square, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InterviewSession {
  id: number;
  duration: number;
  questions: string[];
  currentQuestion: number;
  status: 'waiting' | 'in_progress' | 'completed';
  startedAt?: string;
  application: {
    job: {
      title: string;
      department: string;
    };
    candidate: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function AIInterview() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Extract interview ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const interviewId = urlParams.get('id');

  const { data: session, isLoading } = useQuery({
    queryKey: ['/api/candidate/interview', interviewId],
    enabled: !!interviewId,
    refetchInterval: (data) => data?.status === 'in_progress' ? 5000 : false,
  });

  const startInterviewMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/candidate/interview/${interviewId}/start`, {
        method: 'POST',
      });
    },
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async ({ questionIndex, answer }: { questionIndex: number; answer: string }) => {
      return await apiRequest(`/api/candidate/interview/${interviewId}/answer`, {
        method: 'POST',
        body: JSON.stringify({ questionIndex, answer }),
      });
    },
    onSuccess: () => {
      setCurrentAnswer("");
      setIsRecording(false);
    },
  });

  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest(`/api/candidate/interview/${interviewId}/complete`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Interview Completed!",
        description: "Thank you for your time. We'll be in touch soon.",
      });
      setLocation('/candidate/interview-completed');
    },
  });

  // Initialize camera and microphone
  useEffect(() => {
    const initMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (error) {
        toast({
          title: "Media Access Required",
          description: "Please allow camera and microphone access to continue.",
          variant: "destructive",
        });
      }
    };

    initMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (session?.status === 'in_progress') {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [session?.status]);

  const startRecording = () => {
    if (!stream) return;

    const recorder = new MediaRecorder(stream);
    setMediaRecorder(recorder);
    
    recorder.start();
    setIsRecording(true);
    
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        // Handle recorded data
        console.log('Recording data available:', event.data);
      }
    };
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleAnswerSubmit = () => {
    if (!session || !currentAnswer.trim()) return;
    
    submitAnswerMutation.mutate({
      questionIndex: session.currentQuestion,
      answer: currentAnswer,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!interviewId) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 mb-4">
              <User className="h-12 w-12 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Invalid Interview Link</h2>
            <p className="text-gray-600">
              This interview link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-gray-900 border-gray-700">
          <CardContent className="pt-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-white">Loading interview...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const interviewSession = session as InterviewSession;

  if (interviewSession.status === 'waiting') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Video Preview */}
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Candidate Video */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Your Video</h3>
                  <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 left-4 flex space-x-2">
                      <Button size="sm" variant="secondary">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="secondary">
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* AI Avatar Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">AI Interviewer</h3>
                  <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <User className="h-12 w-12 text-white" />
                      </div>
                      <p className="text-white text-lg font-medium">AI Interviewer</p>
                      <p className="text-blue-200 text-sm">Ready to begin</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interview Details */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                Interview for {interviewSession.application.job.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-white">
                  <span>Candidate:</span>
                  <span>{interviewSession.application.candidate.firstName} {interviewSession.application.candidate.lastName}</span>
                </div>
                <div className="flex items-center justify-between text-white">
                  <span>Duration:</span>
                  <span>{interviewSession.duration} minutes</span>
                </div>
                <div className="flex items-center justify-between text-white">
                  <span>Questions:</span>
                  <span>{interviewSession.questions.length} questions</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button
                  onClick={() => startInterviewMutation.mutate()}
                  disabled={startInterviewMutation.isPending}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="h-5 w-5 mr-2" />
                  {startInterviewMutation.isPending ? "Starting..." : "Start Interview"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (interviewSession.status === 'in_progress') {
    const progress = ((interviewSession.currentQuestion + 1) / interviewSession.questions.length) * 100;
    const currentQ = interviewSession.questions[interviewSession.currentQuestion];

    return (
      <div className="min-h-screen bg-black p-4">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between bg-gray-900 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">
                Question {interviewSession.currentQuestion + 1} of {interviewSession.questions.length}
              </Badge>
              <div className="flex items-center space-x-2 text-white">
                <Clock className="h-4 w-4" />
                <span>{formatTime(timeElapsed)}</span>
              </div>
            </div>
            <Progress value={progress} className="w-32" />
          </div>

          {/* Video Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* AI Avatar */}
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg flex items-center justify-center relative">
                  <div className="text-center">
                    <div className="w-32 h-32 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <User className="h-16 w-16 text-white" />
                    </div>
                    <p className="text-white text-xl font-medium">AI Interviewer</p>
                  </div>
                  {/* Speaking indicator */}
                  <div className="absolute bottom-4 left-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Candidate Video */}
            <Card className="bg-gray-900 border-gray-700">
              <CardContent className="p-4">
                <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-4 right-4 flex space-x-2">
                    <Button
                      size="sm"
                      variant={isRecording ? "destructive" : "secondary"}
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                  </div>
                  {isRecording && (
                    <div className="absolute top-4 left-4">
                      <div className="flex items-center space-x-2 bg-red-600 px-3 py-1 rounded-full">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-white text-sm font-medium">Recording</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question and Answer */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Current Question</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-900/30 p-4 rounded-lg">
                  <p className="text-white text-lg">{currentQ}</p>
                </div>
                
                <div className="space-y-3">
                  <label className="text-white font-medium">Your Answer:</label>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your answer here or use voice recording..."
                    className="w-full h-32 bg-gray-800 border-gray-600 text-white rounded-lg p-3 resize-none focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      onClick={isRecording ? stopRecording : startRecording}
                    >
                      {isRecording ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                      {isRecording ? "Stop Recording" : "Record Answer"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {interviewSession.currentQuestion === interviewSession.questions.length - 1 ? (
                      <Button
                        onClick={() => completeInterviewMutation.mutate()}
                        disabled={completeInterviewMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {completeInterviewMutation.isPending ? "Finishing..." : "Complete Interview"}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleAnswerSubmit}
                        disabled={!currentAnswer.trim() || submitAnswerMutation.isPending}
                      >
                        {submitAnswerMutation.isPending ? "Submitting..." : "Next Question"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
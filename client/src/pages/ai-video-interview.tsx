import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Video, Mic, MicOff, VideoOff, Phone, Clock, User, CheckCircle, AlertCircle } from "lucide-react";

interface InterviewSession {
  id: number;
  token: string;
  candidateName: string;
  jobTitle: string;
  jobDepartment: string;
  status: 'waiting' | 'in_progress' | 'completed';
  currentQuestion: number;
  totalQuestions: number;
  startedAt?: string;
  questions: {
    id: number;
    question: string;
    type: 'introduction' | 'resume' | 'technical' | 'behavioral';
    expectedDuration: number;
  }[];
  responses: {
    questionId: number;
    answer: string;
    duration: number;
    timestamp: string;
  }[];
}

export default function AIVideoInterview() {
  const [match, params] = useRoute("/interview/:token");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const { data: session, isLoading, error } = useQuery<InterviewSession>({
    queryKey: [`/api/candidate/interview/${params?.token}`],
    enabled: !!params?.token && !!match,
    refetchInterval: 2000, // More frequent updates
    retry: 1,
    staleTime: 0, // Always consider data stale
    cacheTime: 0, // Don't cache - always fresh data
    refetchOnWindowFocus: true,
  });

  const startInterviewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/candidate/interview/${params?.token}/start`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/interview", params?.token] });
      toast({
        title: "Interview Started",
        description: "Your AI interview has begun. Good luck!",
      });
    },
  });



  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/candidate/interview/${params?.token}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidate/interview", params?.token] });
      toast({
        title: "Interview Completed",
        description: "Thank you for completing the interview. We'll be in touch soon!",
      });
    },
  });

  // Initialize media stream
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMediaStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
        toast({
          title: "Media Access Error",
          description: "Please allow camera and microphone access to continue with the interview.",
          variant: "destructive",
        });
      }
    };

    initializeMedia();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Timer for current question - only run when recording is active
  useEffect(() => {
    if (isRecording && timeRemaining > 0) {
      console.log('Timer started, remaining:', timeRemaining);
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = Math.max(0, prev - 1);
          console.log('Timer tick:', newTime);
          // Auto-submit when time runs out
          if (newTime === 0) {
            console.log('Timer expired, auto-submitting');
            setTimeout(() => submitAnswer(), 100);
          }
          return newTime;
        });
      }, 1000);
      return () => {
        console.log('Timer cleared');
        clearInterval(timer);
      };
    }
  }, [isRecording, timeRemaining > 0]);

  // Reset recording state when question changes
  useEffect(() => {
    if (session && session.status === 'in_progress') {
      setIsRecording(false);
      setTimeRemaining(0);
      // Clear any text input when moving to a new question
      if (session.currentQuestion !== undefined) {
        setCurrentAnswer("");
      }
    }
  }, [session?.currentQuestion]);

  // Update video/audio tracks
  useEffect(() => {
    if (mediaStream) {
      mediaStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });
      mediaStream.getAudioTracks().forEach(track => {
        track.enabled = isAudioEnabled;
      });
    }
  }, [mediaStream, isVideoEnabled, isAudioEnabled]);

  const startRecording = () => {
    if (!mediaStream || !session) return;

    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(mediaStream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      // Create blob from recorded chunks
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      console.log('Recording stopped, blob size:', blob.size);
      
      // Upload video recording
      if (blob.size > 0 && session) {
        try {
          const formData = new FormData();
          const questionId = session.questions[session.currentQuestion]?.id;
          formData.append('video', blob, `question-${questionId}-${Date.now()}.webm`);
          formData.append('questionId', questionId.toString());
          
          await fetch(`/api/candidate/interview/${params?.token}/upload-video`, {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          
          console.log('Video uploaded successfully');
        } catch (error) {
          console.error('Failed to upload video:', error);
        }
      }
    };

    mediaRecorder.start();
    setIsRecording(true);
    
    // Set timer for current question
    const currentQ = session.questions[session.currentQuestion];
    const duration = currentQ?.expectedDuration || 180;
    setTimeRemaining(duration);
    console.log('Started recording, timer set to:', duration);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitAnswer = () => {
    if (!session) return;

    const currentQ = session.questions[session.currentQuestion];
    const duration = (currentQ?.expectedDuration || 180) - timeRemaining;
    const answer = currentAnswer.trim() || "Video response recorded";

    // Stop recording if it's still active
    if (isRecording) {
      stopRecording();
    }

    submitAnswerMutation.mutate({
      questionId: currentQ.id,
      answer: answer,
      duration,
    });
  };

  const nextQuestion = () => {
    if (!session) return;

    if (session.currentQuestion >= session.questions.length - 1) {
      completeInterviewMutation.mutate();
    } else {
      // Reset state for next question
      setCurrentAnswer("");
      setTimeRemaining(0);
      setIsRecording(false);
    }
  };

  // Auto-progress to next question when answer is submitted
  const submitAnswerMutation = useMutation({
    mutationFn: async (data: { questionId: number; answer: string; duration: number }) => {
      console.log('Submitting answer:', data);
      return apiRequest("POST", `/api/candidate/interview/${params?.token}/answer`, data);
    },
    onSuccess: (data) => {
      console.log('Answer submitted successfully:', data);
      setCurrentAnswer("");
      setIsRecording(false);
      setTimeRemaining(0);
      
      // Force immediate refetch with no cache
      queryClient.removeQueries({ queryKey: [`/api/candidate/interview/${params?.token}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/candidate/interview/${params?.token}`] });
      
      // Show success message
      const responseData = data as any;
      toast({
        title: "Answer Submitted",
        description: responseData?.isCompleted ? "Interview completed!" : `Moving to question ${responseData?.nextQuestion || 'next'}...`,
      });
    },
    onError: (error) => {
      console.error('Submission failed:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again",
        variant: "destructive",
      });
    }
  });

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!match || !params?.token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Interview Link</h2>
            <p className="text-gray-600">
              The interview link appears to be malformed. Please check the URL and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading interview session...</p>
          <p className="text-sm text-gray-500 mt-2">Token: {params.token}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
            <p className="text-gray-600 mb-4">
              Unable to connect to the interview server. Please check your internet connection and try again.
            </p>
            <p className="text-xs text-gray-500">Error: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Interview Not Found</h2>
            <p className="text-gray-600">
              The interview link is invalid or has expired. Please contact HR for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session.status === 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Interview Completed</h2>
            <p className="text-gray-600 mb-4">
              Thank you for completing your interview for the {session.jobTitle} position.
            </p>
            <p className="text-sm text-gray-500">
              We'll review your responses and get back to you soon.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = session.questions[session.currentQuestion];
  const progress = Math.min(((session.currentQuestion + 1) / session.totalQuestions) * 100, 100);
  const isInterviewComplete = session.status === 'completed' || session.currentQuestion >= session.totalQuestions;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AI Video Interview</h1>
              <p className="text-gray-600">
                {session.jobTitle} - {session.jobDepartment}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                <span className="font-medium">{session.candidateName}</span>
              </div>
              <Badge variant={session.status === 'in_progress' ? 'default' : 'secondary'}>
                {session.status === 'waiting' ? 'Ready to Start' : 
                 session.status === 'in_progress' ? 'In Progress' : 'Completed'}
              </Badge>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Question {Math.min(session.currentQuestion + 1, session.totalQuestions)} of {session.totalQuestions}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Video Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Video Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                {!isVideoEnabled && (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <VideoOff className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                {isRecording && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    <span className="text-sm">Recording</span>
                  </div>
                )}
                {timeRemaining > 0 && (
                  <div className="absolute top-4 left-4 flex items-center gap-2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">{formatTime(timeRemaining)}</span>
                  </div>
                )}
              </div>
              
              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={isVideoEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                >
                  {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
                <Button
                  variant={isAudioEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Question Section */}
          <Card>
            <CardHeader>
              <CardTitle>
                {session.status === 'waiting' ? 'Interview Instructions' : 'Current Question'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session.status === 'waiting' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Welcome to your AI Interview!</h3>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• Make sure your camera and microphone are working</li>
                      <li>• Find a quiet, well-lit space</li>
                      <li>• Answer questions clearly and concisely</li>
                      <li>• You'll have {session.totalQuestions} questions to answer</li>
                      <li>• Each question has a time limit</li>
                    </ul>
                  </div>
                  <Button 
                    onClick={() => startInterviewMutation.mutate()}
                    className="w-full"
                    disabled={!mediaStream || startInterviewMutation.isPending}
                  >
                    Start Interview
                  </Button>
                </div>
              ) : isInterviewComplete ? (
                <div className="text-center space-y-4">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-semibold">Interview Completed!</h3>
                  <p className="text-gray-600">
                    Thank you for completing all {session.totalQuestions} questions. 
                    We'll review your responses and get back to you soon.
                  </p>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-700">
                      You've successfully completed your AI video interview for the {session.jobTitle} position.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {currentQuestion?.type?.charAt(0).toUpperCase() + currentQuestion?.type?.slice(1)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {currentQuestion?.expectedDuration} seconds
                      </span>
                    </div>
                    <p className="text-lg">{currentQuestion?.question}</p>
                  </div>

                  <div className="space-y-3">
                    <Textarea
                      value={currentAnswer}
                      onChange={(e) => setCurrentAnswer(e.target.value)}
                      placeholder="Type your answer here (optional - you can also just speak)"
                      rows={4}
                      disabled={isRecording}
                    />
                    
                    <div className="flex gap-2">
                      {!isRecording ? (
                        <Button 
                          onClick={startRecording}
                          className="flex-1"
                          disabled={!mediaStream}
                        >
                          Start Recording Answer
                        </Button>
                      ) : (
                        <>
                          <Button 
                            onClick={stopRecording}
                            variant="outline"
                            className="flex-1"
                          >
                            Stop Recording
                          </Button>
                          <Button 
                            onClick={submitAnswer}
                            className="flex-1"
                            disabled={submitAnswerMutation.isPending}
                          >
                            Submit Answer
                          </Button>
                        </>
                      )}
                      
                      {!isRecording && (currentAnswer.trim() || timeRemaining === 0) && (
                        <Button 
                          onClick={submitAnswer}
                          className="flex-1"
                          disabled={submitAnswerMutation.isPending}
                        >
                          Submit Answer
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Question Progress */}
        {session.status === 'in_progress' && session.responses.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Interview Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {session.questions.map((question, index) => {
                  const response = session.responses.find(r => r.questionId === question.id);
                  const isCurrent = index === session.currentQuestion;
                  const isCompleted = !!response;
                  
                  return (
                    <div key={question.id} className={`border-l-2 pl-4 ${
                      isCurrent ? 'border-blue-500 bg-blue-50' : 
                      isCompleted ? 'border-green-500' : 'border-gray-300'
                    }`}>
                      <p className={`text-sm mb-1 ${isCurrent ? 'font-semibold' : ''}`}>
                        Q{index + 1}: {question.question}
                      </p>
                      {isCompleted && (
                        <>
                          <p className="text-sm text-gray-700">{response.answer}</p>
                          <p className="text-xs text-gray-500">
                            Duration: {formatTime(response.duration)}
                          </p>
                        </>
                      )}
                      {isCurrent && (
                        <p className="text-xs text-blue-600 font-medium">Current Question</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
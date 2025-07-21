import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MicIcon, 
  MicOffIcon, 
  VideoIcon, 
  VideoOffIcon,
  PlayIcon,
  PauseIcon,
  Volume2Icon,
  VolumeXIcon,
  MessageSquareIcon,
  ClockIcon,
  ChevronRightIcon,
  BotIcon,
  UserIcon,
  SquareIcon as StopIcon,
  CheckCircleIcon
} from 'lucide-react';

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

export default function AIVideoInterview() {
  const { token } = useParams();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Media state
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Interview state
  const [currentResponse, setCurrentResponse] = useState('');
  const [responseTime, setResponseTime] = useState(0);
  const [totalInterviewTime, setTotalInterviewTime] = useState(0);
  const [interviewStartTime, setInterviewStartTime] = useState<Date | null>(null);
  const [interviewStatus, setInterviewStatus] = useState<'waiting' | 'countdown' | 'speaking' | 'listening' | 'processing' | 'completed'>('waiting');
  const [hasStartedInterview, setHasStartedInterview] = useState(false);
  const [countdownValue, setCountdownValue] = useState(10);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  
  // Interview duration limits (30-40 minutes)
  const MIN_INTERVIEW_DURATION = 30 * 60; // 30 minutes in seconds
  const MAX_INTERVIEW_DURATION = 40 * 60; // 40 minutes in seconds
  
  // Media refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout>();
  const interviewTimerRef = useRef<NodeJS.Timeout>();
  const countdownTimerRef = useRef<NodeJS.Timeout>();

  // Motivational messages for countdown
  const motivationalMessages = [
    "Take a deep breath and relax",
    "You've got this! Stay confident", 
    "Think about your experiences",
    "Be authentic and honest",
    "Remember to speak clearly",
    "Take your time to think",
    "Show your passion for the role",
    "Focus on your strengths",
    "Stay calm and composed",
    "You're well prepared for this"
  ];

  const { data: session, isLoading, error } = useQuery<InterviewSession>({
    queryKey: ['/api/interview-sessions', token],
    queryFn: async () => {
      const response = await fetch(`/api/interview-sessions/${token}`);
      if (!response.ok) {
        throw new Error('Interview session not found');
      }
      return response.json();
    },
    enabled: !!token
  });

  const submitResponseMutation = useMutation({
    mutationFn: async (response: { questionIndex: number; answer: string; duration: number }) => {
      const result = await fetch(`/api/interview-sessions/${token}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response)
      });
      return result.json();
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/interview-sessions', token] });
      
      // Check if more questions available
      if (session && session.currentQuestion + 1 < session.totalQuestions) {
        // Automatically proceed to next question
        setInterviewStatus('processing');
        setTimeout(async () => {
          await nextQuestionMutation.mutateAsync();
        }, 2000);
      } else {
        // Interview completed
        setInterviewStatus('completed');
        setCurrentSubtitle('Interview completed! Thank you for your responses.');
        // Call the complete endpoint to create evaluation
        completeInterviewMutation.mutate();
      }
    }
  });

  const nextQuestionMutation = useMutation({
    mutationFn: async () => {
      const result = await fetch(`/api/interview-sessions/${token}/next`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return result.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/interview-sessions', token] });
      setCurrentResponse('');
      setResponseTime(0);
      setInterviewStatus('speaking');
      
      // Start next question flow WITHOUT countdown (countdown only for first question)
      if (data.question) {
        speakQuestion(data.question);
      } else {
        // No more questions - complete interview
        setInterviewStatus('completed');
        setCurrentSubtitle('Interview completed! Thank you for your responses.');
        // Call the complete endpoint to create evaluation
        completeInterviewMutation.mutate();
      }
    }
  });

  const completeInterviewMutation = useMutation({
    mutationFn: async () => {
      const result = await fetch(`/api/interview-sessions/${token}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return result.json();
    },
    onSuccess: () => {
      setInterviewStatus('completed');
      setCurrentSubtitle('Interview completed successfully!');
      setTimeout(() => {
        setLocation('/interview/complete');
      }, 2000);
    }
  });

  useEffect(() => {
    initializeCamera();
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (session && !hasStartedInterview) {
      startInterview();
    }
  }, [session, hasStartedInterview]);

  // Interview timer effect
  useEffect(() => {
    if (interviewStartTime && interviewStatus !== 'completed') {
      interviewTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - interviewStartTime.getTime()) / 1000);
        setTotalInterviewTime(elapsed);
        
        // Auto-complete interview if it exceeds maximum duration
        if (elapsed >= MAX_INTERVIEW_DURATION) {
          endInterview();
        }
      }, 1000);
      
      return () => {
        if (interviewTimerRef.current) {
          clearInterval(interviewTimerRef.current);
        }
      };
    }
  }, [interviewStartTime, interviewStatus]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (interviewTimerRef.current) {
        clearInterval(interviewTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  const initializeMediaRecorder = (stream: MediaStream) => {
    try {
      console.log('Initializing MediaRecorder with stream:', stream);
      console.log('Audio tracks available:', stream.getAudioTracks().length);
      
      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        throw new Error('MediaRecorder is not supported in this browser');
      }
      
      // Create audio-only stream from the main stream
      const audioStream = new MediaStream();
      stream.getAudioTracks().forEach(track => {
        console.log('Adding audio track:', track.label, track.kind, track.readyState);
        audioStream.addTrack(track);
      });
      
      // Try different MIME types in order of preference
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav',
        '' // Default
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (mimeType === '' || MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log('Selected MIME type:', selectedMimeType || 'default');
          break;
        }
      }
      
      // Create MediaRecorder with audio-only stream
      const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
      console.log('Creating MediaRecorder with options:', options);
      
      const mediaRecorder = new MediaRecorder(audioStream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        console.log('Audio data available, size:', event.data.size);
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data]);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped');
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
        setCurrentSubtitle('Audio recording error. Please try again.');
      };
      
      mediaRecorderRef.current = mediaRecorder;
      console.log('MediaRecorder initialized successfully with state:', mediaRecorder.state);
    } catch (error) {
      console.error('Failed to initialize MediaRecorder:', error);
      setCurrentSubtitle('Failed to setup audio recording. Please check browser permissions.');
    }
  };

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize MediaRecorder for audio recording
      if (stream.getAudioTracks().length > 0) {
        initializeMediaRecorder(stream);
      }
    } catch (error) {
      console.error('Failed to access camera/microphone:', error);
      setCurrentSubtitle('Camera/microphone access denied. Please enable permissions and refresh.');
    }
  };

  const startInterview = () => {
    if (!session || hasStartedInterview) return;
    
    setHasStartedInterview(true);
    setInterviewStartTime(new Date());
    
    // Start with countdown before first question
    startCountdown(() => {
      if (session.questions && session.questions.length > 0) {
        speakQuestion(session.questions[session.currentQuestion]);
      }
    });
  };

  const startCountdown = (callback: () => void) => {
    setInterviewStatus('countdown');
    setCountdownValue(10);
    setMotivationalMessage(motivationalMessages[0]);
    
    // Timer for countdown numbers (every 1 second)
    const countdownInterval = setInterval(() => {
      setCountdownValue(prev => {
        const newValue = prev - 1;
        
        if (newValue <= 0) {
          clearInterval(countdownInterval);
          clearInterval(messageInterval);
          setInterviewStatus('speaking');
          callback();
          return 0;
        }
        return newValue;
      });
    }, 1000);
    
    // Timer for motivational messages (every 2 seconds)
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % motivationalMessages.length;
      setMotivationalMessage(motivationalMessages[messageIndex]);
    }, 2000);
    
    countdownTimerRef.current = countdownInterval;
  };

  const speakQuestion = (question: string) => {
    setIsAISpeaking(true);
    setInterviewStatus('speaking');
    setCurrentSubtitle(`AI: ${question}`);
    
    // Simulate AI speaking with text-to-speech
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.onend = () => {
        setIsAISpeaking(false);
        setInterviewStatus('listening');
        setCurrentSubtitle('You can speak your response or type it below. Click "Submit Response" when finished.');
        startTimer();
      };
      speechSynthesis.speak(utterance);
    } else {
      // Fallback without speech synthesis
      setTimeout(() => {
        setIsAISpeaking(false);
        setInterviewStatus('listening');
        setCurrentSubtitle('You can speak your response or type it below. Click "Submit Response" when finished.');
        startTimer();
      }, 3000);
    }
  };

  const startTimer = () => {
    setResponseTime(0);
    timerRef.current = setInterval(() => {
      setResponseTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startAudioRecording = () => {
    console.log('startAudioRecording called', {
      hasMediaRecorder: !!mediaRecorderRef.current,
      isRecording,
      mediaRecorderState: mediaRecorderRef.current?.state,
      hasMediaStream: !!mediaStreamRef.current,
      audioTracks: mediaStreamRef.current?.getAudioTracks().length || 0
    });
    
    // Check if we have media stream first
    if (!mediaStreamRef.current) {
      console.error('No media stream available');
      setCurrentSubtitle('No microphone access. Please allow microphone permissions and refresh.');
      return;
    }
    
    // Check if MediaRecorder was initialized
    if (!mediaRecorderRef.current) {
      console.error('MediaRecorder not initialized');
      setCurrentSubtitle('Audio recording not initialized. Please refresh the page.');
      return;
    }
    
    if (isRecording) {
      console.log('Already recording');
      return;
    }
    
    // Check MediaRecorder state before starting
    if (mediaRecorderRef.current.state === 'recording') {
      console.warn('MediaRecorder is already recording');
      return;
    }
    
    if (mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsRecording(true);
      setCurrentSubtitle('Recording your audio response... Click "Stop Recording" when finished.');
      return;
    }
    
    try {
      setAudioChunks([]);
      setIsRecording(true);
      setCurrentSubtitle('Recording your audio response... Click "Stop Recording" when finished.');
      
      console.log('Starting MediaRecorder with state:', mediaRecorderRef.current.state);
      
      // Try to start recording with a small timeslice for better compatibility
      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      console.log('MediaRecorder started successfully');
      
      // Verify it actually started
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'recording') {
          console.warn('MediaRecorder failed to start properly, state:', mediaRecorderRef.current.state);
          setIsRecording(false);
          setCurrentSubtitle('Audio recording failed to start. You can still type your response below.');
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to start MediaRecorder:', error);
      setIsRecording(false);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.name === 'NotSupportedError') {
          setCurrentSubtitle('Audio recording not supported. Please type your response below instead.');
        } else if (error.name === 'SecurityError') {
          setCurrentSubtitle('Microphone permission denied. Please type your response below.');
        } else {
          setCurrentSubtitle('Audio recording unavailable. Please type your response below.');
        }
      } else {
        setCurrentSubtitle('Audio recording error. Please type your response below.');
      }
    }
  };

  const stopAudioRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    // Check MediaRecorder state before stopping
    if (mediaRecorderRef.current.state === 'inactive') {
      console.warn('MediaRecorder is already inactive');
      setIsRecording(false);
      return;
    }
    
    try {
      setIsRecording(false);
      setCurrentSubtitle('Processing audio response...');
      
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      
      // Process the audio after stopping
      setTimeout(() => {
        if (audioChunks.length > 0) {
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          processAudioResponse(audioBlob);
        }
      }, 500);
    } catch (error) {
      console.error('Failed to stop MediaRecorder:', error);
      setIsRecording(false);
      setCurrentSubtitle('Error stopping audio recording.');
    }
  };

  const processAudioResponse = async (audioBlob: Blob) => {
    try {
      setCurrentSubtitle('Transcribing audio response...');
      
      // Create FormData to send audio to backend for transcription
      const formData = new FormData();
      formData.append('audio', audioBlob, 'response.webm');
      
      const response = await fetch(`/api/interview-sessions/${token}/transcribe`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const result = await response.json();
        setCurrentResponse(result.transcription || 'Audio recorded');
        setCurrentSubtitle('Audio transcribed! You can edit the response below or submit it.');
      } else {
        console.warn('Transcription failed, using placeholder');
        setCurrentResponse('Audio response recorded');
        setCurrentSubtitle('Audio recorded! You can edit the response below or submit it.');
      }
    } catch (error) {
      console.error('Audio processing error:', error);
      setCurrentResponse('Audio response recorded');
      setCurrentSubtitle('Audio recorded! You can edit the response below or submit it.');
    }
  };

  const submitTextResponse = async () => {
    if (!session || !currentResponse.trim()) return;
    
    setInterviewStatus('processing');
    setCurrentSubtitle('Processing your response...');
    stopTimer();
    
    try {
      await submitResponseMutation.mutateAsync({
        questionIndex: session.currentQuestion,
        answer: currentResponse,
        duration: responseTime
      });
    } catch (error) {
      console.error('Failed to submit response:', error);
      setCurrentSubtitle('Error submitting response. Please try again.');
      setInterviewStatus('listening');
    }
  };

  const endInterview = async () => {
    setInterviewStatus('processing');
    setCurrentSubtitle('Ending interview and processing results...');
    
    try {
      await completeInterviewMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to complete interview:', error);
    }
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleMicrophone = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4">Initializing AI Interview...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 text-white">
          <CardContent className="p-6 text-center">
            <div className="text-red-400 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Interview Session Error</h2>
            <p className="text-gray-300 mb-4">
              {error ? `Error: ${error.message}` : "Interview session not found."}
            </p>
            <p className="text-sm text-gray-400 mb-4">Token: {token}</p>
            <Button onClick={() => window.location.href = '/'} className="bg-blue-600 hover:bg-blue-700">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercentage = ((session.currentQuestion + 1) / session.totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BotIcon className="h-5 w-5 text-blue-400" />
              <span className="font-medium">AI Interviewer</span>
            </div>
            <Badge variant="secondary">
              Question {session.currentQuestion + 1} of {session.totalQuestions}
            </Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-4 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4" />
                <span>Total: {formatTime(totalInterviewTime)}</span>
              </div>
              {interviewStatus === 'listening' && (
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-400">Response: {formatTime(responseTime)}</span>
                </div>
              )}
              {totalInterviewTime >= MIN_INTERVIEW_DURATION && (
                <Badge variant="default" className="bg-green-600">
                  Ready to complete
                </Badge>
              )}
            </div>
            <div className="w-32">
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 h-[calc(100vh-80px)]">
        {/* AI Avatar Section */}
        <div className="lg:col-span-2 bg-gray-800 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`w-48 h-48 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6 mx-auto ${isAISpeaking ? 'animate-pulse' : ''}`}>
                <BotIcon className="h-20 w-20 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">AI Interviewer</h3>
                <p className="text-gray-300">Professional AI Assistant</p>
                <div className="flex items-center justify-center space-x-2 mt-4">
                  {interviewStatus === 'speaking' ? (
                    <>
                      <Volume2Icon className="h-5 w-5 text-green-500" />
                      <span className="text-green-500">Speaking...</span>
                    </>
                  ) : interviewStatus === 'listening' ? (
                    <>
                      <UserIcon className="h-5 w-5 text-blue-400" />
                      <span className="text-blue-400">Listening...</span>
                    </>
                  ) : interviewStatus === 'countdown' ? (
                    <>
                      <ClockIcon className="h-5 w-5 text-purple-400" />
                      <span className="text-purple-400">Preparing question...</span>
                    </>
                  ) : interviewStatus === 'processing' ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-500"></div>
                      <span className="text-yellow-500">Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      <span className="text-green-500">Ready</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Video Section */}
        <div className="lg:col-span-2 bg-gray-900 relative">
          <div className="absolute inset-0">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!isVideoOn && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <VideoOffIcon className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4 bg-black bg-opacity-50 rounded-lg px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMicrophone}
                className={isMicOn ? "text-white" : "text-red-500"}
              >
                {isMicOn ? <MicIcon className="h-5 w-5" /> : <MicOffIcon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleVideo}
                className={isVideoOn ? "text-white" : "text-red-500"}
              >
                {isVideoOn ? <VideoIcon className="h-5 w-5" /> : <VideoOffIcon className="h-5 w-5" />}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={endInterview}
                disabled={interviewStatus === 'processing'}
              >
                <StopIcon className="h-4 w-4 mr-2" />
                End Interview
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-lg">{currentSubtitle}</p>
          </div>
          
          {interviewStatus === 'listening' && (
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-3">
                  <Button
                    onClick={isRecording ? stopAudioRecording : startAudioRecording}
                    disabled={interviewStatus !== 'listening'}
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    className={isRecording ? "bg-red-600 hover:bg-red-700" : "border-green-500 text-green-500 hover:bg-green-500 hover:text-black"}
                  >
                    {isRecording ? (
                      <>
                        <StopIcon className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <MicIcon className="h-4 w-4 mr-2" />
                        Record Audio
                      </>
                    )}
                  </Button>
                  <span className="text-sm text-gray-400">or</span>
                </div>
                <textarea
                  value={currentResponse}
                  onChange={(e) => setCurrentResponse(e.target.value)}
                  placeholder="Type your response here..."
                  className="bg-gray-700 text-white rounded-lg px-4 py-2 w-full h-20 resize-none"
                  disabled={interviewStatus !== 'listening'}
                />
              </div>
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={submitTextResponse}
                  disabled={!currentResponse.trim() || interviewStatus !== 'listening'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <ChevronRightIcon className="h-4 w-4 mr-2" />
                  Submit Response
                </Button>
                
                {totalInterviewTime >= MIN_INTERVIEW_DURATION && (
                  <Button
                    onClick={endInterview}
                    variant="outline"
                    className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                  >
                    <StopIcon className="h-4 w-4 mr-2" />
                    End Interview
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Countdown Overlay */}
      {interviewStatus === 'countdown' && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-8xl font-bold text-white mb-6 animate-pulse">
              {countdownValue}
            </div>
            <div className="text-2xl text-purple-400 mb-4">
              {motivationalMessage}
            </div>
            <div className="text-lg text-gray-300">
              Next question starting soon...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
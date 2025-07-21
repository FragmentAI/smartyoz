import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Timer,
  User,
  FileText,
  Star,
  MessageSquare,
  Camera,
  Share2,
  Clock
} from "lucide-react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface InterviewDetails {
  id: number;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  type: string;
  duration: number;
  scheduledAt: Date;
  interviewerName: string;
  meetingUrl?: string;
  status: string;
}

export default function InterviewerCandidateInterface() {
  const { interviewId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Media states
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [callStarted, setCallStarted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Interview states
  const [currentStep, setCurrentStep] = useState<'preparation' | 'interview' | 'evaluation'>('preparation');
  const [notes, setNotes] = useState('');
  const [evaluation, setEvaluation] = useState({
    technicalScore: 0,
    communicationScore: 0,
    culturalFitScore: 0,
    problemSolvingScore: 0,
    overallScore: 0,
    recommendation: '',
    feedback: '',
    strengths: '',
    improvements: ''
  });
  
  // Media refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  // Fetch interview details
  const { data: interview, isLoading } = useQuery<InterviewDetails>({
    queryKey: [`/api/interviews/${interviewId}`],
    enabled: !!interviewId,
  });

  // Start interview timer
  useEffect(() => {
    if (callStarted) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callStarted]);

  // Initialize media devices
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: "Media Access Error",
          description: "Could not access camera/microphone",
          variant: "destructive"
        });
      }
    };

    if (currentStep === 'interview') {
      initializeMedia();
    }
  }, [currentStep, toast]);

  // Submit evaluation mutation
  const submitEvaluationMutation = useMutation({
    mutationFn: async (evaluationData: any) => {
      const response = await fetch(`/api/interviews/${interviewId}/evaluation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evaluationData)
      });
      if (!response.ok) throw new Error('Failed to submit evaluation');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Interview evaluation submitted successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/evaluations'] });
      setLocation('/interviews');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit evaluation",
        variant: "destructive"
      });
    }
  });

  const handleStartInterview = () => {
    setCallStarted(true);
    setCurrentStep('interview');
  };

  const handleEndInterview = () => {
    setCallStarted(false);
    setCurrentStep('evaluation');
  };

  const toggleVideo = () => {
    setVideoEnabled(!videoEnabled);
    // In a real implementation, you would control the actual video stream here
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    // In a real implementation, you would control the actual audio stream here
  };

  const handleSubmitEvaluation = () => {
    const overallScore = Math.round(
      (evaluation.technicalScore + evaluation.communicationScore + 
       evaluation.culturalFitScore + evaluation.problemSolvingScore) / 4
    );

    const evaluationData = {
      ...evaluation,
      overallScore,
      interviewId: parseInt(interviewId!),
      strengths: evaluation.strengths.split(',').map(s => s.trim()).filter(s => s),
      improvements: evaluation.improvements.split(',').map(s => s.trim()).filter(s => s),
      evaluatedBy: 'interviewer', // This would come from auth context
      notes
    };

    submitEvaluationMutation.mutate(evaluationData);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading interview details...</div>;
  }

  if (!interview) {
    return <div className="flex items-center justify-center h-screen">Interview not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Interview Session
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {interview.candidateName} • {interview.jobTitle} • {interview.type}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={callStarted ? 'default' : 'outline'}>
                {callStarted ? 'In Progress' : interview.status}
              </Badge>
              {callStarted && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Timer className="h-4 w-4" />
                  <span className="font-mono">{formatTime(timeElapsed)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {currentStep === 'preparation' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interview Details */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Interview Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Candidate</Label>
                      <p className="text-lg font-semibold">{interview.candidateName}</p>
                      <p className="text-gray-600 dark:text-gray-400">{interview.candidateEmail}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</Label>
                      <p className="text-lg font-semibold">{interview.jobTitle}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Interview Type</Label>
                      <p className="text-lg capitalize">{interview.type}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Duration</Label>
                      <p className="text-lg">{interview.duration} minutes</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Scheduled</Label>
                      <p className="text-lg">{new Date(interview.scheduledAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Interviewer</Label>
                      <p className="text-lg">{interview.interviewerName}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pre-interview Checklist */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Pre-Interview Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Review candidate's resume</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Prepare interview questions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Test audio/video setup</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Review job requirements</span>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <Button 
                    onClick={handleStartInterview}
                    className="w-full"
                    size="lg"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Start Interview
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 'interview' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Video Interface */}
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    {/* Remote Video (Candidate) */}
                    <video
                      ref={remoteVideoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                    />
                    
                    {/* Local Video (Interviewer) */}
                    <div className="absolute bottom-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-white">
                      <video
                        ref={localVideoRef}
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        muted
                      />
                    </div>

                    {/* Controls */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-4">
                      <Button
                        onClick={toggleVideo}
                        variant={videoEnabled ? 'default' : 'destructive'}
                        size="lg"
                        className="rounded-full"
                      >
                        {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                      </Button>
                      
                      <Button
                        onClick={toggleAudio}
                        variant={audioEnabled ? 'default' : 'destructive'}
                        size="lg"
                        className="rounded-full"
                      >
                        {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                      </Button>
                      
                      <Button
                        onClick={handleEndInterview}
                        variant="destructive"
                        size="lg"
                        className="rounded-full"
                      >
                        <PhoneOff className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interview Notes */}
            <div>
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Interview Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Take notes during the interview..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[400px] resize-none"
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 'evaluation' && (
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Interview Evaluation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Scoring Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="technicalScore">Technical Skills (0-100)</Label>
                    <Input
                      id="technicalScore"
                      type="number"
                      min="0"
                      max="100"
                      value={evaluation.technicalScore}
                      onChange={(e) => setEvaluation({
                        ...evaluation,
                        technicalScore: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="communicationScore">Communication (0-100)</Label>
                    <Input
                      id="communicationScore"
                      type="number"
                      min="0"
                      max="100"
                      value={evaluation.communicationScore}
                      onChange={(e) => setEvaluation({
                        ...evaluation,
                        communicationScore: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="culturalFitScore">Cultural Fit (0-100)</Label>
                    <Input
                      id="culturalFitScore"
                      type="number"
                      min="0"
                      max="100"
                      value={evaluation.culturalFitScore}
                      onChange={(e) => setEvaluation({
                        ...evaluation,
                        culturalFitScore: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="problemSolvingScore">Problem Solving (0-100)</Label>
                    <Input
                      id="problemSolvingScore"
                      type="number"
                      min="0"
                      max="100"
                      value={evaluation.problemSolvingScore}
                      onChange={(e) => setEvaluation({
                        ...evaluation,
                        problemSolvingScore: parseInt(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>

                {/* Overall Score Display */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <Label className="text-lg font-semibold">Overall Score</Label>
                  <div className="mt-2">
                    <Progress 
                      value={Math.round((evaluation.technicalScore + evaluation.communicationScore + 
                                      evaluation.culturalFitScore + evaluation.problemSolvingScore) / 4)} 
                      className="h-3" 
                    />
                    <p className="text-right mt-1 text-lg font-bold">
                      {Math.round((evaluation.technicalScore + evaluation.communicationScore + 
                                 evaluation.culturalFitScore + evaluation.problemSolvingScore) / 4)}/100
                    </p>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <Label htmlFor="feedback">Overall Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={evaluation.feedback}
                    onChange={(e) => setEvaluation({ ...evaluation, feedback: e.target.value })}
                    placeholder="Provide detailed feedback about the candidate's performance..."
                    className="min-h-[100px]"
                  />
                </div>

                {/* Strengths and Improvements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="strengths">Key Strengths (comma-separated)</Label>
                    <Textarea
                      id="strengths"
                      value={evaluation.strengths}
                      onChange={(e) => setEvaluation({ ...evaluation, strengths: e.target.value })}
                      placeholder="Leadership, Problem solving, Communication..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="improvements">Areas for Improvement (comma-separated)</Label>
                    <Textarea
                      id="improvements"
                      value={evaluation.improvements}
                      onChange={(e) => setEvaluation({ ...evaluation, improvements: e.target.value })}
                      placeholder="Time management, Technical depth..."
                    />
                  </div>
                </div>

                {/* Recommendation */}
                <div>
                  <Label htmlFor="recommendation">Recommendation</Label>
                  <select
                    id="recommendation"
                    value={evaluation.recommendation}
                    onChange={(e) => setEvaluation({ ...evaluation, recommendation: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select recommendation</option>
                    <option value="hire">Hire</option>
                    <option value="maybe">Maybe</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="interviewNotes">Interview Notes</Label>
                  <Textarea
                    id="interviewNotes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="min-h-[100px]"
                    readOnly
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setLocation('/interviews')}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitEvaluation}
                    disabled={!evaluation.recommendation || submitEvaluationMutation.isPending}
                  >
                    {submitEvaluationMutation.isPending ? 'Submitting...' : 'Submit Evaluation'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
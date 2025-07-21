import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Target,
  Trophy,
  Timer
} from "lucide-react";

interface TestQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: string;
  category: string;
}

interface TestSession {
  id: number;
  testToken: string;
  totalQuestions: number;
  answeredQuestions: number;
  score?: number;
  status: 'pending' | 'in_progress' | 'completed';
  startedAt?: string;
  completedAt?: string;
  driveCandidate: {
    name: string;
    driveSession: {
      name: string;
      testDuration: number;
      cutoffScore: number;
    };
  };
  questions: TestQuestion[];
}

export default function DriveTest() {
  const [match, params] = useRoute("/drive/test/:token");
  const { toast } = useToast();
  const [testSession, setTestSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (match && params?.token && !testSession) {
      fetchTestSession(params.token);
    }
  }, [match, params?.token]);

  useEffect(() => {
    if (testStarted && timeLeft > 0 && !submitting && !testCompleted) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (testStarted && timeLeft === 0 && !submitting && !testCompleted) {
      handleSubmitTest();
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [testStarted, timeLeft, submitting, testCompleted]);

  const fetchTestSession = async (token: string) => {
    try {
      const response = await fetch(`/api/drive/test/${token}`);
      if (response.ok) {
        const data = await response.json();

        
        // The API returns { testSession: {...}, questions: [...] }
        const sessionWithQuestions = {
          ...data.testSession,
          questions: data.questions
        };
        
        setTestSession(sessionWithQuestions);
        setTimeLeft(data.testSession.driveCandidate.driveSession.testDuration * 60); // Convert minutes to seconds
        setTestCompleted(data.testSession.status === 'completed');
      } else {
        toast({
          title: "Invalid Test Link",
          description: "This test link is invalid or has expired.",
          variant: "destructive",
        });
      }
    } catch (error) {

      toast({
        title: "Error",
        description: "Failed to load test details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startTest = () => {
    setTestStarted(true);
  };

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleSubmitTest = async () => {
    if (!params?.token || !testSession) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/drive/test/${params.token}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (response.ok) {
        const result = await response.json();
        setTestCompleted(true);
        setTestSession(prev => prev ? { ...prev, score: result.score, status: 'completed' } : null);
        toast({
          title: "Test Submitted Successfully!",
          description: `Your score: ${result.score}%. Results will be communicated via email.`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Submission Failed",
          description: error.message || "Failed to submit test. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit test. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft > 300) return "text-green-600"; // > 5 minutes
    if (timeLeft > 60) return "text-yellow-600"; // > 1 minute
    return "text-red-600"; // < 1 minute
  };

  if (loading || !testSession || !testSession.driveCandidate || !testSession.driveCandidate.driveSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!testSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invalid Test Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              This test link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testCompleted) {
    const passed = testSession.score && testSession.score >= testSession.driveCandidate.driveSession.cutoffScore;
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className={`text-center flex items-center justify-center gap-2 ${passed ? 'text-green-600' : 'text-red-600'}`}>
              {passed ? <Trophy className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
              Test Completed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold">{testSession.score}%</div>
              <div className="text-sm text-gray-600">
                Required: {testSession.driveCandidate.driveSession.cutoffScore}%
              </div>
            </div>
            
            <Alert className={passed ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              {passed ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
              <AlertDescription className={passed ? "text-green-800" : "text-red-800"}>
                {passed 
                  ? "Congratulations! You have qualified for the next round. Our HR team will contact you soon for the interview."
                  : "Thank you for participating. Unfortunately, you did not meet the minimum score requirement for this position."
                }
              </AlertDescription>
            </Alert>

            <div className="text-sm text-gray-600 space-y-1">
              <p>📧 Detailed results sent to your email</p>
              <p>⏰ Results processed immediately</p>
              {passed && <p>📞 Expect interview call within 2-3 days</p>}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-gray-900">
                Aptitude Test
              </CardTitle>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold text-blue-600">
                  {testSession.driveCandidate.driveSession.name}
                </h2>
                <p className="text-gray-600">Welcome, {testSession.driveCandidate.name}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center">
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold">{testSession.totalQuestions}</div>
                  <div className="text-sm text-gray-600">Questions</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center">
                    <Timer className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold">{testSession.driveCandidate.driveSession.testDuration}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center">
                    <Target className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold">{testSession.driveCandidate.driveSession.cutoffScore}%</div>
                  <div className="text-sm text-gray-600">Required</div>
                </div>
                <div className="text-center space-y-1">
                  <div className="flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold">MCQ</div>
                  <div className="text-sm text-gray-600">Format</div>
                </div>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important Instructions:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Ensure stable internet connection</li>
                    <li>• Test will auto-submit when time expires</li>
                    <li>• You cannot pause or restart the test</li>
                    <li>• Navigate freely between questions</li>
                    <li>• Submit when you're finished</li>
                  </ul>
                </AlertDescription>
              </Alert>

              <Button onClick={startTest} className="w-full" size="lg">
                Start Test
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentQ = testSession.questions?.[currentQuestion];
  const progress = ((currentQuestion + 1) / testSession.totalQuestions) * 100;

  // If no current question available, show loading
  if (!currentQ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header with timer and progress */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium">
                Question {currentQuestion + 1} of {testSession.totalQuestions}
              </div>
              <Progress value={progress} className="w-32" />
            </div>
            <div className={`flex items-center space-x-2 ${getTimeColor()}`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono text-lg font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {currentQ?.category || 'General'} • {currentQ?.difficulty || 'Medium'}
              </div>
              <div className="text-sm text-gray-500">
                {answers[currentQuestion] !== undefined ? "Answered" : "Not answered"}
              </div>
            </div>
            <CardTitle className="text-lg">{currentQ?.question || 'Loading question...'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(currentQ?.options || []).map((option, index) => (
              <label
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  answers[currentQuestion] === index
                    ? "bg-blue-50 border-blue-300 text-blue-900"
                    : "bg-white border-gray-200 hover:bg-gray-50 text-gray-900"
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  value={index}
                  checked={answers[currentQuestion] === index}
                  onChange={() => handleAnswerSelect(currentQuestion, index)}
                  className="text-blue-600"
                />
                <span className="flex-1 text-gray-900">{option}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          
          <div className="flex space-x-2">
            {(testSession.questions || []).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded text-xs font-medium ${
                  index === currentQuestion
                    ? "bg-blue-600 text-white"
                    : answers[index] !== undefined
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === (testSession.questions?.length || testSession.totalQuestions) - 1 ? (
            <Button
              onClick={handleSubmitTest}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentQuestion(Math.min((testSession.questions?.length || testSession.totalQuestions) - 1, currentQuestion + 1))}
              disabled={currentQuestion === (testSession.questions?.length || testSession.totalQuestions) - 1}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
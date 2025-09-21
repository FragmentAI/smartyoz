import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, Play, AlertCircle, CheckCircle } from 'lucide-react';

interface AIInterviewLauncherProps {
  interviewId: number;
  candidateName: string;
  positionName: string;
  onSuccess?: (loginUrl: string) => void;
  onError?: (error: string) => void;
}

export const AIInterviewLauncher: React.FC<AIInterviewLauncherProps> = ({
  interviewId,
  candidateName,
  positionName,
  onSuccess,
  onError
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [launchResult, setLaunchResult] = useState<{
    success: boolean;
    loginUrl?: string;
    error?: string;
  } | null>(null);

  // Add console log to verify component is rendering
  console.log('🎯 AI Interview Launcher rendered with:', { interviewId, candidateName, positionName });

  const handleLaunchInterview = async () => {
    setIsLaunching(true);
    setLaunchResult(null);

    try {
      console.log('🚀 AI Interview Launcher: Starting launch for interview ID:', interviewId);
      console.log('🚀 Candidate:', candidateName, 'Position:', positionName);

      const response = await fetch(`/api/interviews/${interviewId}/launch-ai-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('🚀 AI Interview Launch Response:', result);
      console.log('🔗 Login URL received:', result.loginUrl);

      if (!response.ok) {
        throw new Error(result.message || `Request failed with status ${response.status}`);
      }

      if (result.success && result.loginUrl) {
        console.log('✅ Successfully received login URL, opening window...');
        setLaunchResult({
          success: true,
          loginUrl: result.loginUrl
        });

        // Call success callback
        onSuccess?.(result.loginUrl);

        // Auto-open the interview in a new window
        console.log('🎯 Opening AI interview window with URL:', result.loginUrl);
        openInterviewWindow(result.loginUrl);
      } else {
        throw new Error(result.error || 'Failed to get login URL from AI interview system');
      }

    } catch (error) {
      console.error('❌ Failed to launch AI interview:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setLaunchResult({
        success: false,
        error: errorMessage
      });

      onError?.(errorMessage);
    } finally {
      setIsLaunching(false);
    }
  };

  const openInterviewWindow = (loginUrl: string) => {
    console.log('🚪 Opening interview window with URL:', loginUrl);
    
    // Try opening in new tab first
    const newWindow = window.open(loginUrl, '_blank', 'noopener,noreferrer');
    
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
      // Popup was blocked, try alternative approach
      console.warn('⚠️ Popup blocked, trying alternative approach');
      
      // Create a link and click it programmatically
      const link = document.createElement('a');
      link.href = loginUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('✅ Opened AI interview via link click');
    } else {
      console.log('✅ Successfully opened new window for AI interview');
    }
  };

  const resetDialog = () => {
    setLaunchResult(null);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Play className="h-4 w-4 mr-1" />
          Launch AI Interview
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Launch AI Interview
          </DialogTitle>
          <DialogDescription>
            Launch the AI-powered interview session for <strong>{candidateName}</strong> applying for <strong>{positionName}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!launchResult && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This will send the candidate's resume and job description to our AI interview system and open their interview session in a new window.
              </AlertDescription>
            </Alert>
          )}

          {launchResult?.success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-2">
                  <p>✅ AI Interview launched successfully!</p>
                  <p className="text-sm">The interview session has been opened in a new window.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-green-600">Interview URL:</span>
                    <button
                      onClick={() => openInterviewWindow(launchResult.loginUrl!)}
                      className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open Again
                    </button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {launchResult?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>❌ Failed to launch AI interview</p>
                  <p className="text-sm">{launchResult.error}</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {!launchResult && (
            <>
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                disabled={isLaunching}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleLaunchInterview}
                disabled={isLaunching}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLaunching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Launch Interview
                  </>
                )}
              </Button>
            </>
          )}

          {launchResult && (
            <Button 
              onClick={resetDialog}
              variant={launchResult.success ? "default" : "outline"}
            >
              {launchResult.success ? "Done" : "Try Again"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

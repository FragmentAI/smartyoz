import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Jobs from "@/pages/jobs";
import Candidates from "@/pages/candidates";

import BulkHire from "@/pages/bulk-hire";
import BulkResults from "@/pages/BulkResults";
import Calendar from "@/pages/calendar";
import Results from "@/pages/results";
import InterviewScheduling from "@/pages/interview-scheduling-new";
import Settings from "@/pages/settings";
import SmartAssist from "@/pages/smart-assist";
import CandidateScheduling from "@/pages/candidate-scheduling";
import AIInterview from "@/pages/ai-interview";
import AIVideoInterview from "@/pages/AIVideoInterview";
import InterviewScheduler from "@/pages/InterviewScheduler";
import InterviewLanding from "@/pages/InterviewLanding";
import InterviewComplete from "@/pages/InterviewComplete";
import InterviewLauncher from "@/pages/InterviewLauncher";
import EvaluationDetails from "@/pages/EvaluationDetails";
import CandidateScreening from "@/pages/candidate-screening";
import DriveRegistration from "@/pages/drive-registration";
import DriveTest from "@/pages/drive-test";


function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Candidate-facing routes (no auth required) */}
      <Route path="/candidate/schedule" component={CandidateScheduling} />
      <Route path="/candidate/interview" component={AIInterview} />
      <Route path="/candidate-screening" component={CandidateScreening} />
      <Route path="/screening" component={CandidateScreening} />
      <Route path="/drive/register/:token" component={DriveRegistration} />
      <Route path="/drive/test/:token" component={DriveTest} />
      
      {/* Development tool routes (no auth required) */}
      <Route path="/interview-launcher" component={InterviewLauncher} />
      
      {/* HR-facing routes (auth required) */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/jobs" component={Jobs} />
          <Route path="/candidates" component={Candidates} />

          <Route path="/interviews" component={InterviewScheduling} />
          <Route path="/bulk-hire" component={BulkHire} />
          <Route path="/bulk-results/:id" component={BulkResults} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/results" component={Results} />
          <Route path="/evaluation/:id" component={EvaluationDetails} />

          <Route path="/settings" component={Settings} />
          <Route path="/smart-assist" component={SmartAssist} />
        </>
      )}
      {/* Public interview routes - no auth required */}
      <Route path="/interview/complete" component={InterviewComplete} />
      <Route path="/interview/schedule/:token" component={InterviewScheduler} />
      <Route path="/interview/:token/session" component={AIVideoInterview} />
      <Route path="/interview/:token" component={InterviewLanding} />
      <Route path="/interview-session/:interviewId">
        {(params) => {
          const InterviewerInterface = React.lazy(() => import("./pages/interviewer-candidate-interface"));
          return <InterviewerInterface />;
        }}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

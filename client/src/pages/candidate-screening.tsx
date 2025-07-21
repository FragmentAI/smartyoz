import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Building2, MapPin, DollarSign, Calendar, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Form validation schema
const screeningFormSchema = z.object({
  yearsOfExperience: z.string().min(1, "Experience is required"),
  currentSalary: z.string().optional(),
  expectedSalary: z.string().min(1, "Expected salary is required"),
  availableToStart: z.string().min(1, "Start date is required"),
  willingToRelocate: z.boolean(),
  hasRequiredSkills: z.boolean(),
  additionalQuestions: z.record(z.string(), z.string()).optional(),
});

type ScreeningFormData = z.infer<typeof screeningFormSchema>;

interface ScreeningTokenData {
  id: number;
  token: string;
  status: string;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
  };
  job: {
    title: string;
    department: string;
    location: string;
    description: string;
    requirements: string;
    salaryMin?: number;
    salaryMax?: number;
    experienceLevel: string;
  };
  responses?: string;
  expiresAt: string;
}

export default function CandidateScreening() {
  const [location, navigate] = useLocation();
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  
  // Extract token from URL - use window.location.search instead
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  


  // Fetch screening token data
  const { data: tokenData, isLoading, error } = useQuery<ScreeningTokenData>({
    queryKey: [`/api/screening/verify/${token}`],
    enabled: !!token,
    retry: false,
  });

  const form = useForm<ScreeningFormData>({
    resolver: zodResolver(screeningFormSchema),
    defaultValues: {
      yearsOfExperience: "",
      currentSalary: "",
      expectedSalary: "",
      availableToStart: "",
      willingToRelocate: false,
      hasRequiredSkills: false,
      additionalQuestions: {},
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: ScreeningFormData) => {
      return apiRequest('POST', `/api/screening/submit/${token}`, data);
    },
    onSuccess: () => {
      setSubmissionStatus('success');
      setMessage('Thank you for submitting your screening responses. We will review your application and contact you soon.');
    },
    onError: (error: any) => {
      setSubmissionStatus('error');
      setMessage(error.message || 'An error occurred while submitting your responses. Please try again.');
    },
  });

  const onSubmit = (data: ScreeningFormData) => {
    setSubmissionStatus('submitting');
    submitMutation.mutate(data);
  };

  // Show loading state
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
              <p className="text-gray-600">This screening link is invalid or has expired.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
              <p className="text-gray-600">Verifying your screening link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !tokenData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Link Expired</h2>
              <p className="text-gray-600">This screening link has expired or is no longer valid.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show completion status
  if (tokenData.status === 'completed' || submissionStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Screening Completed</h2>
              <p className="text-gray-600">{message || 'You have already completed this screening. Thank you for your submission.'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { job, candidate } = tokenData;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Application Screening</h1>
          <p className="text-lg text-gray-600">Complete your application for the {job.title} position</p>
        </div>

        {/* Job Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900">{job.title}</h3>
                <p className="text-gray-600">{job.department}</p>
              </div>
              <div className="space-y-2">
                {job.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </div>
                )}
                {(job.salaryMin || job.salaryMax) && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <DollarSign className="w-4 h-4" />
                    {job.salaryMin && job.salaryMax 
                      ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                      : job.salaryMin 
                        ? `From $${job.salaryMin.toLocaleString()}`
                        : `Up to $${job.salaryMax?.toLocaleString()}`}
                  </div>
                )}
                <Badge variant="secondary">{job.experienceLevel}</Badge>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
              <p className="text-gray-600 text-sm">{job.description}</p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
              <p className="text-gray-600 text-sm">{job.requirements}</p>
            </div>
          </CardContent>
        </Card>

        {/* Screening Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Screening Questions
            </CardTitle>
            <p className="text-sm text-gray-600">Please answer the following questions to help us evaluate your application.</p>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Years of Experience */}
                <FormField
                  control={form.control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of relevant experience *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your experience level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0-1">0-1 years</SelectItem>
                          <SelectItem value="2-3">2-3 years</SelectItem>
                          <SelectItem value="4-5">4-5 years</SelectItem>
                          <SelectItem value="6-8">6-8 years</SelectItem>
                          <SelectItem value="9-12">9-12 years</SelectItem>
                          <SelectItem value="13+">13+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Current Salary */}
                <FormField
                  control={form.control}
                  name="currentSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current salary (optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., 75000" 
                          type="number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Expected Salary */}
                <FormField
                  control={form.control}
                  name="expectedSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expected salary *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., 85000" 
                          type="number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Available to Start */}
                <FormField
                  control={form.control}
                  name="availableToStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>When can you start? *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your availability" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="immediately">Immediately</SelectItem>
                          <SelectItem value="1-2-weeks">1-2 weeks</SelectItem>
                          <SelectItem value="3-4-weeks">3-4 weeks</SelectItem>
                          <SelectItem value="1-2-months">1-2 months</SelectItem>
                          <SelectItem value="3+ months">3+ months</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Willing to Relocate */}
                <FormField
                  control={form.control}
                  name="willingToRelocate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Are you willing to relocate for this position?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Has Required Skills */}
                <FormField
                  control={form.control}
                  name="hasRequiredSkills"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={(checked) => field.onChange(checked)}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          I have the required skills and experience listed in the job requirements
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="pt-6">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submissionStatus === 'submitting'}
                  >
                    {submissionStatus === 'submitting' ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Screening Form'
                    )}
                  </Button>
                </div>

                {/* Error Message */}
                {submissionStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm">{message}</p>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>This screening form is confidential and will only be used for evaluation purposes.</p>
        </div>
      </div>
    </div>
  );
}
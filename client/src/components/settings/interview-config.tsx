import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Brain, Clock, Users, Settings, Code, MessageSquare, Target, Play } from "lucide-react";

const interviewConfigSchema = z.object({
  jobId: z.number(),
  duration: z.number().min(10).max(120).optional(),
  totalQuestions: z.number().min(3).max(20).optional(),
  avatarType: z.enum(['professional', 'friendly', 'technical']).optional(),
  experienceLevel: z.enum(['junior', 'intermediate', 'senior', 'expert']).optional(),
  passingScore: z.number().min(50).max(100).optional(),
  difficultyProgression: z.enum(['adaptive', 'linear', 'random']).optional(),
  followUpStyle: z.enum(['brief', 'detailed', 'probing']).optional(),
  interviewStyle: z.enum(['formal', 'conversational', 'technical']).optional(),
  recordingEnabled: z.boolean().optional(),
  allowRetake: z.boolean().optional(),
  screenSharingRequired: z.boolean().optional(),
  codingChallengeEnabled: z.boolean().optional(),
  whiteboard: z.boolean().optional(),
  customQuestions: z.array(z.string()).nullable().default([]).transform(val => val || []),
  technicalQuestions: z.array(z.string()).nullable().default([]).transform(val => val || []),
  behavioralQuestions: z.array(z.string()).nullable().default([]).transform(val => val || []),
  situationalQuestions: z.array(z.string()).nullable().default([]).transform(val => val || []),
  techStack: z.array(z.string()).nullable().default([]).transform(val => val || []),
  programmingLanguages: z.array(z.string()).nullable().default([]).transform(val => val || []),
  frameworks: z.array(z.string()).nullable().default([]).transform(val => val || []),
  tools: z.array(z.string()).nullable().default([]).transform(val => val || []),
  methodologies: z.array(z.string()).nullable().default([]).transform(val => val || []),
  industryExperience: z.array(z.string()).nullable().default([]).transform(val => val || []),
  projectTypes: z.array(z.string()).nullable().default([]).transform(val => val || []),
  evaluationCriteria: z.array(z.string()).nullable().default([]).transform(val => val || []),
  warmupQuestions: z.array(z.string()).nullable().default([]).transform(val => val || []),
  introductionMessage: z.string().nullable().optional().transform(val => val || undefined),
  closingMessage: z.string().nullable().optional().transform(val => val || undefined),
  skillWeights: z.record(z.string(), z.number()).nullable().optional().transform(val => val || undefined),
});

type InterviewConfig = z.infer<typeof interviewConfigSchema>;

interface Job {
  jobId: number;
  jobTitle: string;
  department: string;
  config: InterviewConfig | null;
}

function TagInput({ value, onChange, placeholder }: { value: string[], onChange: (value: string[]) => void, placeholder: string }) {
  const [inputValue, setInputValue] = useState("");

  const addTag = () => {
    if (inputValue.trim() && !value.includes(inputValue.trim())) {
      onChange([...value, inputValue.trim()]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag, index) => (
          <Badge key={index} variant="secondary" className="px-2 py-1">
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SkillWeightSlider({ value, onChange }: { value: Record<string, number>, onChange: (value: Record<string, number>) => void }) {
  const skills = ['technical', 'communication', 'problemSolving', 'cultural'];
  
  const updateWeight = (skill: string, weight: number) => {
    const newWeights = { ...value, [skill]: weight };
    
    // Ensure weights add up to 100
    const total = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    if (total !== 100) {
      // Adjust other weights proportionally
      const remaining = 100 - weight;
      const otherSkills = skills.filter(s => s !== skill);
      const otherTotal = otherSkills.reduce((sum, s) => sum + (value[s] || 0), 0);
      
      if (otherTotal > 0) {
        otherSkills.forEach(s => {
          newWeights[s] = Math.round((value[s] || 0) * remaining / otherTotal);
        });
      }
    }
    
    onChange(newWeights);
  };

  return (
    <div className="space-y-4">
      {skills.map(skill => (
        <div key={skill} className="space-y-2">
          <div className="flex justify-between">
            <Label className="capitalize">{skill.replace(/([A-Z])/g, ' $1')}</Label>
            <span className="text-sm text-muted-foreground">{value[skill] || 0}%</span>
          </div>
          <Slider
            value={[value[skill] || 0]}
            onValueChange={([newValue]) => updateWeight(skill, newValue)}
            max={100}
            step={5}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}

export function InterviewConfiguration() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs, isLoading: jobsLoading, error: jobsError } = useQuery({
    queryKey: ['/api/jobs'],
    queryFn: async () => {
      const response = await fetch('/api/jobs', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const jobsData = await response.json();
      // Transform jobs data to match expected interface
      return jobsData.map((job: any) => ({
        jobId: job.id,
        jobTitle: job.title,
        department: job.department,
        config: null
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['/api/admin/interview-configs', selectedJobId],
    queryFn: async () => {
      if (!selectedJobId) return null;
      const response = await fetch(`/api/admin/interview-configs/${selectedJobId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        // If config doesn't exist, return null to use defaults
        if (response.status === 404) return null;
        throw new Error('Failed to fetch config');
      }
      return response.json() as Promise<InterviewConfig>;
    },
    enabled: !!selectedJobId
  });

  const form = useForm<InterviewConfig>({
    resolver: zodResolver(interviewConfigSchema),
    defaultValues: {
      duration: 30,
      totalQuestions: 8,
      avatarType: 'professional',
      experienceLevel: 'intermediate',
      passingScore: 70,
      difficultyProgression: 'adaptive',
      followUpStyle: 'detailed',
      interviewStyle: 'conversational',
      recordingEnabled: true,
      allowRetake: false,
      screenSharingRequired: false,
      codingChallengeEnabled: false,
      whiteboard: false,
      customQuestions: [],
      technicalQuestions: [],
      behavioralQuestions: [],
      situationalQuestions: [],
      techStack: [],
      programmingLanguages: [],
      frameworks: [],
      tools: [],
      methodologies: [],
      industryExperience: [],
      projectTypes: [],
      evaluationCriteria: [],
      warmupQuestions: [],
      skillWeights: {
        technical: 40,
        communication: 30,
        problemSolving: 20,
        cultural: 10
      }
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: InterviewConfig) => {
      const response = await fetch(`/api/admin/interview-configs/${selectedJobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save configuration');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Interview configuration saved successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/interview-configs'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save interview configuration", variant: "destructive" });
    }
  });

  useEffect(() => {
    if (config && selectedJobId) {
      // Transform null values to empty arrays/undefined for form
      const cleanConfig = {
        ...config,
        jobId: selectedJobId,
        customQuestions: config.customQuestions || [],
        technicalQuestions: config.technicalQuestions || [],
        behavioralQuestions: config.behavioralQuestions || [],
        situationalQuestions: config.situationalQuestions || [],
        techStack: config.techStack || [],
        programmingLanguages: config.programmingLanguages || [],
        frameworks: config.frameworks || [],
        tools: config.tools || [],
        methodologies: config.methodologies || [],
        industryExperience: config.industryExperience || [],
        projectTypes: config.projectTypes || [],
        evaluationCriteria: config.evaluationCriteria || [],
        warmupQuestions: config.warmupQuestions || [],
        introductionMessage: config.introductionMessage || undefined,
        closingMessage: config.closingMessage || undefined,
        skillWeights: config.skillWeights || undefined
      };
      form.reset(cleanConfig);
    }
  }, [config, selectedJobId, form]);

  const onSubmit = (data: InterviewConfig) => {
    if (!selectedJobId) return;
    
    // Filter out empty arrays and undefined values for cleaner submission
    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => {
        if (Array.isArray(value)) {
          return value.length > 0;
        }
        return value !== undefined && value !== null && value !== '';
      })
    );
    
    saveMutation.mutate({ ...cleanedData, jobId: selectedJobId });
  };

  if (jobsLoading) {
    return <div className="p-6">Loading jobs...</div>;
  }

  if (jobsError) {
    return <div className="p-6 text-red-600">Error loading jobs: {(jobsError as Error).message}</div>;
  }



  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Interview Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Configure AI interview settings for each job position
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Select Job Position
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/jobs'] })}
              disabled={jobsLoading}
            >
              {jobsLoading ? 'Loading...' : 'Refresh Jobs'}
            </Button>
          </CardTitle>
          <CardDescription>
            Choose a job position to configure interview settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedJobId?.toString() || ""}
            onValueChange={(value) => setSelectedJobId(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a job position" />
            </SelectTrigger>
            <SelectContent>
              {jobs && jobs.length > 0 ? (
                jobs.filter(job => job?.jobId)?.map((job: Job) => (
                  <SelectItem key={job.jobId} value={job.jobId.toString()}>
                    <div className="flex flex-col">
                      <span>{job.jobTitle}</span>
                      <span className="text-xs text-muted-foreground">{job.department}</span>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-jobs" disabled>
                  No jobs available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedJobId && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="questions" className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Questions
                </TabsTrigger>
                <TabsTrigger value="technical" className="flex items-center gap-1">
                  <Code className="h-4 w-4" />
                  Technical
                </TabsTrigger>
                <TabsTrigger value="evaluation" className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  Evaluation
                </TabsTrigger>
                <TabsTrigger value="behavior" className="flex items-center gap-1">
                  <Brain className="h-4 w-4" />
                  AI Behavior
                </TabsTrigger>
                <TabsTrigger value="features" className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  Features
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Interview Settings</CardTitle>
                    <CardDescription>Configure core interview parameters</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="totalQuestions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Questions</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="passingScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Passing Score (%)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="avatarType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Avatar Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="friendly">Friendly</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="experienceLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Experience Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="junior">Junior</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="senior">Senior</SelectItem>
                                <SelectItem value="expert">Expert</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Custom Messages</Label>
                      <FormField
                        control={form.control}
                        name="introductionMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Introduction Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Welcome message for candidates (optional)"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Custom greeting message shown to candidates at the start
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="closingMessage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Closing Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Thank you message for candidates (optional)"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Custom closing message shown at the end of the interview
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="questions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Question Configuration</CardTitle>
                    <CardDescription>Define custom questions for different categories</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="customQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority Questions</FormLabel>
                          <FormControl>
                            <TagInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Add high-priority questions..."
                            />
                          </FormControl>
                          <FormDescription>
                            These questions will be prioritized by the AI interviewer
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="technicalQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Technical Questions</FormLabel>
                          <FormControl>
                            <TagInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Add technical questions..."
                            />
                          </FormControl>
                          <FormDescription>
                            Questions focused on technical skills and knowledge
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="behavioralQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Behavioral Questions</FormLabel>
                          <FormControl>
                            <TagInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Add behavioral questions..."
                            />
                          </FormControl>
                          <FormDescription>
                            Questions about past experiences and behavior patterns
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="situationalQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Situational Questions</FormLabel>
                          <FormControl>
                            <TagInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Add situational questions..."
                            />
                          </FormControl>
                          <FormDescription>
                            Hypothetical scenarios and problem-solving questions
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="warmupQuestions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warmup Questions</FormLabel>
                          <FormControl>
                            <TagInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Add icebreaker questions..."
                            />
                          </FormControl>
                          <FormDescription>
                            Light questions to help candidates feel comfortable
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="technical" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Technical Focus Areas</CardTitle>
                    <CardDescription>Specify technologies and skills to focus on</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="techStack"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Technology Stack</FormLabel>
                            <FormControl>
                              <TagInput
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Add technologies..."
                              />
                            </FormControl>
                            <FormDescription>
                              Core technologies for this role
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="programmingLanguages"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Programming Languages</FormLabel>
                            <FormControl>
                              <TagInput
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Add languages..."
                              />
                            </FormControl>
                            <FormDescription>
                              Required programming languages
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="frameworks"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Frameworks</FormLabel>
                            <FormControl>
                              <TagInput
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Add frameworks..."
                              />
                            </FormControl>
                            <FormDescription>
                              Frameworks and libraries
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tools"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tools & Platforms</FormLabel>
                            <FormControl>
                              <TagInput
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Add tools..."
                              />
                            </FormControl>
                            <FormDescription>
                              Development tools and platforms
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="methodologies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Methodologies</FormLabel>
                            <FormControl>
                              <TagInput
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Add methodologies..."
                              />
                            </FormControl>
                            <FormDescription>
                              Development methodologies (Agile, DevOps, etc.)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="projectTypes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Types</FormLabel>
                            <FormControl>
                              <TagInput
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Add project types..."
                              />
                            </FormControl>
                            <FormDescription>
                              Types of projects to discuss
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="industryExperience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Industry Experience</FormLabel>
                          <FormControl>
                            <TagInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Add industry sectors..."
                            />
                          </FormControl>
                          <FormDescription>
                            Relevant industry experience areas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evaluation" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Evaluation Criteria</CardTitle>
                    <CardDescription>Configure how candidates will be assessed</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="evaluationCriteria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Evaluation Criteria</FormLabel>
                          <FormControl>
                            <TagInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Add evaluation criteria..."
                            />
                          </FormControl>
                          <FormDescription>
                            Key criteria for candidate evaluation
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-4">
                      <Label className="text-base font-medium">Skill Weights Distribution</Label>
                      <FormField
                        control={form.control}
                        name="skillWeights"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <SkillWeightSlider
                                value={field.value || { technical: 40, communication: 30, problemSolving: 20, cultural: 10 }}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <FormDescription>
                              Adjust the importance of different skill areas (must total 100%)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="behavior" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Interviewer Behavior</CardTitle>
                    <CardDescription>Configure how the AI conducts interviews</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="difficultyProgression"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty Progression</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="adaptive">Adaptive</SelectItem>
                                <SelectItem value="linear">Linear</SelectItem>
                                <SelectItem value="random">Random</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              How question difficulty changes
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="followUpStyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Follow-up Style</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="brief">Brief</SelectItem>
                                <SelectItem value="detailed">Detailed</SelectItem>
                                <SelectItem value="probing">Probing</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Style of follow-up questions
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="interviewStyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interview Style</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="formal">Formal</SelectItem>
                                <SelectItem value="conversational">Conversational</SelectItem>
                                <SelectItem value="technical">Technical</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Overall interview tone and style
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Interview Features</CardTitle>
                    <CardDescription>Enable or disable specific interview features</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <Label className="text-base font-medium">Recording & Documentation</Label>
                        <FormField
                          control={form.control}
                          name="recordingEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Video Recording</FormLabel>
                                <FormDescription>
                                  Record interview sessions for review
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="allowRetake"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Allow Retakes</FormLabel>
                                <FormDescription>
                                  Let candidates retake the interview
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-base font-medium">Technical Features</Label>
                        <FormField
                          control={form.control}
                          name="screenSharingRequired"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Screen Sharing</FormLabel>
                                <FormDescription>
                                  Require candidates to share their screen
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="codingChallengeEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Coding Challenge</FormLabel>
                                <FormDescription>
                                  Include live coding exercises
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="whiteboard"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base">Whiteboard</FormLabel>
                                <FormDescription>
                                  Provide digital whiteboard for drawings
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedJobId(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveMutation.isPending || configLoading}>
                {saveMutation.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
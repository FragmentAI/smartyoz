import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { clientJobSchema, type ClientJob } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";
import { FormDescription } from "@/components/ui/form";
import { Wand2, Loader2 } from "lucide-react";
import * as z from "zod";

interface CreateJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateJobDialog({ open, onOpenChange }: CreateJobDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingJD, setIsGeneratingJD] = useState(false);
  
  const form = useForm<ClientJob>({
    resolver: zodResolver(clientJobSchema),
    defaultValues: {
      title: "",
      department: "",
      description: "",
      requirements: "",
      benefits: "",
      skills: "",
      experienceLevel: "Mid",
      location: "",
      salaryMin: undefined,
      salaryMax: undefined,
      positions: 1,
      workType: "remote",
      status: "draft",
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: ClientJob) => {
      return await apiRequest("POST", "/api/jobs", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({
        title: "Success",
        description: "Job created successfully",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create job",
        variant: "destructive",
      });
    },
  });

  const generateJDMutation = useMutation({
    mutationFn: async (jobData: any) => {
      return apiRequest("POST", "/api/jobs/generate-jd", jobData);
    },
    onSuccess: async (response) => {
      try {
        // Parse the response if it's a Response object
        const data = response instanceof Response ? await response.json() : response;
        const { description, requirements, benefits } = data;
        
        if (description) {
          form.setValue("description", description);
        }
        if (requirements) {
          form.setValue("requirements", requirements);
        }
        if (benefits) {
          form.setValue("benefits", benefits);
        }
        
        toast({
          title: "Job Description Generated",
          description: "AI has generated the job description. You can edit it as needed.",
        });
      } catch (error) {
        console.error("Error parsing response:", error);
        toast({
          title: "Generation Error",
          description: "Failed to parse the generated content.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate job description",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGeneratingJD(false);
    },
  });

  const onSubmit = (data: ClientJob) => {
    console.log("Form submitted with data:", data);
    // The createdBy field will be set by the server using the authenticated user's ID
    createJobMutation.mutate(data);
  };

  const handleGenerateJD = () => {
    const currentValues = form.getValues();
    
    // Check if required fields are filled for AI generation
    if (!currentValues.title || !currentValues.department || !currentValues.skills) {
      toast({
        title: "Missing Information",
        description: "Please fill in job title, department, and required skills before generating JD.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingJD(true);
    generateJDMutation.mutate({
      title: currentValues.title,
      department: currentValues.department,
      workType: currentValues.workType,
      experienceLevel: currentValues.experienceLevel,
      skills: currentValues.skills,
      location: currentValues.location,
      salaryMin: currentValues.salaryMin,
      salaryMax: currentValues.salaryMax,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Job</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Design">Design</SelectItem>
                      <SelectItem value="Data">Data</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="positions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Positions</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="workType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="remote">Remote</SelectItem>
                        <SelectItem value="onsite">On-site</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Entry">Entry Level</SelectItem>
                        <SelectItem value="Mid">Mid Level</SelectItem>
                        <SelectItem value="Senior">Senior Level</SelectItem>
                        <SelectItem value="Lead">Lead/Principal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. San Francisco, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="salaryMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Salary (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="salaryMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Salary (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="skills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Required Skills * (Required for AI Generation)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List the key skills and technologies required (e.g., React, Node.js, Python, AWS...)"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    List the essential skills, technologies, and qualifications. This field is mandatory for AI job description generation.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Job Description *</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateJD}
                      disabled={isGeneratingJD || generateJDMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      {isGeneratingJD || generateJDMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      {isGeneratingJD || generateJDMutation.isPending ? "Generating..." : "Generate with AI"}
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe the role, responsibilities, and what makes this position unique... (or click 'Generate with AI' to auto-create)"
                      rows={6}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter job requirements... (will be auto-filled if using AI generation)"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="benefits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Benefits (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter benefits and what the company offers... (will be auto-filled if using AI generation)"
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createJobMutation.isPending}
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Create Job button clicked");
                  console.log("Form errors:", form.formState.errors);
                  form.handleSubmit(onSubmit)();
                }}
              >
                {createJobMutation.isPending ? "Creating..." : "Create Job"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

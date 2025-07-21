import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCandidateSchema, type InsertCandidate, type Job } from "@shared/schema";
import { isUnauthorizedError } from "@/lib/authUtils";

interface AddCandidateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobs: Job[];
}

export default function AddCandidateDialog({ open, onOpenChange, jobs }: AddCandidateDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const form = useForm<InsertCandidate & { selectedJobId?: number }>({
    resolver: zodResolver(insertCandidateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      skills: [],
      experience: undefined,
      location: "",
      locationPreference: "",
      currentCTC: undefined,
      expectedCTC: undefined,
      selectedJobId: undefined,
    },
  });

  const addCandidateMutation = useMutation({
    mutationFn: async (data: InsertCandidate & { resume?: File; selectedJobId?: number }) => {
      const formData = new FormData();
      
      // Append all candidate fields
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'resume') return; // Handle file separately
        if (key === 'skills' && Array.isArray(value)) {
          formData.append(key, value.join(','));
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Append resume file if selected
      if (selectedFile) {
        formData.append('resume', selectedFile);
      }

      const response = await fetch('/api/candidates', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`${response.status}: ${text}`);
      }

      const candidateResult = await response.json();
      
      // Application creation is now handled on the server side
      console.log("Candidate creation completed. Server handled application creation if job was selected.");
      
      return candidateResult;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      
      const jobSelected = variables.selectedJobId;
      toast({
        title: "Success",
        description: jobSelected 
          ? "Candidate added and matched to job successfully" 
          : "Candidate added successfully",
      });
      form.reset();
      setSelectedFile(null);
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
      
      // Show specific error message from server
      const errorMessage = error.message.includes("already exists") 
        ? "A candidate with this email address already exists"
        : "Failed to add candidate";
        
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCandidate & { selectedJobId?: number }) => {
    console.log("Form submitted with data:", data);
    console.log("Selected job ID:", data.selectedJobId);
    console.log("Has selected file:", !!selectedFile);
    addCandidateMutation.mutate({ ...data, resume: selectedFile || undefined });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.smith@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 (555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience (Years)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        placeholder="5"
                        {...field} 
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="New York, NY" {...field} />
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
                  <FormLabel>Skills (comma-separated)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="JavaScript, React, Node.js"
                      {...field}
                      value={field.value ? (Array.isArray(field.value) ? field.value.join(', ') : field.value) : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="selectedJobId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match to Job (Optional)</FormLabel>
                  <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : parseInt(value))} value={field.value?.toString() || "none"}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a job to match this candidate" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No job matching</SelectItem>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id.toString()}>
                          {job.title} - {job.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Resume</label>
              <Input 
                type="file" 
                accept=".pdf,.doc,.docx"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
            </div>

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
                disabled={addCandidateMutation.isPending}
              >
                {addCandidateMutation.isPending ? "Adding..." : "Add Candidate"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

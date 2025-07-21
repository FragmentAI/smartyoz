import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Globe2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Linkedin,
  Send,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Briefcase
} from "lucide-react";
import { Job, JobPlatformConfig, JobPlatformPosting } from "@shared/schema";

const postingSchema = z.object({
  selectedPlatforms: z.array(z.number()).min(1, "Select at least one platform"),
  customTitle: z.string().optional(),
  customDescription: z.string().optional(),
  salaryRange: z.string().optional(),
  location: z.string().optional(),
  jobType: z.string().optional(),
  expiryDays: z.number().min(1).max(90).default(30),
});

type PostingForm = z.infer<typeof postingSchema>;

interface PlatformPostingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

export default function PlatformPostingDialog({ open, onOpenChange, job }: PlatformPostingDialogProps) {
  const { toast } = useToast();
  const [selectedPlatforms, setSelectedPlatforms] = useState<number[]>([]);

  const { data: platformConfigs = [] } = useQuery<JobPlatformConfig[]>({
    queryKey: ["/api/platform-configs"],
    enabled: open,
  });

  const { data: existingPostings = [] } = useQuery<JobPlatformPosting[]>({
    queryKey: ["/api/job-postings", job?.id],
    enabled: open && !!job,
  });

  const activePlatforms = platformConfigs.filter(config => 
    config.isActive && config.connectionStatus === 'connected'
  );

  const postJobMutation = useMutation({
    mutationFn: (data: PostingForm) =>
      apiRequest("/api/jobs/post-to-platforms", {
        method: "POST",
        body: JSON.stringify({
          jobId: job!.id,
          platformConfigIds: data.selectedPlatforms,
          customizations: {
            title: data.customTitle,
            description: data.customDescription,
            salaryRange: data.salaryRange,
            location: data.location,
            jobType: data.jobType,
            expiryDays: data.expiryDays,
          }
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings"] });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Job posted to selected platforms successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to post job to platforms",
        variant: "destructive",
      });
    },
  });

  const form = useForm<PostingForm>({
    resolver: zodResolver(postingSchema),
    defaultValues: {
      selectedPlatforms: activePlatforms.map(p => p.id),
      customTitle: job?.title || "",
      customDescription: job?.description || "",
      salaryRange: "",
      location: "",
      jobType: job?.workType || "",
      expiryDays: 30,
    },
  });

  const onSubmit = (data: PostingForm) => {
    postJobMutation.mutate(data);
  };

  const handlePlatformToggle = (platformId: number, checked: boolean) => {
    const current = form.getValues("selectedPlatforms");
    if (checked) {
      form.setValue("selectedPlatforms", [...current, platformId]);
    } else {
      form.setValue("selectedPlatforms", current.filter(id => id !== platformId));
    }
  };

  const getPlatformIcon = (platformName: string) => {
    switch (platformName) {
      case "linkedin": return Linkedin;
      default: return Globe2;
    }
  };

  const getPostingStatus = (platformId: number) => {
    const posting = existingPostings.find(p => p.platformConfigId === platformId);
    if (!posting) return { status: "not_posted", label: "Not Posted", color: "text-gray-500" };
    
    switch (posting.status) {
      case "posted":
        return { status: "posted", label: "Posted", color: "text-green-500" };
      case "pending":
        return { status: "pending", label: "Pending", color: "text-yellow-500" };
      case "failed":
        return { status: "failed", label: "Failed", color: "text-red-500" };
      default:
        return { status: "unknown", label: "Unknown", color: "text-gray-500" };
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            Post Job to Platforms
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Job Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Title</p>
                    <p className="font-medium">{job.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium">{job.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Work Type</p>
                    <p className="font-medium capitalize">{job.workType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Positions</p>
                    <p className="font-medium">{job.positions}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Platform Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Select Platforms</CardTitle>
                </CardHeader>
                <CardContent>
                  {activePlatforms.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Platforms</h3>
                      <p className="text-gray-500">
                        Configure and connect job platforms to start posting jobs
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activePlatforms.map((platform) => {
                        const Icon = getPlatformIcon(platform.platformName);
                        const postingStatus = getPostingStatus(platform.id);
                        const isSelected = form.watch("selectedPlatforms").includes(platform.id);

                        return (
                          <Card key={platform.id} className={`cursor-pointer transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : ''}`}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => handlePlatformToggle(platform.id, checked as boolean)}
                                  />
                                  <Icon className="w-6 h-6 text-gray-600" />
                                  <div>
                                    <h4 className="font-medium">{platform.displayName}</h4>
                                    <p className="text-sm text-gray-500">{platform.platformName}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="outline" className={postingStatus.color}>
                                    {postingStatus.label}
                                  </Badge>
                                  {postingStatus.status === "posted" && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      <ExternalLink className="w-3 h-3 inline mr-1" />
                                      View Post
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customization Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Customize Job Posting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Title (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Override job title for platforms" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="salaryRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary Range</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., $50,000 - $70,000" />
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
                            <Input {...field} placeholder="e.g., New York, NY" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expiryDays"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Posting Duration (Days)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1" 
                              max="90"
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Override job description for platforms"
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={postJobMutation.isPending || form.watch("selectedPlatforms").length === 0}
                >
                  {postJobMutation.isPending ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Posting Job...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Post to {form.watch("selectedPlatforms").length} Platform{form.watch("selectedPlatforms").length !== 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
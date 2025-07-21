import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link, Copy } from "lucide-react";

interface GenerateInterviewLinkProps {
  applicationId: number;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
}

export default function GenerateInterviewLink({ 
  applicationId, 
  candidateName, 
  candidateEmail, 
  jobTitle 
}: GenerateInterviewLinkProps) {
  const [open, setOpen] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateLinkMutation = useMutation({
    mutationFn: async (data: { 
      applicationId: number; 
      candidateEmail: string;
      customMessage?: string;
    }) => {
      return await apiRequest(`/api/interview-tokens`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: (data) => {
      const link = `${window.location.origin}/candidate/schedule?token=${data.token}`;
      setGeneratedLink(link);
      toast({
        title: "Interview link generated",
        description: "Email sent to candidate with scheduling instructions",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate interview link",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast({
        title: "Copied",
        description: "Interview link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const customMessage = formData.get("customMessage") as string;

    generateLinkMutation.mutate({
      applicationId,
      candidateEmail,
      customMessage: customMessage || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="default">
          <Link className="h-4 w-4 mr-2" />
          Generate Interview Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Interview Link</DialogTitle>
          <DialogDescription>
            Send an AI interview scheduling link to {candidateName} for the {jobTitle} position.
          </DialogDescription>
        </DialogHeader>
        
        {!generatedLink ? (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="candidateName" className="text-right">
                  Candidate
                </Label>
                <Input
                  id="candidateName"
                  value={candidateName}
                  className="col-span-3"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="candidateEmail" className="text-right">
                  Email
                </Label>
                <Input
                  id="candidateEmail"
                  value={candidateEmail}
                  className="col-span-3"
                  disabled
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customMessage" className="text-right">
                  Custom Message
                </Label>
                <Textarea
                  id="customMessage"
                  name="customMessage"
                  placeholder="Optional custom message to include in the email..."
                  className="col-span-3"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={generateLinkMutation.isPending}>
                {generateLinkMutation.isPending ? "Generating..." : "Generate & Send Email"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Generated Interview Link</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                An email with this link has been sent to {candidateEmail}. The candidate has 7 days to schedule and complete their AI interview.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
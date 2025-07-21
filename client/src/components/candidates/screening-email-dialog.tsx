import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Candidate } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ScreeningEmailDialogProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ScreeningEmailDialog({
  candidate,
  open,
  onOpenChange
}: ScreeningEmailDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendEmailMutation = useMutation({
    mutationFn: async (emailData: any) => {
      return apiRequest("POST", "/api/candidates/send-screening-form", emailData);
    },
    onSuccess: () => {
      toast({
        title: "Screening Form Sent",
        description: "Screening form link has been sent to the candidate successfully.",
      });
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send screening form",
        variant: "destructive",
      });
    },
  });



  const handleSendEmail = () => {
    if (!candidate) return;

    sendEmailMutation.mutate({
      candidateId: candidate.id,
    });
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="screening-email-description">
        <DialogHeader>
          <DialogTitle>
            Send Automated Screening Form
          </DialogTitle>
        </DialogHeader>

        <div id="screening-email-description" className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Automated Screening Process</h3>
            <p className="text-sm text-blue-700">
              This will send a professional screening form link to {candidate.firstName} {candidate.lastName}. 
              The candidate will complete the form online, and the system will automatically evaluate their responses 
              and send either an interview invitation or rejection email.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-base font-medium">Candidate Information:</Label>
            <div className="p-3 bg-gray-50 rounded border">
              <p><strong>Name:</strong> {candidate.firstName} {candidate.lastName}</p>
              <p><strong>Email:</strong> {candidate.email}</p>
              {candidate.phone && <p><strong>Phone:</strong> {candidate.phone}</p>}
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">What happens next:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Candidate receives an email with a secure screening form link</li>
              <li>• They complete questions about experience, salary expectations, and availability</li>
              <li>• System automatically evaluates responses against job requirements</li>
              <li>• Qualified candidates receive interview scheduling emails</li>
              <li>• Non-qualified candidates receive professional rejection emails</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sendEmailMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={sendEmailMutation.isPending}
          >
            {sendEmailMutation.isPending ? "Sending..." : "Send Screening Form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Calendar, FileText, Star } from "lucide-react";
import { Candidate } from "@shared/schema";

interface CandidateDetailsDialogProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmail: (candidate: Candidate) => void;
  onSchedule: (candidate: Candidate) => void;
}

export default function CandidateDetailsDialog({
  candidate,
  open,
  onOpenChange,
  onEmail,
  onSchedule
}: CandidateDetailsDialogProps) {
  if (!candidate) return null;

  const skills = candidate.skills ? (Array.isArray(candidate.skills) ? candidate.skills : candidate.skills.split(',').map(s => s.trim())) : [];
  const experience = candidate.experience || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="candidate-details-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-lg">
                {candidate.firstName[0]}{candidate.lastName[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{candidate.firstName} {candidate.lastName}</h2>
              <p className="text-gray-600">{candidate.position || 'Position not specified'}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div id="candidate-details-description" className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{candidate.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{candidate.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{candidate.location || 'Location not specified'}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Professional Details */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Experience</label>
                <p className="text-sm mt-1">{experience} years</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Current CTC</label>
                <p className="text-sm mt-1">{candidate.currentCtc || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Expected CTC</label>
                <p className="text-sm mt-1">{candidate.expectedCtc || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Notice Period</label>
                <p className="text-sm mt-1">{candidate.noticePeriod || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Skills */}
          {skills.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Resume */}
          {candidate.resumeUrl && (
            <>
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">Resume</h3>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <a 
                    href={candidate.resumeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View Resume
                  </a>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={() => onEmail(candidate)}
              className="flex-1"
              variant="outline"
            >
              <Mail className="w-4 h-4 mr-2" />
              Send Screening Email
            </Button>
            <Button 
              onClick={() => onSchedule(candidate)}
              className="flex-1"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Schedule AI Interview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
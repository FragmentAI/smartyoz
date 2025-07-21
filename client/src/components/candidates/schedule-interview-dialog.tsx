import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Candidate } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ScheduleInterviewDialogProps {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ScheduleInterviewDialog({
  candidate,
  open,
  onOpenChange
}: ScheduleInterviewDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [interviewType, setInterviewType] = useState("technical");
  const [duration, setDuration] = useState("60");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  const scheduleInterviewMutation = useMutation({
    mutationFn: async (interviewData: any) => {
      return apiRequest("/api/interviews/schedule", {
        method: "POST",
        body: JSON.stringify(interviewData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Interview Scheduled",
        description: "AI interview has been scheduled and candidate will receive email notification.",
      });
      onOpenChange(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule interview",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setSelectedDate(undefined);
    setSelectedTime("");
    setInterviewType("technical");
    setDuration("60");
    setNotes("");
  };

  const handleScheduleInterview = () => {
    if (!candidate || !selectedDate || !selectedTime) {
      toast({
        title: "Missing Information",
        description: "Please select both date and time for the interview.",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = selectedTime.split(':');
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    scheduleInterviewMutation.mutate({
      candidateId: candidate.id,
      scheduledAt: scheduledDateTime.toISOString(),
      type: interviewType,
      duration: parseInt(duration),
      notes,
      mode: "ai", // AI interview
    });
  };

  if (!candidate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" aria-describedby="schedule-interview-description">
        <DialogHeader>
          <DialogTitle>
            Schedule AI Interview - {candidate.firstName} {candidate.lastName}
          </DialogTitle>
        </DialogHeader>

        <div id="schedule-interview-description" className="space-y-4">
          <div>
            <Label>Interview Type</Label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger>
                <SelectValue placeholder="Select interview type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="technical">Technical Interview</SelectItem>
                <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                <SelectItem value="screening">Initial Screening</SelectItem>
                <SelectItem value="final">Final Round</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Interview Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Interview Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time slot" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      {time}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">60 minutes</SelectItem>
                <SelectItem value="90">90 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific instructions or requirements for the interview..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={scheduleInterviewMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleScheduleInterview}
            disabled={scheduleInterviewMutation.isPending}
          >
            {scheduleInterviewMutation.isPending ? "Scheduling..." : "Schedule Interview"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function ManualResponseProcessor() {
  const [candidateEmail, setCandidateEmail] = useState('');
  const [response, setResponse] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processResponseMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/webhook/email', {
        from: candidateEmail,
        subject: 'Re: Screening Questions - Response',
        text: response
      });
    },
    onSuccess: () => {
      toast({
        title: "Response Processed",
        description: "Candidate response has been evaluated and appropriate action taken.",
      });
      setCandidateEmail('');
      setResponse('');
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
    },
    onError: (error) => {
      toast({
        title: "Processing Failed",
        description: "Failed to process candidate response: " + error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Manual Response Processor</CardTitle>
        <p className="text-sm text-gray-600">
          Process candidate email responses manually until webhook is configured.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="email">Candidate Email</Label>
          <Input
            id="email"
            type="email"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            placeholder="candidate@email.com"
          />
        </div>
        
        <div>
          <Label htmlFor="response">Candidate Response</Label>
          <Textarea
            id="response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="1. Current CTC: 15 LPA&#10;2. Expected CTC: 20 LPA&#10;3. Notice Period: 30 days&#10;4. Willing to relocate: Yes&#10;&#10;Additional details..."
            rows={8}
          />
        </div>

        <Button 
          onClick={() => processResponseMutation.mutate()} 
          disabled={!candidateEmail || !response || processResponseMutation.isPending}
        >
          {processResponseMutation.isPending ? 'Processing...' : 'Process Response'}
        </Button>
        
        <div className="text-sm text-gray-500">
          <strong>Note:</strong> This will evaluate the response and automatically send either:
          <ul className="list-disc list-inside mt-1">
            <li>Interview scheduling link (if qualified)</li>
            <li>Rejection email (if not qualified)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
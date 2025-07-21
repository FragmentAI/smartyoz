import { CheckCircleIcon, CalendarIcon, ClockIcon, UserIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function InterviewComplete() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <div className="mx-auto mb-4">
            <CheckCircleIcon className="h-16 w-16 mx-auto" />
          </div>
          <CardTitle className="text-2xl font-bold">Interview Completed Successfully!</CardTitle>
          <p className="text-green-100 mt-2">Thank you for participating in our AI-powered interview</p>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Your interview has been recorded and submitted
              </h2>
              <p className="text-gray-600">
                Our hiring team will review your responses and get back to you within 3-5 business days.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-4">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 text-white rounded-full p-1 mt-0.5">
                    <span className="text-xs font-bold px-1">1</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">AI Analysis</p>
                    <p className="text-sm text-gray-600">Your responses will be analyzed by our AI system</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 text-white rounded-full p-1 mt-0.5">
                    <span className="text-xs font-bold px-1">2</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">HR Review</p>
                    <p className="text-sm text-gray-600">Our hiring team will review the AI evaluation</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 text-white rounded-full p-1 mt-0.5">
                    <span className="text-xs font-bold px-1">3</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Follow-up</p>
                    <p className="text-sm text-gray-600">You'll receive an email with the next steps</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white border rounded-lg p-4">
                <ClockIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Response Time</p>
                <p className="text-sm text-gray-600">3-5 business days</p>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <UserIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Personal Review</p>
                <p className="text-sm text-gray-600">HR team assessment</p>
              </div>
              
              <div className="bg-white border rounded-lg p-4">
                <CalendarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Next Steps</p>
                <p className="text-sm text-gray-600">Email notification</p>
              </div>
            </div>
            
            <div className="text-center pt-4">
              <p className="text-sm text-gray-500 mb-4">
                If you have any questions, please contact our HR team at hr@smartyoz.com
              </p>
              <Button 
                onClick={() => window.close()}
                className="bg-green-600 hover:bg-green-700"
              >
                Close Window
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
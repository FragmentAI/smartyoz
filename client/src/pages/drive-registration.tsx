import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Building2, Calendar, GraduationCap, Mail, Phone, User } from "lucide-react";

interface DriveSession {
  id: number;
  name: string;
  type: 'walk-in' | 'campus';
  description?: string;
}

interface DriveCandidate {
  id: number;
  name: string;
  email: string;
  phone?: string;
  college?: string;
  registrationStatus: string;
  driveSession: DriveSession;
}

export default function DriveRegistration() {
  const [match, params] = useRoute("/drive/register/:token");
  const { toast } = useToast();
  const [candidate, setCandidate] = useState<DriveCandidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    experience: '',
    skills: '',
    availability: ''
  });

  useEffect(() => {
    if (match && params?.token && loading) {
      console.log('Fetching candidate with token:', params.token);
      fetchCandidate(params.token);
    }
  }, [match, params?.token, loading]);

  const fetchCandidate = async (token: string) => {
    try {
      console.log('Fetching candidate data...');
      const response = await fetch(`/api/drive/register/${token}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Candidate data received:', data);
        setCandidate(data);
        setFormData({
          name: data.candidate.name || '',
          email: data.candidate.email || '',
          phone: data.candidate.phone || '',
          college: data.candidate.college || '',
          experience: '',
          skills: '',
          availability: ''
        });
        console.log('Registration status:', data.candidate.registrationStatus);
        setRegistered(data.candidate.registrationStatus === 'registered');
      } else {
        console.error('Failed to fetch candidate:', response.status);
        toast({
          title: "Invalid Registration Link",
          description: "This registration link is invalid or has expired.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast({
        title: "Error",
        description: "Failed to load registration details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params?.token) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/drive/register/${params.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalDetails: formData,
          availability: formData.availability
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setRegistered(true);
        toast({
          title: "Registration Successful!",
          description: "You will receive a test link via email shortly.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Registration Failed",
          description: error.message || "Failed to complete registration. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    console.log('Input changed:', field, value);
    setFormData(prev => ({ 
      ...prev, 
      [field]: value 
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              This registration link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Registration Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your registration for <strong>{candidate.driveSession.name}</strong> has been completed successfully.
              </AlertDescription>
            </Alert>
            <div className="text-sm text-gray-600">
              <p>✅ Registration confirmed</p>
              <p>📧 Test link will be sent to your email</p>
              <p>⏰ Complete the test within 24 hours</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-gray-900">
              Drive Registration
            </CardTitle>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-blue-600">{candidate.driveSession.name}</h2>
              <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {candidate.driveSession.type === 'campus' ? 'Campus Drive' : 'Walk-in Drive'}
                </div>
              </div>
              {candidate.driveSession.description && (
                <p className="text-sm text-gray-600 mt-2">{candidate.driveSession.description}</p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="college">College/University</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="college"
                      type="text"
                      placeholder="Enter your college/university"
                      value={formData.college}
                      onChange={(e) => handleInputChange('college', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Work Experience</Label>
                <Input
                  id="experience"
                  type="text"
                  placeholder="e.g., 2 years in software development"
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Key Skills</Label>
                <Input
                  id="skills"
                  type="text"
                  placeholder="e.g., JavaScript, React, Node.js"
                  value={formData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  type="text"
                  placeholder="e.g., Immediate, 2 weeks notice"
                  value={formData.availability}
                  onChange={(e) => handleInputChange('availability', e.target.value)}
                />
              </div>

              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  After registration, you will receive an aptitude test link via email. 
                  Please complete the test within 24 hours to proceed to the next round.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? "Registering..." : "Complete Registration"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
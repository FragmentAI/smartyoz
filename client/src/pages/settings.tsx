import { useState } from "react";
import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, Users, Eye, EyeOff, Plus, Trash2, Save, Key, Mail, Brain, Globe, Linkedin, Send, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import PlatformSettingsDialog from "@/components/jobs/platform-settings-dialog";
import { InterviewConfiguration } from "@/components/settings/interview-config";

interface UserRole {
  id: number;
  userId: string;
  role: string;
  permissions: string[];
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface OrganizationSetting {
  id: number;
  key: string;
  value: string;
}

const AVAILABLE_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', description: 'View hiring metrics and analytics' },
  { key: 'jobs', label: 'Jobs', description: 'Manage job postings and requirements' },
  { key: 'candidates', label: 'Candidates', description: 'View and manage candidate profiles' },
  { key: 'interviews', label: 'Interviews', description: 'Schedule and manage interviews' },
  { key: 'results', label: 'Results', description: 'View interview results and evaluations' },
  { key: 'bulk_processing', label: 'Bulk Processing', description: 'Upload and process multiple resumes' },
  { key: 'calendar', label: 'Calendar', description: 'View interview calendar and scheduling' },
  { key: 'settings', label: 'Settings', description: 'Manage organization settings and user roles' },
];

const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'interviewer', label: 'Interviewer' },
];

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  
  // State for user management
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [newUserPermissions, setNewUserPermissions] = useState<string[]>([]);
  
  // State for API key management
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState('');

  // Platform configuration state
  const [isPlatformSettingsOpen, setIsPlatformSettingsOpen] = useState(false);

  // Fetch user roles
  const { data: userRoles = [] } = useQuery<UserRole[]>({
    queryKey: ['/api/admin/user-roles'],
    enabled: isAuthenticated,
  });

  // Fetch organization settings
  const { data: orgSettings = [] } = useQuery<OrganizationSetting[]>({
    queryKey: ['/api/admin/organization-settings'],
    enabled: isAuthenticated,
  });

  // Platform configuration queries
  const { data: platformConfigs = [] } = useQuery<any[]>({
    queryKey: ["/api/platform-configs"],
    enabled: isAuthenticated,
  });

  const { data: platformStatuses = [] } = useQuery<any[]>({
    queryKey: ["/api/platform-configs/status"],
    enabled: isAuthenticated,
  });

  const { data: jobPostings = [] } = useQuery<any[]>({
    queryKey: ["/api/job-postings"],
    enabled: isAuthenticated,
  });

  const openaiSetting = orgSettings.find(s => s.key === 'OPENAI_API_KEY');

  // Mutations for user management
  const addUserMutation = useMutation({
    mutationFn: async (userData: { email: string; role: string; permissions: string[] }) => {
      return apiRequest('POST', '/api/admin/add-user', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-roles'] });
      setNewUserEmail('');
      setNewUserRole('');
      setNewUserPermissions([]);
      toast({
        title: "User Added",
        description: "New user has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      });
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      return apiRequest('PUT', `/api/admin/user-permissions/${userId}`, { permissions });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/user-roles'] });
      toast({
        title: "Permissions Updated",
        description: "User permissions have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      return apiRequest('POST', '/api/admin/organization-settings', { key, value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organization-settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive",
      });
    },
  });

  const saveApiKeyMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      return apiRequest('POST', '/api/admin/organization-settings', {
        key: 'OPENAI_API_KEY',
        value: apiKey,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organization-settings'] });
      toast({
        title: "API Key Saved",
        description: "OpenAI API key has been configured successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save API key",
        variant: "destructive",
      });
    },
  });

  // Platform mutations
  const testConnectionMutation = useMutation({
    mutationFn: async (configId: number) => {
      return await apiRequest(`/api/platform-configs/${configId}/test`, {
        method: 'POST'
      });
    },
    onSuccess: (data, configId) => {
      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-configs/status"] });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Test Failed",
        description: error.message || "Failed to test connection",
        variant: "destructive"
      });
    }
  });

  const bulkPostMutation = useMutation({
    mutationFn: async (data: { platformConfigIds: number[], customizations: any }) => {
      return await apiRequest('/api/jobs/bulk-post-to-platforms', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Bulk Posting Successful",
        description: data.message || "Jobs posted to platforms successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/job-postings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Bulk Posting Failed",
        description: error.message || "Failed to post jobs to platforms",
        variant: "destructive"
      });
    }
  });

  const bulkSyncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/platform-configs/bulk-sync', {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Successful",
        description: data.message || "Applications synced successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/platform-applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync applications",
        variant: "destructive"
      });
    }
  });

  const handlePermissionToggle = (userId: string, permission: string, currentPermissions: string[]) => {
    const newPermissions = currentPermissions.includes(permission)
      ? currentPermissions.filter(p => p !== permission)
      : [...currentPermissions, permission];
    
    updatePermissionsMutation.mutate({ userId, permissions: newPermissions });
  };

  const handleSaveApiKey = () => {
    if (!apiKeyValue.trim()) {
      toast({
        title: "Invalid API Key",
        description: "Please enter a valid OpenAI API key.",
        variant: "destructive",
      });
      return;
    }

    if (!apiKeyValue.startsWith('sk-')) {
      toast({
        title: "Invalid API Key Format",
        description: "OpenAI API keys should start with 'sk-'.",
        variant: "destructive",
      });
      return;
    }

    saveApiKeyMutation.mutate(apiKeyValue);
  };

  const handleAddUser = () => {
    if (!newUserEmail || !newUserRole) return;
    
    addUserMutation.mutate({
      email: newUserEmail,
      role: newUserRole,
      permissions: newUserPermissions,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar collapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-48'}`}>
        <Header />
        <main className="flex-1 overflow-y-auto bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b border-gray-200 px-8 py-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="users" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  User Management
                  {userRoles.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{userRoles.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="api" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  API Configuration
                </TabsTrigger>
                <TabsTrigger value="interview" className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Interview Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="users" className="p-8 space-y-6 m-0">
                      {/* Add New User */}
                      <Card>
                        <CardHeader>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <Label htmlFor="email">Email Address</Label>
                              <Input
                                id="email"
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                placeholder="user@company.com"
                              />
                            </div>
                            <div>
                              <Label htmlFor="role">Role</Label>
                              <Select value={newUserRole} onValueChange={setNewUserRole}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {ROLES.map(role => (
                                    <SelectItem key={role.value} value={role.value}>
                                      {role.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Initial Permissions</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {AVAILABLE_PERMISSIONS.slice(0, 3).map(permission => (
                                  <Badge 
                                    key={permission.key}
                                    variant={newUserPermissions.includes(permission.key) ? "default" : "outline"}
                                    className="cursor-pointer text-xs"
                                    onClick={() => {
                                      setNewUserPermissions(prev => 
                                        prev.includes(permission.key)
                                          ? prev.filter(p => p !== permission.key)
                                          : [...prev, permission.key]
                                      );
                                    }}
                                  >
                                    {permission.label}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-end">
                              <Button 
                                onClick={handleAddUser}
                                disabled={!newUserEmail || !newUserRole || addUserMutation.isPending}
                                className="w-full"
                              >
                                {addUserMutation.isPending ? "Adding..." : "Add User"}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Existing Users */}
                      <div className="space-y-4">
                        {userRoles.map(userRole => (
                          <Card key={userRole.id}>
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <h4 className="font-semibold">
                                    {userRole.user.firstName} {userRole.user.lastName}
                                  </h4>
                                  <p className="text-sm text-gray-600">{userRole.user.email}</p>
                                  <Badge variant="outline">{ROLES.find(r => r.value === userRole.role)?.label}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 max-w-md">
                                  {AVAILABLE_PERMISSIONS.map(permission => (
                                    <div key={permission.key} className="flex items-center space-x-2">
                                      <Switch
                                        id={`${userRole.userId}-${permission.key}`}
                                        checked={userRole.permissions.includes(permission.key)}
                                        onCheckedChange={() => handlePermissionToggle(
                                          userRole.userId,
                                          permission.key,
                                          userRole.permissions
                                        )}
                                        disabled={userRole.userId === user?.id && permission.key === 'settings'}
                                      />
                                      <Label 
                                        htmlFor={`${userRole.userId}-${permission.key}`}
                                        className="text-sm font-medium"
                                      >
                                        {permission.label}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
            </TabsContent>

            <TabsContent value="api" className="p-8 space-y-6 m-0">
                      <Card>
                        <CardHeader>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-6">
                            {/* OpenAI API Configuration */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Key className="w-5 h-5" />
                              </div>
                              <p className="text-sm text-gray-600">
                                Configure OpenAI API key for AI-powered job description generation
                              </p>
                              <div className="space-y-2">
                                <Label htmlFor="openai-api-key">OpenAI API Key</Label>
                                <div className="flex gap-2">
                                  <div className="relative flex-1">
                                    <Input
                                      id="openai-api-key"
                                      type={showApiKey ? "text" : "password"}
                                      placeholder="sk-..."
                                      value={apiKeyValue}
                                      onChange={(e) => setApiKeyValue(e.target.value)}
                                      className="pr-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() => setShowApiKey(!showApiKey)}
                                    >
                                      {showApiKey ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                  <Button 
                                    onClick={handleSaveApiKey}
                                    disabled={saveApiKeyMutation.isPending}
                                  >
                                    {saveApiKeyMutation.isPending ? "Saving..." : "Save"}
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Get your API key from{" "}
                                  <a 
                                    href="https://platform.openai.com/api-keys" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    OpenAI Platform
                                  </a>
                                  . This key is stored securely and used for AI job description generation.
                                </p>
                                {openaiSetting?.value && (
                                  <div className="flex items-center gap-2 text-sm text-green-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    API key configured
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* SendGrid Email Configuration */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                              </div>
                              <p className="text-sm text-gray-600">
                                Configure SendGrid for sending emails to candidates
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="sendgrid-api-key">SendGrid API Key</Label>
                                  <Input
                                    id="sendgrid-api-key"
                                    type="password"
                                    placeholder="SG...."
                                    defaultValue={orgSettings?.find(s => s.key === 'SENDGRID_API_KEY')?.value || ''}
                                    onBlur={(e) => {
                                      if (e.target.value.trim()) {
                                        updateSettingMutation.mutate({
                                          key: 'SENDGRID_API_KEY',
                                          value: e.target.value.trim()
                                        });
                                      }
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="sendgrid-from-email">From Email Address</Label>
                                  <Input
                                    id="sendgrid-from-email"
                                    type="email"
                                    placeholder="noreply@yourcompany.com"
                                    defaultValue={orgSettings?.find(s => s.key === 'SENDGRID_FROM_EMAIL')?.value || ''}
                                    onBlur={(e) => {
                                      if (e.target.value.trim()) {
                                        updateSettingMutation.mutate({
                                          key: 'SENDGRID_FROM_EMAIL',
                                          value: e.target.value.trim()
                                        });
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">
                                Get your SendGrid API key from{" "}
                                <a 
                                  href="https://app.sendgrid.com/settings/api_keys" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  SendGrid Dashboard
                                </a>
                                . Without configuration, emails will run in simulation mode.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Platform API Configuration */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            Platform API Configuration
                            <Button
                              onClick={() => setIsPlatformSettingsOpen(true)}
                              className="flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add Platform
                            </Button>
                          </CardTitle>
                          <CardDescription>
                            Configure platform API keys to enable multi-platform job posting
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {platformConfigs.length === 0 ? (
                            <div className="text-center py-12">
                              <Globe className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Platform Configurations
                              </h3>
                              <p className="text-gray-500 mb-4">
                                Configure your platform API keys to start posting jobs
                              </p>
                              <Button 
                                onClick={() => setIsPlatformSettingsOpen(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                Configure Platforms
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {platformConfigs.map((config: any) => {
                                const status = platformStatuses.find(s => s.id === config.id);
                                const isConnected = status?.isConnected || false;
                                
                                return (
                                  <div key={config.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-lg ${
                                        config.platformName === 'linkedin' ? 'bg-blue-100 text-blue-600' :
                                        config.platformName === 'naukri' ? 'bg-purple-100 text-purple-600' :
                                        'bg-green-100 text-green-600'
                                      }`}>
                                        {config.platformName === 'linkedin' ? <Linkedin className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                                      </div>
                                      <div>
                                        <h4 className="font-medium">{config.platformName.charAt(0).toUpperCase() + config.platformName.slice(1)}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{config.platformUrl}</p>
                                        {status?.message && (
                                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{status.message}</p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                                          {isConnected ? 'Connected' : 'Disconnected'}
                                        </span>
                                      </div>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={testConnectionMutation.isPending}
                                        onClick={() => testConnectionMutation.mutate(config.id)}
                                      >
                                        {testConnectionMutation.isPending ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          "Test Connection"
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </CardContent>
                      </Card>
            </TabsContent>

            <TabsContent value="interview" className="p-8 space-y-6 m-0">
                      {/* AI Interview Configuration */}
                      <Card>
                        <CardHeader>
                          <CardTitle>AI Interview Configuration</CardTitle>
                          <CardDescription>
                            Configure default AI interview settings and parameters
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="default-duration">Default Interview Duration (minutes)</Label>
                              <Input
                                id="default-duration"
                                type="number"
                                defaultValue="30"
                                min="15"
                                max="120"
                                onChange={(e) => updateSettingMutation.mutate({
                                  key: 'default_interview_duration',
                                  value: e.target.value
                                })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="avatar-type">Default AI Avatar</Label>
                              <Select
                                defaultValue="professional"
                                onValueChange={(value) => updateSettingMutation.mutate({
                                  key: 'default_avatar_type',
                                  value
                                })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="professional">Professional</SelectItem>
                                  <SelectItem value="friendly">Friendly</SelectItem>
                                  <SelectItem value="technical">Technical</SelectItem>
                                  <SelectItem value="casual">Casual</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Interview Scheduling Configuration */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Interview Scheduling</CardTitle>
                          <CardDescription>
                            Configure scheduling windows and buffer times
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="scheduling-window">Scheduling Window (days)</Label>
                              <Input
                                id="scheduling-window"
                                type="number"
                                defaultValue="7"
                                min="1"
                                max="30"
                                onChange={(e) => updateSettingMutation.mutate({
                                  key: 'scheduling_window_days',
                                  value: e.target.value
                                })}
                              />
                            </div>
                            <div>
                              <Label htmlFor="buffer-time">Buffer Time Between Interviews (minutes)</Label>
                              <Input
                                id="buffer-time"
                                type="number"
                                defaultValue="15"
                                min="5"
                                max="60"
                                onChange={(e) => updateSettingMutation.mutate({
                                  key: 'interview_buffer_minutes',
                                  value: e.target.value
                                })}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Job-specific Interview Configuration */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Job-specific Configuration</CardTitle>
                          <CardDescription>
                            Configure custom interview settings for specific job roles
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <InterviewConfiguration />
                        </CardContent>
                      </Card>


            </TabsContent>

          </Tabs>
        </main>
      </div>
      
      {/* Platform Configuration Dialog */}
      <PlatformSettingsDialog
        open={isPlatformSettingsOpen}
        onOpenChange={setIsPlatformSettingsOpen}
      />
    </div>
  );
}
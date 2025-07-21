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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Plus,
  Settings,
  Linkedin,
  Globe2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  TestTube,
  ExternalLink
} from "lucide-react";
import { JobPlatformConfig } from "@shared/schema";

const platformConfigSchema = z.object({
  platformName: z.string().min(1, "Platform name is required"),
  displayName: z.string().min(1, "Display name is required"),
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  additionalConfig: z.string().optional(),
  isActive: z.boolean().default(true),
});

type PlatformConfigForm = z.infer<typeof platformConfigSchema>;

const PLATFORM_PRESETS = [
  {
    platformName: "linkedin",
    displayName: "LinkedIn",
    icon: Linkedin,
    description: "Professional networking platform",
    fields: ["clientId", "clientSecret", "redirectUri"],
    color: "bg-blue-500"
  },
  {
    platformName: "naukri",
    displayName: "Naukri.com",
    icon: Globe2,
    description: "India's leading job portal",
    fields: ["apiKey", "partnerId"],
    color: "bg-purple-500"
  },
  {
    platformName: "indeed",
    displayName: "Indeed",
    icon: Globe2,
    description: "Global job search engine",
    fields: ["publisherKey", "apiKey"],
    color: "bg-green-500"
  },
  {
    platformName: "glassdoor",
    displayName: "Glassdoor",
    icon: Globe2,
    description: "Company reviews and jobs",
    fields: ["partnerId", "apiKey"],
    color: "bg-teal-500"
  },
  {
    platformName: "monster",
    displayName: "Monster.com",
    icon: Globe2,
    description: "Global job board",
    fields: ["apiKey", "clientId"],
    color: "bg-orange-500"
  },
  {
    platformName: "dice",
    displayName: "Dice",
    icon: Globe2,
    description: "Tech career marketplace",
    fields: ["apiKey", "username"],
    color: "bg-red-500"
  }
];

interface PlatformSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PlatformSettingsDialog({ open, onOpenChange }: PlatformSettingsDialogProps) {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<JobPlatformConfig | null>(null);

  const { data: platformConfigs = [], isLoading } = useQuery<JobPlatformConfig[]>({
    queryKey: ["/api/platform-configs"],
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (data: PlatformConfigForm) =>
      apiRequest("/api/platform-configs", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          additionalConfig: data.additionalConfig ? JSON.parse(data.additionalConfig) : null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-configs"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Platform configuration created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create platform configuration",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PlatformConfigForm> }) =>
      apiRequest(`/api/platform-configs/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...data,
          additionalConfig: data.additionalConfig ? JSON.parse(data.additionalConfig) : null,
        }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-configs"] });
      setEditingConfig(null);
      toast({
        title: "Success",
        description: "Platform configuration updated successfully",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/platform-configs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-configs"] });
      toast({
        title: "Success",
        description: "Platform configuration deleted successfully",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/platform-configs/${id}/test`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform-configs"] });
      toast({
        title: "Success",
        description: "Connection test successful",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Connection test failed",
        variant: "destructive",
      });
    },
  });

  const form = useForm<PlatformConfigForm>({
    resolver: zodResolver(platformConfigSchema),
    defaultValues: {
      platformName: "",
      displayName: "",
      apiKey: "",
      apiSecret: "",
      accessToken: "",
      refreshToken: "",
      additionalConfig: "",
      isActive: true,
    },
  });

  const onSubmit = (data: PlatformConfigForm) => {
    if (editingConfig) {
      updateMutation.mutate({ id: editingConfig.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (config: JobPlatformConfig) => {
    setEditingConfig(config);
    form.reset({
      platformName: config.platformName,
      displayName: config.displayName,
      apiKey: config.apiKey || "",
      apiSecret: config.apiSecret || "",
      accessToken: config.accessToken || "",
      refreshToken: config.refreshToken || "",
      additionalConfig: config.additionalConfig ? JSON.stringify(config.additionalConfig, null, 2) : "",
      isActive: config.isActive,
    });
    setIsCreateDialogOpen(true);
  };

  const handlePresetSelect = (preset: typeof PLATFORM_PRESETS[0]) => {
    form.reset({
      platformName: preset.platformName,
      displayName: preset.displayName,
      apiKey: "",
      apiSecret: "",
      accessToken: "",
      refreshToken: "",
      additionalConfig: "",
      isActive: true,
    });
    setIsCreateDialogOpen(true);
  };

  const getConnectionStatus = (status: string) => {
    switch (status) {
      case "connected":
        return { icon: CheckCircle2, color: "text-green-500", label: "Connected" };
      case "error":
        return { icon: XCircle, color: "text-red-500", label: "Error" };
      default:
        return { icon: AlertTriangle, color: "text-yellow-500", label: "Disconnected" };
    }
  };

  const getPlatformIcon = (platformName: string) => {
    const preset = PLATFORM_PRESETS.find(p => p.platformName === platformName);
    return preset?.icon || Globe2;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Job Platform Configurations
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Platform Presets */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Platforms</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PLATFORM_PRESETS.map((preset) => {
                  const Icon = preset.icon;
                  const isConfigured = platformConfigs.some(config => config.platformName === preset.platformName);
                  
                  return (
                    <Card 
                      key={preset.platformName} 
                      className={`cursor-pointer transition-all hover:shadow-md ${isConfigured ? 'border-green-200 bg-green-50' : ''}`}
                      onClick={() => !isConfigured && handlePresetSelect(preset)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-2 rounded-lg ${preset.color} text-white`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <h4 className="font-medium">{preset.displayName}</h4>
                          </div>
                          {isConfigured && (
                            <Badge variant="success" className="text-xs">
                              Configured
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {preset.fields.map((field) => (
                            <Badge key={field} variant="outline" className="text-xs">
                              {field}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Configured Platforms */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Configured Platforms</h3>
                <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Custom Platform
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading configurations...</p>
                </div>
              ) : platformConfigs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {platformConfigs.map((config) => {
                    const Icon = getPlatformIcon(config.platformName);
                    const status = getConnectionStatus(config.connectionStatus);
                    const StatusIcon = status.icon;

                    return (
                      <Card key={config.id} className="relative">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Icon className="w-6 h-6 text-gray-600" />
                              <div>
                                <CardTitle className="text-base">{config.displayName}</CardTitle>
                                <p className="text-sm text-gray-500">{config.platformName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusIcon className={`w-4 h-4 ${status.color}`} />
                              <span className={`text-xs ${status.color}`}>{status.label}</span>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Status:</span>
                              <Badge variant={config.isActive ? "default" : "secondary"}>
                                {config.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            
                            {config.lastSyncAt && (
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Last Sync:</span>
                                <span>{new Date(config.lastSyncAt).toLocaleDateString()}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 pt-2 border-t">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(config)}
                                className="flex-1"
                              >
                                <Settings className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => testConnectionMutation.mutate(config.id)}
                                disabled={testConnectionMutation.isPending}
                              >
                                <TestTube className="w-3 h-3 mr-1" />
                                Test
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteMutation.mutate(config.id)}
                                disabled={deleteMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="text-center py-8">
                  <CardContent>
                    <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Platform Configurations</h3>
                    <p className="text-gray-500 mb-4">
                      Configure job platforms to automatically post jobs and sync applications
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Platform
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Platform Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? "Edit Platform Configuration" : "Add Platform Configuration"}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="platformName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., linkedin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., LinkedIn" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="apiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Enter API key" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apiSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Secret</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Enter API secret" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="accessToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Token</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Enter access token" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="refreshToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Refresh Token</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Enter refresh token" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="additionalConfig"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder='{"redirectUri": "https://yourapp.com/callback", "scopes": ["r_liteprofile", "r_emailaddress"]}'
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <div className="text-sm text-gray-500">
                        Enable this platform configuration
                      </div>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingConfig(null);
                    form.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingConfig ? "Update" : "Create"} Configuration
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
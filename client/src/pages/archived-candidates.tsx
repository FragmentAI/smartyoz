import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/layout/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Archive, Eye } from "lucide-react";
import { Candidate } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function ArchivedCandidates() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: archivedCandidates = [], isLoading: candidatesLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/candidates/archived"],
    enabled: isAuthenticated,
  });

  const restoreCandidateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/candidates/${id}/restore`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/candidates/archived"] });
      queryClient.invalidateQueries({ queryKey: ["/api/candidates"] });
      toast({
        title: "Success",
        description: "Candidate restored successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restore candidate.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Archived Candidates</h1>
              <p className="text-gray-600 mt-2">View and manage archived candidate profiles</p>
            </div>
            <div className="flex items-center space-x-2">
              <Archive className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-500">{archivedCandidates.length} archived</span>
            </div>
          </div>

          {candidatesLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex space-x-4">
                      <div className="h-4 bg-gray-200 rounded flex-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : archivedCandidates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Archived Candidates</h2>
                <p className="text-gray-500">
                  When you archive candidates, they will appear here for future reference.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Archived Candidates</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Experience</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Archived Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archivedCandidates.map((candidate) => (
                      <TableRow key={candidate.id} className="opacity-75">
                        <TableCell className="font-medium">
                          {candidate.firstName} {candidate.lastName}
                        </TableCell>
                        <TableCell>{candidate.email}</TableCell>
                        <TableCell>{candidate.position || "-"}</TableCell>
                        <TableCell>
                          {candidate.experience ? `${candidate.experience} years` : "-"}
                        </TableCell>
                        <TableCell>{candidate.location || "-"}</TableCell>
                        <TableCell>{formatDate(candidate.archivedAt)}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restoreCandidateMutation.mutate(candidate.id)}
                              disabled={restoreCandidateMutation.isPending}
                            >
                              <RotateCcw className="w-4 h-4 mr-1" />
                              Restore
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
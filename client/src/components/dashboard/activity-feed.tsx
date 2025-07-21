import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityItem } from "@/types";

export default function ActivityFeed() {
  // Mock data - in real implementation, this would come from an API
  const activities: ActivityItem[] = [
    {
      id: "1",
      type: "interview_completed",
      message: "Interview completed for John Smith",
      details: "Senior Developer position • 2 minutes ago",
      timestamp: "2 minutes ago",
      color: "bg-green-500"
    },
    {
      id: "2",
      type: "application_received",
      message: "New candidate application received",
      details: "UI/UX Designer position • 15 minutes ago",
      timestamp: "15 minutes ago",
      color: "bg-blue-500"
    },
    {
      id: "3",
      type: "bulk_processed",
      message: "Bulk processing completed",
      details: "45 resumes processed • 1 hour ago",
      timestamp: "1 hour ago",
      color: "bg-purple-500"
    },
    {
      id: "4",
      type: "interview_scheduled",
      message: "Interview scheduled",
      details: "Data Scientist position • 2 hours ago",
      timestamp: "2 hours ago",
      color: "bg-amber-500"
    },
    {
      id: "5",
      type: "offer_declined",
      message: "Candidate declined offer",
      details: "Product Manager position • 3 hours ago",
      timestamp: "3 hours ago",
      color: "bg-red-500"
    },
  ];

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3">
              <div className={`w-2 h-2 ${activity.color} rounded-full flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium truncate">
                  {activity.message}
                </p>
                <p className="text-xs text-gray-500">
                  {activity.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

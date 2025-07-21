import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationFunnelData } from "@/types";

export default function ApplicationFunnel() {
  // Mock data - in real implementation, this would come from an API
  const funnelData: ApplicationFunnelData[] = [
    { stage: "Applications Received", count: 1247, percentage: 100, color: "bg-blue-600" },
    { stage: "Initial Screening", count: 423, percentage: 34, color: "bg-green-600" },
    { stage: "Interview Scheduled", count: 156, percentage: 12.5, color: "bg-purple-600" },
    { stage: "Offers Extended", count: 23, percentage: 1.8, color: "bg-amber-600" },
  ];

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">
          Application Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelData.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">{item.stage}</span>
                <span className="text-sm font-medium text-gray-900">{item.count}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${item.color} h-2 rounded-full transition-all duration-300`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

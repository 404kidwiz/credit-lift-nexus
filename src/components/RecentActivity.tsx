
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, FileText } from "lucide-react";

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: "dispute_sent",
      title: "Dispute letter sent to Experian",
      description: "Late payment dispute for Chase account",
      timestamp: "2 hours ago",
      status: "sent",
      icon: FileText,
    },
    {
      id: 2,
      type: "violation_detected",
      title: "FCRA violation identified",
      description: "Missing required disclosure on Collection account",
      timestamp: "1 day ago",
      status: "new",
      icon: AlertCircle,
    },
    {
      id: 3,
      type: "dispute_resolved",
      title: "Dispute resolved successfully",
      description: "Inquiry removed from TransUnion report",
      timestamp: "3 days ago",
      status: "completed",
      icon: CheckCircle,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "sent":
        return "bg-blue-100 text-blue-700";
      case "new":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getIconColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-500";
      case "sent":
        return "text-blue-500";
      case "new":
        return "text-amber-500";
      default:
        return "text-slate-500";
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-800">Recent Activity</h3>
        
        <div className="space-y-4">
          {activities.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white/40 rounded-lg border border-white/30">
                <div className={`p-2 rounded-lg bg-white/60`}>
                  <IconComponent className={`h-4 w-4 ${getIconColor(activity.status)}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-800 text-sm">
                      {activity.title}
                    </h4>
                    <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    {activity.description}
                  </p>
                  <div className="flex items-center space-x-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" />
                    <span>{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All Activity →
          </button>
        </div>
      </div>
    </Card>
  );
}

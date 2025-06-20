
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

export function DisputeProgress() {
  const disputes = [
    { id: 1, type: "Late Payment", status: "completed", progress: 100 },
    { id: 2, type: "Collection Account", status: "in-progress", progress: 65 },
    { id: 3, type: "Credit Inquiry", status: "pending", progress: 25 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-emerald-600";
      case "in-progress":
        return "text-blue-600";
      default:
        return "text-amber-600";
    }
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-800">Active Disputes</h3>
        
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(dispute.status)}
                  <span className="text-sm font-medium text-slate-700">
                    {dispute.type}
                  </span>
                </div>
                <span className={`text-xs font-medium ${getStatusColor(dispute.status)} capitalize`}>
                  {dispute.status.replace('-', ' ')}
                </span>
              </div>
              <Progress 
                value={dispute.progress} 
                className="h-2 bg-slate-100"
              />
              <div className="text-xs text-slate-500 text-right">
                {dispute.progress}% complete
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200">
          <div className="text-center">
            <span className="text-2xl font-bold text-slate-800">3</span>
            <p className="text-sm text-slate-500">Total Active Disputes</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

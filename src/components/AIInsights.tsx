
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, AlertTriangle, CheckCircle2 } from "lucide-react";

export function AIInsights() {
  const insights = [
    {
      type: "violation",
      title: "Metro 2 Format Violation Detected",
      description: "Account #1234 missing required date format",
      impact: "High",
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      type: "opportunity",
      title: "Goodwill Letter Opportunity",
      description: "Bank of America shows pattern of acceptance",
      impact: "Medium",
      icon: CheckCircle2,
      color: "text-emerald-500",
    },
  ];

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <h3 className="text-lg font-medium text-slate-800">AI Insights</h3>
        </div>
        
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className="p-4 bg-white/40 rounded-lg border border-white/30">
                <div className="flex items-start space-x-3">
                  <IconComponent className={`h-5 w-5 mt-0.5 ${insight.color}`} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-800 text-sm">
                        {insight.title}
                      </h4>
                      <Badge 
                        variant={insight.impact === "High" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {insight.impact}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View All Insights →
          </button>
        </div>
      </div>
    </Card>
  );
}

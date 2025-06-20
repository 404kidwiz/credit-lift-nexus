
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Scale, TrendingUp } from "lucide-react";

export function ActionCards() {
  const actions = [
    {
      icon: Upload,
      title: "Upload Report",
      description: "Add your latest credit report for AI analysis",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
    },
    {
      icon: FileText,
      title: "Generate Letter",
      description: "Create AI-powered dispute letters",
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600",
    },
    {
      icon: Scale,
      title: "Check Violations",
      description: "Scan for legal compliance issues",
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
    },
    {
      icon: TrendingUp,
      title: "View Progress",
      description: "Track your credit improvement",
      color: "bg-emerald-500",
      hoverColor: "hover:bg-emerald-600",
    },
  ];

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-800">Quick Actions</h3>
        
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-center space-y-2 border-white/30 bg-white/20 hover:bg-white/40 transition-all duration-200 group`}
              >
                <div className={`w-10 h-10 rounded-lg ${action.color} ${action.hoverColor} flex items-center justify-center transition-colors group-hover:scale-110 transform duration-200`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-800 text-sm">
                    {action.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    {action.description}
                  </p>
                </div>
              </Button>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

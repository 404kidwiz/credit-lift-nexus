
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface CreditScoreRingProps {
  score: number;
  trend: string;
}

export function CreditScoreRing({ score, trend }: CreditScoreRingProps) {
  const percentage = (score / 850) * 100;
  const circumference = 2 * Math.PI * 90;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 740) return "text-emerald-600";
    if (score >= 670) return "text-blue-600";
    if (score >= 580) return "text-amber-600";
    return "text-red-500";
  };

  const getGradientId = (score: number) => {
    if (score >= 740) return "emerald-gradient";
    if (score >= 670) return "blue-gradient";
    if (score >= 580) return "amber-gradient";
    return "red-gradient";
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
      <div className="text-center space-y-4">
        <h3 className="text-lg font-medium text-slate-800">Credit Score</h3>
        
        <div className="relative w-48 h-48 mx-auto">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
              <linearGradient id="emerald-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="amber-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="red-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-slate-200"
            />
            
            {/* Progress circle */}
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke={`url(#${getGradientId(score)})`}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out drop-shadow-lg"
            />
          </svg>
          
          {/* Score display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score}
            </span>
            <span className="text-sm text-slate-500">FICO Score</span>
            <div className={`flex items-center mt-2 ${trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend.startsWith('+') ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span className="text-sm font-medium">{trend} pts</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Poor</span>
            <span className="text-slate-500">Excellent</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>300</span>
            <span>850</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

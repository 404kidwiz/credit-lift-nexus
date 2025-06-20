
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";

export function TrendChart() {
  const data = [
    { month: "Jan", score: 620 },
    { month: "Feb", score: 635 },
    { month: "Mar", score: 642 },
    { month: "Apr", score: 658 },
    { month: "May", score: 665 },
    { month: "Jun", score: 678 },
  ];

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-800">Score Trend</h3>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis 
                dataKey="month" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <YAxis 
                domain={['dataMin - 10', 'dataMax + 10']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#64748b' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="url(#gradient)"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }}
                activeDot={{ r: 6, fill: '#6366f1' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex justify-between text-sm">
          <div>
            <span className="text-slate-500">6-Month Change</span>
            <p className="font-semibold text-emerald-600">+58 points</p>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Next Goal</span>
            <p className="font-semibold text-blue-600">720 (Good)</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

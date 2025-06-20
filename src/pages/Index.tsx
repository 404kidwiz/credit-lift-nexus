
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditScoreRing } from "@/components/CreditScoreRing";
import { NavigationHeader } from "@/components/NavigationHeader";
import { DisputeProgress } from "@/components/DisputeProgress";
import { RecentActivity } from "@/components/RecentActivity";
import { ActionCards } from "@/components/ActionCards";
import { TrendChart } from "@/components/TrendChart";
import { AIInsights } from "@/components/AIInsights";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NavigationHeader />
        
        <main className="container mx-auto px-6 py-8 space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl font-light text-slate-800 tracking-wide">
              Welcome back, <span className="font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user?.email?.split('@')[0]}</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Your AI-powered credit repair companion. Transform your financial future with intelligent dispute management and legal compliance analysis.
            </p>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Credit Score & Progress */}
            <div className="lg:col-span-1 space-y-6">
              <CreditScoreRing score={678} trend={"+23"} />
              <DisputeProgress />
            </div>

            {/* Middle Column - Charts & Insights */}
            <div className="lg:col-span-1 space-y-6">
              <TrendChart />
              <AIInsights />
            </div>

            {/* Right Column - Actions & Activity */}
            <div className="lg:col-span-1 space-y-6">
              <ActionCards />
              <RecentActivity />
            </div>
          </div>

          {/* Quick Actions Bar */}
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
            <div className="p-6">
              <h3 className="text-lg font-medium text-slate-800 mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg">
                  Upload Credit Report
                </Button>
                <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  Generate Dispute Letter
                </Button>
                <Button variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  View Violations
                </Button>
              </div>
            </div>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Index;

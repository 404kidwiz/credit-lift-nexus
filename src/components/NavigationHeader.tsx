
import { Button } from "@/components/ui/button";
import { Bell, Settings, User, CreditCard, FileText, TrendingUp } from "lucide-react";

export function NavigationHeader() {
  return (
    <header className="bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Credit Lift
              </h1>
              <p className="text-xs text-slate-500">AI-Powered Credit Repair</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors">
              <CreditCard className="h-4 w-4" />
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors">
              <FileText className="h-4 w-4" />
              <span>Reports</span>
            </a>
            <a href="#" className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 transition-colors">
              <FileText className="h-4 w-4" />
              <span>Disputes</span>
            </a>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5 text-slate-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></span>
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5 text-slate-600" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="h-5 w-5 text-slate-600" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

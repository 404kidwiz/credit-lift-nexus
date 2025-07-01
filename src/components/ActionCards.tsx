import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Scale, TrendingUp, BarChart3, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ActionStats {
  totalReports: number;
  totalNegativeItems: number;
  totalViolations: number;
  latestReportId: string | null;
}

export function ActionCards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [stats, setStats] = useState<ActionStats>({
    totalReports: 0,
    totalNegativeItems: 0,
    totalViolations: 0,
    latestReportId: null
  });

  const loadStats = useCallback(async () => {
    if (!user) return;
    try {
      // Load user's credit reports
      const { data: reports, error: reportsError } = await supabase
        .from('credit_reports_analysis')
        .select('id, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      const reportIds = reports?.map(r => r.id) || [];
      
      // Load accounts for these reports
      const { data: accounts } = await supabase
        .from('credit_accounts')
        .select('id, credit_report_id')
        .in('credit_report_id', reportIds);

      const accountIds = accounts?.map(a => a.id) || [];

      // Load negative items
      const { data: negativeItems } = await supabase
        .from('negative_items')
        .select('id')
        .in('credit_account_id', accountIds);

      // Load violations
      const { data: violations } = await supabase
        .from('violations')
        .select('id')
        .in('negative_item_id', negativeItems?.map(n => n.id) || []);

      setStats({
        totalReports: reports?.length || 0,
        totalNegativeItems: negativeItems?.length || 0,
        totalViolations: violations?.length || 0,
        latestReportId: reports?.[0]?.id || null
      });

    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleGenerateLetter = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate dispute letters.",
        variant: "destructive"
      });
      return;
    }

    setLoading('letter');
    try {
      if (!stats.latestReportId) {
        toast({
          title: "No Reports Found",
          description: "Please upload and analyze a credit report first.",
          variant: "destructive"
        });
        return;
      }

      if (stats.totalNegativeItems === 0 && stats.totalViolations === 0) {
        toast({
          title: "No Issues Found",
          description: "Great news! No negative items or violations were found to dispute.",
        });
        return;
      }

      navigate(`/analysis/${stats.latestReportId}?tab=negative`);
    } catch (error) {
      console.error('Error navigating to letters:', error);
      toast({
        title: "Error",
        description: "Failed to navigate to dispute letters.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleCheckViolations = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to check violations.",
        variant: "destructive"
      });
      return;
    }

    setLoading('violations');
    try {
      if (!stats.latestReportId) {
        toast({
          title: "No Reports Found",
          description: "Please upload and analyze a credit report first.",
          variant: "destructive"
        });
        return;
      }

      navigate(`/analysis/${stats.latestReportId}?tab=violations`);
    } catch (error) {
      console.error('Error navigating to violations:', error);
      toast({
        title: "Error",
        description: "Failed to navigate to violations.",
        variant: "destructive"
      });
    } finally {
      setLoading(null);
    }
  };

  const handleViewProgress = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view progress.",
        variant: "destructive"
      });
      return;
    }

    if (!stats.latestReportId) {
      toast({
        title: "No Reports Found",
        description: "Upload a credit report to start tracking progress.",
        variant: "destructive"
      });
      return;
    }

    navigate(`/analysis/${stats.latestReportId}?tab=overview`);
  };

  const actions = [
    {
      icon: Upload,
      title: "Upload Report",
      description: "Add your latest credit report for AI analysis",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600",
      onClick: () => navigate('/upload'),
      loading: false,
      badge: null,
      disabled: false,
    },
    {
      icon: FileText,
      title: "Generate Letters",
      description: "Create AI-powered dispute letters",
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600",
      onClick: handleGenerateLetter,
      loading: loading === 'letter',
      badge: stats.totalNegativeItems > 0 ? stats.totalNegativeItems : null,
      disabled: stats.totalReports === 0,
    },
    {
      icon: Shield,
      title: "Check Violations",
      description: "Scan for FCRA compliance issues",
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600",
      onClick: handleCheckViolations,
      loading: loading === 'violations',
      badge: stats.totalViolations > 0 ? stats.totalViolations : null,
      disabled: stats.totalReports === 0,
    },
    {
      icon: BarChart3,
      title: "View Analysis",
      description: "Track your credit improvement",
      color: "bg-emerald-500",
      hoverColor: "hover:bg-emerald-600",
      onClick: handleViewProgress,
      loading: false,
      badge: stats.totalReports > 0 ? stats.totalReports : null,
      disabled: stats.totalReports === 0,
    },
  ];

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-800">Quick Actions</h3>
          {stats.totalReports > 0 && (
            <Badge variant="secondary" className="text-xs">
              {stats.totalReports} report{stats.totalReports !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <div key={index} className="relative">
                <Button
                  variant="outline"
                  onClick={action.onClick}
                  disabled={action.loading || action.disabled}
                  className={`h-auto p-4 w-full flex flex-col items-center space-y-2 border-white/30 bg-white/20 hover:bg-white/40 transition-all duration-200 group ${
                    action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} ${action.hoverColor} flex items-center justify-center transition-colors ${
                    !action.disabled ? 'group-hover:scale-110 transform duration-200' : ''
                  }`}>
                    {action.loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <IconComponent className="h-5 w-5 text-white" />
                    )}
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
                {action.badge && (
                  <Badge 
                    className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full"
                  >
                    {action.badge}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {stats.totalReports === 0 && (
          <div className="text-center py-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700 mb-2">
              🚀 Get started by uploading your credit report
            </p>
            <p className="text-xs text-blue-600">
              Our AI will analyze it and identify opportunities for improvement
            </p>
          </div>
        )}

        {stats.totalReports > 0 && (stats.totalNegativeItems > 0 || stats.totalViolations > 0) && (
          <div className="text-center py-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-sm text-orange-700 mb-1">
              ⚠️ {stats.totalNegativeItems + stats.totalViolations} issues found
            </p>
            <p className="text-xs text-orange-600">
              Generate dispute letters to start improving your credit score
            </p>
          </div>
        )}

        {stats.totalReports > 0 && stats.totalNegativeItems === 0 && stats.totalViolations === 0 && (
          <div className="text-center py-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm text-green-700 mb-1">
              ✅ Great news! No issues found
            </p>
            <p className="text-xs text-green-600">
              Your credit report looks clean and healthy
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

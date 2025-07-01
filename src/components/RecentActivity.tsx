import React, { useState, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, AlertCircle, FileText, Upload, BarChart3, Send, Shield } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: string;
  type: 'upload' | 'analysis' | 'dispute' | 'violation';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'processing' | 'new' | 'sent';
  icon: React.ComponentType<{ className?: string }>;
  relatedId?: string;
}

export function RecentActivity() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecentActivity = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Load recent credit reports
      const { data: reports, error: reportsError } = await supabase
        .from('credit_reports_analysis')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (reportsError) throw reportsError;

      // Load recent negative items and violations for context
      const reportIds = reports?.map(r => r.id) || [];
      
      const { data: accounts } = await supabase
        .from('credit_accounts')
        .select('id, credit_report_id')
        .in('credit_report_id', reportIds);

      const accountIds = accounts?.map(a => a.id) || [];

      const { data: negativeItems } = await supabase
        .from('negative_items')
        .select('id, credit_account_id, creditor_name, item_type, created_at')
        .in('credit_account_id', accountIds)
        .order('created_at', { ascending: false })
        .limit(10);

      const { data: violations } = await supabase
        .from('violations')
        .select('id, negative_item_id, violation_type, severity, created_at')
        .in('negative_item_id', negativeItems?.map(n => n.id) || [])
        .order('created_at', { ascending: false })
        .limit(10);

      // Convert to activities
      const recentActivities: Activity[] = [];

      // Add upload activities
      reports?.forEach(report => {
        recentActivities.push({
          id: `upload_${report.id}`,
          type: 'upload',
          title: 'Credit report uploaded',
          description: `${report.file_name} - ${report.file_size ? Math.round(report.file_size / 1024) : 0}KB`,
          timestamp: formatTimestamp(report.created_at),
          status: 'completed',
          icon: Upload,
          relatedId: report.id
        });

        // Add analysis activity if there are accounts
        const reportAccounts = accounts?.filter(a => a.credit_report_id === report.id);
        if (reportAccounts && reportAccounts.length > 0) {
          recentActivities.push({
            id: `analysis_${report.id}`,
            type: 'analysis',
            title: 'Credit analysis completed',
            description: `Found ${reportAccounts.length} accounts and identified potential issues`,
            timestamp: formatTimestamp(report.created_at),
            status: 'completed',
            icon: BarChart3,
            relatedId: report.id
          });
        }
      });

      // Add negative item detection activities
      negativeItems?.slice(0, 3).forEach(item => {
        recentActivities.push({
          id: `negative_${item.id}`,
          type: 'dispute',
          title: 'Negative item detected',
          description: `${item.item_type} from ${item.creditor_name}`,
          timestamp: formatTimestamp(item.created_at),
          status: 'new',
          icon: AlertCircle,
          relatedId: item.id
        });
      });

      // Add violation detection activities
      violations?.slice(0, 2).forEach(violation => {
        recentActivities.push({
          id: `violation_${violation.id}`,
          type: 'violation',
          title: 'FCRA violation identified',
          description: `${violation.violation_type} (${violation.severity} severity)`,
          timestamp: formatTimestamp(violation.created_at),
          status: 'new',
          icon: Shield,
          relatedId: violation.id
        });
      });

      // Sort by timestamp and take the most recent
      recentActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(recentActivities.slice(0, 6));

    } catch (error) {
      console.error('Failed to load recent activity:', error);
      // Fallback to mock data
      setActivities([
        {
          id: 'mock_1',
          type: 'upload',
          title: 'Welcome to Credit Lift Nexus',
          description: 'Upload your first credit report to get started',
          timestamp: 'Just now',
          status: 'new',
          icon: FileText,
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadRecentActivity();
  }, [loadRecentActivity]);

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "sent":
        return "bg-purple-100 text-purple-700";
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
      case "processing":
        return "text-blue-500";
      case "sent":
        return "text-purple-500";
      case "new":
        return "text-amber-500";
      default:
        return "text-slate-500";
    }
  };

  const handleActivityClick = (activity: Activity) => {
    if (activity.type === 'upload' || activity.type === 'analysis') {
      navigate(`/analysis/${activity.relatedId}`);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-800">Recent Activity</h3>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-white/40 rounded-lg border border-white/30">
                <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-800">Recent Activity</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadRecentActivity}
            className="text-blue-600 hover:text-blue-700 text-xs"
          >
            Refresh
          </Button>
        </div>
        
        <div className="space-y-4">
          {activities.length > 0 ? (
            activities.map((activity) => {
              const IconComponent = activity.icon;
              const isClickable = activity.type === 'upload' || activity.type === 'analysis';
              
              return (
                <div 
                  key={activity.id} 
                  className={`flex items-start space-x-3 p-3 bg-white/40 rounded-lg border border-white/30 transition-all ${
                    isClickable ? 'hover:bg-white/60 cursor-pointer hover:shadow-md' : ''
                  }`}
                  onClick={() => isClickable && handleActivityClick(activity)}
                >
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
            })
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 mb-4">No recent activity</p>
              <Button
                onClick={() => navigate('/upload')}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                Upload Credit Report
              </Button>
            </div>
          )}
        </div>

        {activities.length > 0 && (
          <div className="text-center pt-2">
            <button 
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              onClick={() => {/* TODO: Add activity history page */}}
            >
              View All Activity →
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

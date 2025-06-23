import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CreditReport } from '@/lib/types/credit-reports';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const RecentUploads: React.FC = () => {
  const [uploads, setUploads] = useState<CreditReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadRecentUploads();
    }
  }, [user]);

  const loadRecentUploads = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('credit_reports')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      setUploads(data || []);
    } catch (error) {
      console.error('Failed to load recent uploads:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: CreditReport['status']) => {
    switch (status) {
      case 'uploaded':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'analyzing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'analyzed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: CreditReport['status']) => {
    switch (status) {
      case 'uploaded':
        return 'Uploaded';
      case 'analyzing':
        return 'Analyzing';
      case 'analyzed':
        return 'Analyzed';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (uploads.length === 0) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Uploads Yet</h3>
          <p className="text-gray-600 mb-4">
            Upload your first credit report to get started
          </p>
          <Button 
            onClick={() => navigate('/upload')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Upload Credit Report
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-slate-800">Recent Uploads</h3>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/upload')}
        >
          Upload New
        </Button>
      </div>
      
      <div className="space-y-3">
        {uploads.map((upload) => (
          <div
            key={upload.id}
            className="flex items-center justify-between p-3 bg-white/50 rounded-lg border border-white/30 hover:bg-white/70 transition-colors"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {getStatusIcon(upload.status)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {upload.file_name}
                </p>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <span>{formatFileSize(upload.file_size)}</span>
                  <span>•</span>
                  <span>{formatDate(upload.created_at)}</span>
                  <span>•</span>
                  <Badge variant="outline" className="text-xs">
                    {getStatusText(upload.status)}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {upload.status === 'analyzed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/analysis/${upload.id}`)}
                  className="flex items-center space-x-1"
                >
                  <Eye className="h-3 w-3" />
                  <span>View</span>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {uploads.length >= 5 && (
        <div className="mt-4 text-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/upload')}
            className="text-blue-600 hover:text-blue-700"
          >
            View All Uploads
          </Button>
        </div>
      )}
    </Card>
  );
}; 
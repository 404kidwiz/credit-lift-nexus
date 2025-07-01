import React, { useState, useEffect } from 'react';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Database, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Eye,
  Trash2,
  Calendar,
  User,
  Hash,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AnalysisRecord {
  id: string;
  user_id: string;
  pdf_url: string;
  extracted_text: string | null;
  parsed_data: any;
  violations: any;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

const Debug: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);

  const loadRecords = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading all analysis records for user:', user.id);
      
      const { data, error: fetchError } = await supabase
        .from('credit_reports_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error fetching records:', fetchError);
        throw fetchError;
      }

      console.log('✅ Loaded records:', data);
      setRecords(data || []);
      
    } catch (err) {
      console.error('Failed to load records:', err);
      setError('Failed to load analysis records');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('credit_reports_analysis')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (deleteError) throw deleteError;
      
      await loadRecords();
    } catch (err) {
      console.error('Failed to delete record:', err);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [user]);

  const formatData = (data: any) => {
    if (!data) return 'null';
    if (typeof data === 'string') return data;
    return JSON.stringify(data, null, 2);
  };

  const getRecordStatus = (record: AnalysisRecord) => {
    if (!record.parsed_data && !record.violations) return 'empty';
    if (!record.processed_at) return 'processing';
    return 'complete';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'empty': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Debug Console</h1>
            <p className="text-gray-600">Analysis records and system diagnostics</p>
          </div>
          <Button onClick={loadRecords} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="records" className="space-y-6">
          <TabsList>
            <TabsTrigger value="records">Analysis Records</TabsTrigger>
            <TabsTrigger value="details">Record Details</TabsTrigger>
            <TabsTrigger value="system">System Info</TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Credit Reports Analysis Records ({records.length})
                </CardTitle>
                <CardDescription>
                  All analysis records for the current user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading records...</p>
                  </div>
                ) : records.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No analysis records found</p>
                    <Button 
                      onClick={() => navigate('/ai-upload')} 
                      className="mt-4"
                      variant="outline"
                    >
                      Upload Credit Report
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {records.map((record) => {
                      const status = getRecordStatus(record);
                      const accountsCount = record.parsed_data?.accounts?.length || 0;
                      const violationsCount = record.violations?.length || 0;
                      
                      return (
                        <div key={record.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <div>
                                <p className="font-mono text-sm font-medium">
                                  {record.id.substring(0, 8)}...
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(record.created_at).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge className={getStatusColor(status)}>
                                {status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedRecord(record)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => navigate(`/analysis/${record.id}`)}
                              >
                                View
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteRecord(record.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Accounts:</span>
                              <span className="ml-2 font-medium">{accountsCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Violations:</span>
                              <span className="ml-2 font-medium">{violationsCount}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Text:</span>
                              <span className="ml-2 font-medium">
                                {record.extracted_text ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Processed:</span>
                              <span className="ml-2 font-medium">
                                {record.processed_at ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {selectedRecord ? (
              <Card>
                <CardHeader>
                  <CardTitle>Record Details</CardTitle>
                  <CardDescription>
                    Detailed view of analysis record {selectedRecord.id.substring(0, 8)}...
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        Basic Info
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>ID:</strong> {selectedRecord.id}</div>
                        <div><strong>User ID:</strong> {selectedRecord.user_id}</div>
                        <div><strong>Created:</strong> {new Date(selectedRecord.created_at).toLocaleString()}</div>
                        <div><strong>Updated:</strong> {new Date(selectedRecord.updated_at).toLocaleString()}</div>
                        <div><strong>Processed:</strong> {selectedRecord.processed_at ? new Date(selectedRecord.processed_at).toLocaleString() : 'Not processed'}</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Data Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>PDF URL:</strong> {selectedRecord.pdf_url ? 'Present' : 'Missing'}</div>
                        <div><strong>Extracted Text:</strong> {selectedRecord.extracted_text ? `${selectedRecord.extracted_text.length} chars` : 'None'}</div>
                        <div><strong>Parsed Data:</strong> {selectedRecord.parsed_data ? 'Present' : 'Missing'}</div>
                        <div><strong>Violations:</strong> {selectedRecord.violations ? `${selectedRecord.violations.length} items` : 'None'}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Parsed Data</h4>
                    <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
                      {formatData(selectedRecord.parsed_data)}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Violations</h4>
                    <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-60">
                      {formatData(selectedRecord.violations)}
                    </pre>
                  </div>

                  {selectedRecord.extracted_text && (
                    <div>
                      <h4 className="font-medium mb-2">Extracted Text (first 500 chars)</h4>
                      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-40">
                        {selectedRecord.extracted_text.substring(0, 500)}...
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-gray-500">Select a record from the Records tab to view details</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Authentication
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>User ID:</strong> {user?.id || 'Not authenticated'}</div>
                      <div><strong>Email:</strong> {user?.email || 'N/A'}</div>
                      <div><strong>Auth Status:</strong> {user ? 'Authenticated' : 'Not authenticated'}</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Environment
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}</div>
                      <div><strong>Gemini API:</strong> {import.meta.env.VITE_GEMINI_API_KEY ? 'Configured' : 'Not configured'}</div>
                      <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Debug; 
import React, { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface AnalysisRecord {
  id: string;
  user_id: string;
  pdf_url: string;
  created_at: string;
  processed_at: string;
  parsed_data?: any;
  violations?: any[];
}

export default function Debug() {
  const [records, setRecords] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user) {
        setError('No user logged in');
        return;
      }

      console.log('Loading records for user:', user.id);

      const { data, error: fetchError } = await supabase
        .from('credit_reports_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching records:', fetchError);
        setError(fetchError.message);
        return;
      }

      console.log('Fetched records:', data);
      setRecords(data || []);
    } catch (err) {
      console.error('Error loading records:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const viewAnalysis = (id: string) => {
    navigate(`/analysis/${id}`);
  };

  const testGCF = async () => {
    try {
      // Test the GCF webhook endpoint
      const response = await fetch('/api/test-gcf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          user_id: user?.id
        })
      });
      
      const result = await response.json();
      console.log('GCF test result:', result);
      alert('GCF test completed. Check console for details.');
    } catch (err) {
      console.error('GCF test error:', err);
      alert('GCF test failed. Check console for details.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
        <p>Loading records...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Debug Page</h1>
          <p className="text-muted-foreground">
            View all analysis records for debugging
          </p>
        </div>
        <div className="space-x-2">
          <Button onClick={loadRecords} variant="outline">
            Refresh
          </Button>
          <Button onClick={testGCF} variant="secondary">
            Test GCF
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 font-medium">Error: {error}</p>
          </CardContent>
        </Card>
      )}

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          User ID: {user?.id || 'Not logged in'}
        </p>
        <p className="text-sm text-muted-foreground">
          Total Records: {records.length}
        </p>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No analysis records found for this user.
            </p>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Try uploading a credit report first.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-mono text-sm">
                      {record.id}
                    </CardTitle>
                    <CardDescription>
                      Created: {new Date(record.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Badge variant="outline">
                      {record.parsed_data?.accounts?.length || 0} accounts
                    </Badge>
                    <Badge variant="outline">
                      {record.violations?.length || 0} violations
                    </Badge>
                    <Button 
                      size="sm" 
                      onClick={() => viewAnalysis(record.id)}
                    >
                      View
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">PDF URL:</p>
                    <p className="text-muted-foreground truncate">
                      {record.pdf_url}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Processed:</p>
                    <p className="text-muted-foreground">
                      {record.processed_at ? 
                        new Date(record.processed_at).toLocaleString() : 
                        'Not processed'
                      }
                    </p>
                  </div>
                </div>
                
                {record.parsed_data?.accounts && (
                  <div className="mt-4">
                    <p className="font-medium text-sm mb-2">Accounts:</p>
                    <div className="space-y-1">
                      {record.parsed_data.accounts.slice(0, 3).map((account: any, index: number) => (
                        <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                          <strong>{account.creditor_name}</strong> - {account.status}
                        </div>
                      ))}
                      {record.parsed_data.accounts.length > 3 && (
                        <p className="text-xs text-muted-foreground">
                          +{record.parsed_data.accounts.length - 3} more accounts
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Send, 
  ArrowLeft,
  Copy,
  CheckCircle
} from 'lucide-react';
import { DisputeLetter, DisputeLetterGenerator } from '@/lib/services/disputeLetterGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Letters: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [letters, setLetters] = useState<DisputeLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedLetter, setCopiedLetter] = useState<string | null>(null);

  useEffect(() => {
    if (reportId) {
      loadAnalysisDataAndGenerateLetters();
    }
  }, [reportId]);

  const loadAnalysisDataAndGenerateLetters = async () => {
    if (!reportId || !user) return;
    
    setLoading(true);
    
    try {
      // Load the analysis data
      const { data: analysisData, error: analysisError } = await supabase
        .from('credit_reports_analysis')
        .select('*')
        .eq('id', reportId)
        .maybeSingle();

      if (analysisError || !analysisData) {
        throw new Error('Failed to load analysis data');
      }

      console.log('Analysis data loaded:', analysisData);

      // Parse the parsed_data to get negative items and violations
      const parsedData = analysisData.parsed_data;
      const violations = analysisData.violations || [];

      if (!parsedData || !parsedData.accounts) {
        throw new Error('No account data found in analysis');
      }

      // Extract negative items from accounts
      const negativeItems = parsedData.accounts
        .filter((account: any) => {
          const status = account.status?.toLowerCase();
          return status === 'late' || 
                 status === 'past_due' || 
                 status === 'collection' ||
                 status === 'collection/chargeoff' ||
                 status === 'chargeoff' ||
                 status === 'derogatory' ||
                 status === 'default';
        })
        .map((account: any, index: number) => ({
          id: `ni_${index}`,
          credit_report_id: reportId,
          account_number: account.account_number || '',
          creditor_name: account.creditor_name || '',
          account_type: account.account_type || '',
          status: account.status || '',
          original_balance: account.balance || 0,
          current_balance: account.balance || 0,
          date_reported: account.last_activity || '',
          description: `${account.account_type} account with ${account.creditor_name} - Status: ${account.status}`,
          item_type: account.status?.toLowerCase().includes('collection') ? 'collection' : 
                    account.status?.toLowerCase().includes('chargeoff') ? 'chargeoff' : 'late_payment'
        }));

      console.log('Negative items extracted:', negativeItems);
      console.log('Violations found:', violations);

      // Generate dispute letters for negative items
      const generatedLetters: DisputeLetter[] = [];
      
      for (const item of negativeItems) {
        try {
          const letter = await DisputeLetterGenerator.generateDisputeLetter(
            item,
            { 
              name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Consumer',
              address: '[YOUR ADDRESS]',
              phone: '[YOUR PHONE]'
            },
            'dispute'
          );
          generatedLetters.push(letter);
        } catch (error) {
          console.error('Failed to generate letter for item:', item, error);
        }
      }

      // Generate complaint letters for violations
      for (const violation of violations) {
        try {
          const letter = await DisputeLetterGenerator.generateViolationLetter(
            violation,
            { 
              name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Consumer',
              address: '[YOUR ADDRESS]',
              phone: '[YOUR PHONE]'
            }
          );
          generatedLetters.push(letter);
        } catch (error) {
          console.error('Failed to generate letter for violation:', violation, error);
        }
      }

      console.log('Generated letters:', generatedLetters);
      setLetters(generatedLetters);

      if (generatedLetters.length === 0) {
        toast({
          title: "No Items to Dispute",
          description: "No negative items or violations found in this credit report.",
        });
      } else {
        toast({
          title: "Letters Generated",
          description: `${generatedLetters.length} dispute letters have been generated based on your credit report.`,
        });
      }

    } catch (error) {
      console.error('Failed to load analysis data and generate letters:', error);
      toast({
        title: "Error",
        description: "Failed to load analysis data and generate letters.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (content: string, letterId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedLetter(letterId);
      toast({
        title: "Copied to Clipboard",
        description: "Letter content has been copied to your clipboard.",
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedLetter(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy letter to clipboard.",
        variant: "destructive"
      });
    }
  };

  const downloadLetter = (letter: DisputeLetter) => {
    const blob = new Blob([letter.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${letter.title.replace(/\s+/g, '_')}_${letter.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Letter has been downloaded successfully.",
    });
  };

  const getStatusColor = (status: DisputeLetter['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'responded':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dispute letters...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate(`/analysis/${reportId}`)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Analysis</span>
            </Button>
            <div>
              <h1 className="text-3xl font-light text-slate-800">
                Dispute Letters
              </h1>
              <p className="text-gray-600">
                Generated letters for your credit report disputes
              </p>
            </div>
          </div>
        </div>

        {/* Letters List */}
        <div className="space-y-6">
          {letters.map((letter) => (
            <Card key={letter.id} className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
              <div className="p-6">
                {/* Letter Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-6 w-6 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{letter.title}</h3>
                      <p className="text-sm text-gray-600">To: {letter.recipient}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={`${getStatusColor(letter.status)}`}
                    >
                      {letter.status.charAt(0).toUpperCase() + letter.status.slice(1)}
                    </Badge>
                    <Badge variant="outline">
                      {letter.type.charAt(0).toUpperCase() + letter.type.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Letter Content */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {letter.content}
                  </pre>
                </div>

                {/* Letter Actions */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Generated on {new Date(letter.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(letter.content, letter.id)}
                      className="flex items-center space-x-1"
                    >
                      {copiedLetter === letter.id ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                      <span>
                        {copiedLetter === letter.id ? 'Copied!' : 'Copy'}
                      </span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadLetter(letter)}
                      className="flex items-center space-x-1"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download</span>
                    </Button>
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send Letter
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {letters.length === 0 && (
          <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Letters Generated</h3>
              <p className="text-gray-600 mb-4">
                Generate dispute letters from your analysis results
              </p>
              <Button 
                onClick={() => navigate(`/analysis/${reportId}`)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Back to Analysis
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Letters; 
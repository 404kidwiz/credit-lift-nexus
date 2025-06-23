import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { NavigationHeader } from '@/components/NavigationHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign,
  ArrowLeft,
  Download,
  Send,
  CreditCard,
  Shield,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Info,
  Star,
  AlertCircle,
  CheckCircle2,
  Search,
  Upload,
  Home,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CreditReport, CreditAccount, NegativeItem, Violation } from '@/lib/types/credit-reports';
import { DisputeLetterGenerator } from '@/lib/services/disputeLetterGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AnalysisData {
  creditReport: CreditReport;
  accounts: CreditAccount[];
  negativeItems: NegativeItem[];
  violations: Violation[];
  summary: {
    totalAccounts: number;
    negativeItemsCount: number;
    violationsCount: number;
    estimatedScoreImpact: number;
    recommendedActions: string[];
    accountTypes: { [key: string]: number };
    severityBreakdown: { [key: string]: number };
    potentialImprovement: number;
  };
}

const AnalysisResults: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectedViolations, setSelectedViolations] = useState<string[]>([]);
  const [generatingLetters, setGeneratingLetters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [availableRecords, setAvailableRecords] = useState<Array<{id: string, created_at: string}>>([]);

  useEffect(() => {
    if (reportId) {
      loadAnalysisData(reportId);
    }
  }, [reportId]);

  // Auto-redirect to most recent record if current ID is invalid
  useEffect(() => {
    if (error && availableRecords.length > 0 && !loading) {
      const mostRecentRecord = availableRecords[0]; // Records are already sorted by created_at desc
      console.log('Auto-redirecting to most recent record:', mostRecentRecord.id);
      navigate(`/analysis/${mostRecentRecord.id}`, { replace: true });
    }
  }, [error, availableRecords, loading, navigate]);

  const loadAnalysisData = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading analysis data for ID:', id);
      console.log('Current user ID:', user?.id);
      
      // Load credit report analysis from the new table
      const { data: reportAnalysis, error: reportError } = await supabase
        .from('credit_reports_analysis')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (reportError) {
        console.error('Supabase error:', reportError);
        throw reportError;
      }

      // Check if reportAnalysis exists
      if (!reportAnalysis) {
        console.error('Analysis record not found for ID:', id);
        console.log('Available records for user:', user?.id);
        
        // Let's check what records exist for this user
        const { data: userRecords, error: userRecordsError } = await supabase
          .from('credit_reports_analysis')
          .select('id, created_at, pdf_url')
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false });
          
        if (userRecordsError) {
          console.error('Error fetching user records:', userRecordsError);
        } else {
          console.log('User records:', userRecords);
          setAvailableRecords(userRecords || []);
        }
        
        setError(`Analysis record not found. The record with ID "${id}" does not exist or may have been deleted.`);
        return;
      }

      // Check if the record belongs to the current user
      if (reportAnalysis.user_id !== user?.id) {
        console.error('Record belongs to different user:', reportAnalysis.user_id, 'Current user:', user?.id);
        throw new Error('You do not have permission to view this analysis record.');
      }

      // Log the structure for debugging
      console.log('Report Analysis:', reportAnalysis);
      console.log('Parsed Data:', reportAnalysis.parsed_data);
      console.log('Violations:', reportAnalysis.violations);

      // Parse the JSONB data with null checks
      const parsedData = reportAnalysis.parsed_data || {};
      const violations = reportAnalysis.violations || [];
      
      // Log the parsed data structure
      console.log('Parsed Data (after null check):', parsedData);
      console.log('Violations (after null check):', violations);
      
      // Extract accounts from parsed_data
      const accounts: CreditAccount[] = (parsedData.accounts || []).map((account: any) => ({
        id: account.account_number || `acc_${Math.random()}`,
        credit_report_id: reportAnalysis.id,
        account_number: account.account_number || '',
        account_type: account.account_type || '',
        creditor_name: account.creditor_name || '',
        account_status: account.status || '',
        date_opened: account.date_opened || '',
        date_closed: account.date_closed || '',
        date_reported: account.last_activity || '',
        credit_limit: account.credit_limit || 0,
        high_credit: account.high_credit || 0,
        current_balance: account.balance || 0,
        payment_status: account.payment_status || '',
        payment_history: account.payment_history || '',
        last_payment_date: account.last_payment_date || '',
        last_payment_amount: account.last_payment_amount || 0,
        account_holder: account.account_holder || '',
        responsibility: account.responsibility || '',
        raw_data: account,
        created_at: reportAnalysis.created_at,
        updated_at: reportAnalysis.updated_at
      }));
      
      // Extract negative items from accounts with derogatory status
      const negativeItems: NegativeItem[] = accounts
        .filter(account => 
          account.account_status?.toLowerCase().includes('derogatory') ||
          account.account_status?.toLowerCase().includes('chargeoff') ||
          account.account_status?.toLowerCase().includes('collection') ||
          account.account_status?.toLowerCase().includes('late')
        )
        .map(account => ({
          id: account.account_number || `neg_${Math.random()}`,
          credit_account_id: account.id,
          item_type: 'collection', // You may want to infer this from account_status
          creditor_name: account.creditor_name || '',
          account_number: account.account_number || '',
          original_balance: account.current_balance || 0,
          current_balance: account.current_balance || 0,
          date_reported: account.date_reported || '',
          date_of_first_delinquency: account.date_opened || '',
          date_of_last_activity: account.date_reported || '',
          status: account.account_status || '',
          description: `${account.creditor_name} account with ${account.account_status} status`,
          raw_data: account.raw_data,
          created_at: account.created_at,
          updated_at: account.updated_at
        }));

      // Generate enhanced summary with analytics
      const accountTypes = accounts.reduce((acc, account) => {
        const type = account.account_type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const severityBreakdown = violations.reduce((acc, violation) => {
        const severity = violation.severity?.toLowerCase() || 'medium';
        acc[severity] = (acc[severity] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      const summary = {
        totalAccounts: accounts.length,
        negativeItemsCount: negativeItems.length,
        violationsCount: violations.length,
        estimatedScoreImpact: negativeItems.length * 20 + violations.length * 15,
        potentialImprovement: Math.min(negativeItems.length * 15 + violations.length * 10, 120),
        accountTypes,
        severityBreakdown,
        recommendedActions: [
          'Dispute inaccurate negative items immediately',
          'Request investigation of FCRA violations',
          'Monitor credit score improvements monthly',
          'Consider credit utilization optimization',
          'Set up automated payment reminders'
        ]
      };

      // Create a credit report object for compatibility
      const creditReport = {
        id: reportAnalysis.id,
        user_id: reportAnalysis.user_id,
        file_name: reportAnalysis.pdf_url?.split('/').pop() || 'Credit Report',
        file_url: reportAnalysis.pdf_url || '',
        file_size: 0,
        file_type: 'pdf',
        status: 'processed',
        processing_errors: [],
        raw_data: reportAnalysis.extracted_text || '',
        parsed_data: reportAnalysis.parsed_data || {},
        created_at: reportAnalysis.created_at,
        updated_at: reportAnalysis.updated_at
      };

      setAnalysisData({
        creditReport,
        accounts,
        negativeItems,
        violations,
        summary
      });

    } catch (error) {
      console.error('Failed to load analysis data:', error);
      setError('Failed to load analysis results');
      toast({
        title: "Error",
        description: "Failed to load analysis results.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelection = (itemId: string, type: 'negative' | 'violation') => {
    if (type === 'negative') {
      setSelectedItems(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    } else {
      setSelectedViolations(prev => 
        prev.includes(itemId) 
          ? prev.filter(id => id !== itemId)
          : [...prev, itemId]
      );
    }
  };

  const selectAllItems = (type: 'negative' | 'violation') => {
    if (type === 'negative') {
      const allIds = analysisData?.negativeItems.map(item => item.id) || [];
      setSelectedItems(selectedItems.length === allIds.length ? [] : allIds);
    } else {
      const allIds = analysisData?.violations.map(violation => violation.id) || [];
      setSelectedViolations(selectedViolations.length === allIds.length ? [] : allIds);
    }
  };

  const generateDisputeLetters = async () => {
    const totalSelected = selectedItems.length + selectedViolations.length;
    
    if (totalSelected === 0) {
      toast({
        title: "No Items Selected",
        description: "Please select items to generate dispute letters for.",
        variant: "destructive"
      });
      return;
    }

    try {
      setGeneratingLetters(true);
      
      const selectedNegativeItems = analysisData?.negativeItems.filter(
        item => selectedItems.includes(item.id)
      ) || [];

      const selectedViolationItems = analysisData?.violations.filter(
        violation => selectedViolations.includes(violation.id)
      ) || [];

      const letters = [];
      
      // Generate letters for negative items
      for (const item of selectedNegativeItems) {
        const letter = await DisputeLetterGenerator.generateDisputeLetter(
          item,
          { name: user?.user_metadata?.full_name || user?.email },
          'dispute'
        );
        letters.push(letter);
      }

      // Generate letters for violations
      for (const violation of selectedViolationItems) {
        const letter = await DisputeLetterGenerator.generateViolationLetter(
          violation,
          { name: user?.user_metadata?.full_name || user?.email }
        );
        letters.push(letter);
      }

      console.log('Generated letters:', letters);
      
      toast({
        title: "Letters Generated",
        description: `${letters.length} dispute letters have been generated.`,
      });

      // Navigate to letters page
      navigate(`/letters/${reportId}`);

    } catch (error) {
      console.error('Failed to generate letters:', error);
      toast({
        title: "Error",
        description: "Failed to generate dispute letters.",
        variant: "destructive"
      });
    } finally {
      setGeneratingLetters(false);
    }
  };

  const getScoreColor = (impact: number) => {
    if (impact > 50) return 'text-red-600';
    if (impact > 25) return 'text-orange-600';
    return 'text-yellow-600';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'current':
        return 'bg-green-100 text-green-800';
      case 'late':
      case 'past_due':
        return 'bg-red-100 text-red-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderAccountTypeChart = () => {
    if (!analysisData?.summary.accountTypes) return null;
    
    const types = Object.entries(analysisData.summary.accountTypes);
    const total = types.reduce((sum, [, count]) => sum + count, 0);
    
    return (
      <div className="space-y-3">
        {types.map(([type, count]) => {
          const percentage = (count / total) * 100;
          return (
            <div key={type} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{type.replace('_', ' ')}</span>
                <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </div>
    );
  };

  const renderSeverityChart = () => {
    if (!analysisData?.summary.severityBreakdown) return null;
    
    const severities = Object.entries(analysisData.summary.severityBreakdown);
    const total = severities.reduce((sum, [, count]) => sum + count, 0);
    
    return (
      <div className="space-y-3">
        {severities.map(([severity, count]) => {
          const percentage = (count / total) * 100;
          const color = severity === 'high' ? 'bg-red-500' : 
                       severity === 'medium' ? 'bg-orange-500' : 'bg-yellow-500';
          
          return (
            <div key={severity} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="capitalize">{severity}</span>
                <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${color}`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analysis results...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <NavigationHeader />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-left">
                <div className="space-y-2">
                  <p className="font-medium">{error || 'Analysis results not found'}</p>
                  {error?.includes('not found') && (
                    <div className="text-sm space-y-1">
                      <p>This could be because:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>The analysis record was deleted</li>
                        <li>The URL contains an incorrect ID</li>
                        <li>The record belongs to a different user</li>
                        <li>The analysis is still processing</li>
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
            
            {/* Show available records if any exist */}
            {availableRecords.length > 0 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Available Analysis Records</CardTitle>
                  <CardDescription>
                    Click on any record below to view its analysis results
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {availableRecords.map((record) => (
                      <div 
                        key={record.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/analysis/${record.id}`)}
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="font-mono text-sm text-gray-600">
                              {record.id.substring(0, 8)}...
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(record.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="space-y-4">
              <Button 
                onClick={() => navigate('/debug')} 
                variant="outline"
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                View All Analysis Records
              </Button>
              
              <Button 
                onClick={() => navigate('/ai-upload')} 
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New Credit Report
              </Button>
              
              <Button 
                onClick={() => navigate('/')} 
                variant="ghost"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalSelectedItems = selectedItems.length + selectedViolations.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <NavigationHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
            <div>
              <h1 className="text-3xl font-light text-slate-800">
                Credit Analysis Results
              </h1>
              <p className="text-gray-600">
                {analysisData.creditReport.file_name} • Analyzed on {new Date(analysisData.creditReport.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={generateDisputeLetters}
              disabled={totalSelectedItems === 0 || generatingLetters}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generatingLetters ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Generate Letters ({totalSelectedItems})
            </Button>
          </div>
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analysisData.summary.totalAccounts}</div>
              <p className="text-xs text-muted-foreground">
                Credit accounts found
              </p>
            </CardContent>
          </Card>
          
          <Card className="p-6 border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Negative Items</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {analysisData.summary.negativeItemsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Items affecting score
              </p>
            </CardContent>
          </Card>
          
          <Card className="p-6 border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">FCRA Violations</CardTitle>
              <Shield className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {analysisData.summary.violationsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                Potential violations found
              </p>
            </CardContent>
          </Card>
          
          <Card className="p-6 border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Gain</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +{analysisData.summary.potentialImprovement}
              </div>
              <p className="text-xs text-muted-foreground">
                Estimated score improvement
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Score Impact Analysis */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Credit Score Impact Analysis
            </CardTitle>
            <CardDescription>
              Detailed breakdown of how negative items are affecting your credit score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Current Impact</span>
                  <span className={`text-lg font-bold ${getScoreColor(analysisData.summary.estimatedScoreImpact)}`}>
                    -{analysisData.summary.estimatedScoreImpact} points
                  </span>
                </div>
                <Progress 
                  value={Math.min(analysisData.summary.estimatedScoreImpact, 100)} 
                  className="h-3"
                />
                <div className="text-xs text-muted-foreground">
                  Based on {analysisData.summary.negativeItemsCount} negative items and {analysisData.summary.violationsCount} violations
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Potential Improvement</span>
                  <span className="text-lg font-bold text-green-600">
                    +{analysisData.summary.potentialImprovement} points
                  </span>
                </div>
                <Progress 
                  value={Math.min(analysisData.summary.potentialImprovement, 100)} 
                  className="h-3"
                />
                <div className="text-xs text-muted-foreground">
                  Estimated improvement after successful disputes
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-medium">Impact Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Negative Items</span>
                    <span className="text-sm font-medium">-{analysisData.summary.negativeItemsCount * 20} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">FCRA Violations</span>
                    <span className="text-sm font-medium">-{analysisData.summary.violationsCount * 15} pts</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span className="text-sm">Total Impact</span>
                    <span className="text-sm">-{analysisData.summary.estimatedScoreImpact} pts</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="negative">Negative Items</TabsTrigger>
            <TabsTrigger value="violations">Violations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Account Types Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Account Types Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {renderAccountTypeChart()}
                </CardContent>
              </Card>

              {/* Severity Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Violation Severity Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analysisData.summary.violationsCount > 0 ? renderSeverityChart() : (
                    <div className="text-center py-8 text-gray-500">
                      <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No violations found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recommended Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Recommended Actions
                </CardTitle>
                <CardDescription>
                  Priority steps to improve your credit score and address violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData.summary.recommendedActions.map((action, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">{index + 1}</span>
                      </div>
                      <p className="text-sm text-gray-700">{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Credit Accounts ({analysisData.accounts.length})
                </CardTitle>
                <CardDescription>
                  All credit accounts found in your report
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analysisData.accounts.map((account, index) => (
                    <div key={account.id || index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-lg">{account.creditor_name}</h4>
                          <p className="text-sm text-gray-600">{account.account_number}</p>
                        </div>
                        <Badge className={getStatusColor(account.account_status)}>
                          {account.account_status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Type:</span>
                          <p className="font-medium capitalize">{account.account_type?.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Balance:</span>
                          <p className="font-medium">${account.current_balance?.toLocaleString() || '0'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Limit:</span>
                          <p className="font-medium">${account.credit_limit?.toLocaleString() || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Payment Status:</span>
                          <p className="font-medium">{account.payment_status || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="negative" className="space-y-6">
            {analysisData.negativeItems.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-red-600">
                        <TrendingDown className="h-5 w-5" />
                        Negative Items ({analysisData.negativeItems.length})
                      </CardTitle>
                      <CardDescription>
                        Items that may be negatively affecting your credit score
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => selectAllItems('negative')}
                      className="text-sm"
                    >
                      {selectedItems.length === analysisData.negativeItems.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.negativeItems.map((item, index) => (
                      <div key={item.id || index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedItems.includes(item.id)}
                            onCheckedChange={() => handleItemSelection(item.id, 'negative')}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-red-900">{item.creditor_name}</h4>
                                <p className="text-sm text-red-700">{item.item_type}</p>
                              </div>
                              <Badge variant="destructive">{item.status}</Badge>
                            </div>
                            <p className="text-sm text-red-800 mb-3">{item.description}</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-red-600">Balance:</span>
                                <p className="font-medium">${item.current_balance?.toLocaleString() || '0'}</p>
                              </div>
                              <div>
                                <span className="text-red-600">Reported:</span>
                                <p className="font-medium">{item.date_reported || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-red-600">First Delinquency:</span>
                                <p className="font-medium">{item.date_of_first_delinquency || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-red-600">Last Activity:</span>
                                <p className="font-medium">{item.date_of_last_activity || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Negative Items Found</h3>
                  <p className="text-gray-600">Great news! No negative items were detected in your credit report.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="violations" className="space-y-6">
            {analysisData.violations.length > 0 ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <Shield className="h-5 w-5" />
                        FCRA Violations ({analysisData.violations.length})
                      </CardTitle>
                      <CardDescription>
                        Potential Fair Credit Reporting Act violations found
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => selectAllItems('violation')}
                      className="text-sm"
                    >
                      {selectedViolations.length === analysisData.violations.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisData.violations.map((violation, index) => (
                      <div key={violation.id || index} className={`border rounded-lg p-4 ${getSeverityColor(violation.severity)}`}>
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedViolations.includes(violation.id)}
                            onCheckedChange={() => handleItemSelection(violation.id, 'violation')}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{violation.violation_type}</h4>
                                <p className="text-sm opacity-75">{violation.severity} severity</p>
                              </div>
                              <Badge variant="secondary" className={getSeverityColor(violation.severity)}>
                                {violation.severity}
                              </Badge>
                            </div>
                            <p className="text-sm mb-3 opacity-90">{violation.violation_description}</p>
                            <div className="bg-white/50 p-3 rounded border">
                              <p className="text-sm font-medium mb-1">Suggested Action:</p>
                              <p className="text-sm opacity-75">{violation.suggested_action}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No FCRA Violations Found</h3>
                  <p className="text-gray-600">Excellent! No Fair Credit Reporting Act violations were detected.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button 
            onClick={generateDisputeLetters}
            disabled={totalSelectedItems === 0 || generatingLetters}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {generatingLetters ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generate Dispute Letters ({totalSelectedItems} selected)
          </Button>
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Clock className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults; 
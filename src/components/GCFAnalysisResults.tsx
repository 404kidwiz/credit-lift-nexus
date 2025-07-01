import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CloudCog,
  Brain,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  CreditReportAnalysis,
  CreditReportSupabaseClient,
  ViolationSummary,
  Violation,
  CreditAccount,
  CreditInquiry
} from '@/lib/services/gcfIntegration';

interface GCFAnalysisResultsProps {
  analysisId?: string;
}

export const GCFAnalysisResults: React.FC<GCFAnalysisResultsProps> = ({ analysisId }) => {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [analysis, setAnalysis] = useState<CreditReportAnalysis | null>(null);
  const [violationSummary, setViolationSummary] = useState<ViolationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedViolations, setSelectedViolations] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const supabaseClient = useMemo(() => new CreditReportSupabaseClient(supabase), []);

  const loadGCFAnalysis = useCallback(async (id: string) => {
    if (!user) return;
    try {
      setLoading(true);
      
      // Load the GCF analysis from the new table
      const analysisData = await supabaseClient.getCreditReportAnalysis(id);
      
      if (!analysisData) {
        throw new Error('Analysis not found');
      }

      setAnalysis(analysisData);

      // Load violation summary
      const summaries = await supabaseClient.getViolationSummaries(user.id);
      const summary = summaries.find(s => s.id === id);
      if (summary) {
        setViolationSummary(summary);
      }

    } catch (error) {
      console.error('Failed to load GCF analysis:', error);
      setError('Failed to load analysis results');
      toast({
        title: "Error",
        description: "Failed to load GCF analysis results.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [supabaseClient, user, toast]);

  useEffect(() => {
    const id = analysisId || reportId;
    if (id) {
      loadGCFAnalysis(id);
    }
  }, [analysisId, reportId, loadGCFAnalysis]);

  const handleViolationSelection = (violationIndex: number) => {
    const violationId = `violation-${violationIndex}`;
    setSelectedViolations(prev => 
      prev.includes(violationId) 
        ? prev.filter(id => id !== violationId)
        : [...prev, violationId]
    );
  };

  const selectAllViolations = () => {
    if (!analysis) return;
    const allIds = analysis.violations.map((_, index) => `violation-${index}`);
    setSelectedViolations(selectedViolations.length === allIds.length ? [] : allIds);
  };

  const downloadDisputeLetter = () => {
    if (!analysis || !analysis.dispute_letter) {
      toast({
        title: "No Dispute Letter",
        description: "No dispute letter available for this analysis.",
        variant: "destructive"
      });
      return;
    }

    // Create and download the dispute letter
    const blob = new Blob([analysis.dispute_letter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dispute-letter-${analysis.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Dispute Letter Downloaded",
      description: "Your AI-generated dispute letter has been downloaded.",
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL': return 'bg-red-500';
      case 'HIGH': return 'bg-orange-500';
      case 'MEDIUM': return 'bg-yellow-500';
      case 'LOW': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High Risk': return 'text-red-600 bg-red-50';
      case 'Medium Risk': return 'text-orange-600 bg-orange-50';
      case 'Low Risk': return 'text-yellow-600 bg-yellow-50';
      case 'No Violations': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <CloudCog className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-500">Loading GCF analysis results...</p>
        </div>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Not Found</h3>
        <p className="text-gray-500 mb-4">{error || 'The requested analysis could not be found.'}</p>
        <Button onClick={() => navigate('/ai-upload')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Upload
        </Button>
      </div>
    );
  }

  const personalInfo = analysis.parsed_data.personal_info;
  const accounts = analysis.parsed_data.accounts || [];
  const inquiries = analysis.parsed_data.inquiries || [];
  const violations = analysis.violations || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
                className="mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="h-8 w-8 text-blue-600" />
                AI Credit Report Analysis
              </h1>
              <p className="text-gray-500 mt-2">
                Processed by Google Cloud Vision AI & Gemini • {new Date(analysis.processed_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              {violationSummary && (
                <Badge className={`text-sm px-3 py-1 ${getRiskLevelColor(violationSummary.risk_level)}`}>
                  {violationSummary.risk_level}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Violations Found</p>
                  <p className="text-3xl font-bold text-red-600">{violations.length}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Credit Accounts</p>
                  <p className="text-3xl font-bold text-blue-600">{accounts.length}</p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Credit Inquiries</p>
                  <p className="text-3xl font-bold text-orange-600">{inquiries.length}</p>
                </div>
                <Target className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Processing Status</p>
                  <p className="text-sm font-bold text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Complete
                  </p>
                </div>
                <CloudCog className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="violations">Violations</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="dispute">Dispute Letter</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-lg font-semibold">{personalInfo.name || 'Not Available'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                    <p className="text-lg font-semibold">{personalInfo.date_of_birth || 'Not Available'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">SSN</p>
                    <p className="text-lg font-semibold">{personalInfo.ssn ? `***-**-${personalInfo.ssn.slice(-4)}` : 'Not Available'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Address</p>
                    <p className="text-lg font-semibold">{personalInfo.address || 'Not Available'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Violation Summary */}
            {violations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-red-500" />
                    Violation Summary
                  </CardTitle>
                  <CardDescription>
                    FCRA and Metro2 violations detected by AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(severity => {
                      const count = violations.filter(v => v.severity === severity).length;
                      if (count === 0) return null;
                      
                      return (
                        <div key={severity} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${getSeverityColor(severity)}`} />
                            <span className="font-medium">{severity} Priority</span>
                          </div>
                          <Badge variant="outline">{count} violations</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="violations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    FCRA & Metro2 Violations ({violations.length})
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllViolations}
                    >
                      {selectedViolations.length === violations.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  Violations detected by Google Gemini AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {violations.map((violation, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedViolations.includes(`violation-${index}`)}
                            onCheckedChange={() => handleViolationSelection(index)}
                          />
                          <div>
                            <h4 className="font-semibold text-gray-900">{violation.title}</h4>
                            <Badge className={`text-xs ${getSeverityColor(violation.severity)} text-white`}>
                              {violation.severity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-8 space-y-2">
                        <p className="text-gray-700">{violation.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-500">Affected Account:</span>
                            <p className="text-gray-900">{violation.affected_account}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500">Legal Basis:</span>
                            <p className="text-gray-900">{violation.legal_basis}</p>
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-500">Dispute Reason:</span>
                          <p className="text-gray-900">{violation.dispute_reason}</p>
                        </div>
                      </div>
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
                  Credit Accounts ({accounts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {accounts.map((account, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{account.creditor_name}</h4>
                        <Badge variant="outline">{account.account_type}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-500">Account #:</span>
                          <p className="text-gray-900">***{account.account_number.slice(-4)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Balance:</span>
                          <p className="text-gray-900">${account.balance.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Credit Limit:</span>
                          <p className="text-gray-900">${account.credit_limit.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-500">Status:</span>
                          <p className="text-gray-900">{account.status}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Credit Inquiries ({inquiries.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inquiries.map((inquiry, index) => (
                    <div key={index} className="flex items-center justify-between border rounded-lg p-3">
                      <div>
                        <p className="font-medium text-gray-900">{inquiry.company}</p>
                        <p className="text-sm text-gray-500">{inquiry.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dispute" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  AI-Generated Dispute Letter
                </CardTitle>
                <CardDescription>
                  Professionally crafted dispute letter based on detected violations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis.dispute_letter ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm font-mono">
                        {analysis.dispute_letter}
                      </pre>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={downloadDisputeLetter}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Letter
                      </Button>
                      <Button variant="outline">
                        <Send className="h-4 w-4 mr-2" />
                        Send to Credit Bureaus
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No dispute letter was generated for this analysis.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}; 
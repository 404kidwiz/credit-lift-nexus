/**
 * Frontend Integration Helper for Credit Report Processor Google Cloud Function
 * 
 * This file provides TypeScript interfaces and helper functions for integrating
 * the Google Cloud Function with your React frontend.
 */

// Type definitions for the GCF API
export interface ProcessCreditReportRequest {
  pdf_url: string;
  user_id: string;
}

export interface ProcessCreditReportResponse {
  status: 'success' | 'error';
  message: string;
  data?: CreditReportAnalysis[];
  summary?: {
    violations_found: number;
    accounts_analyzed: number;
    inquiries_found: number;
  };
}

export interface CreditReportAnalysis {
  id: string;
  user_id: string;
  pdf_url: string;
  extracted_text: string;
  parsed_data: ParsedCreditReportData;
  violations: Violation[];
  dispute_letter: string;
  processed_at: string;
  created_at: string;
  updated_at: string;
}

export interface ParsedCreditReportData {
  personal_info: {
    name: string;
    ssn: string;
    address: string;
    date_of_birth: string;
  };
  accounts: CreditAccount[];
  inquiries: CreditInquiry[];
}

export interface CreditAccount {
  creditor_name: string;
  account_number: string;
  account_type: string;
  balance: number;
  credit_limit: number;
  status: string;
  date_opened: string;
  last_activity: string;
}

export interface CreditInquiry {
  company: string;
  date: string;
}

export interface Violation {
  title: string;
  description: string;
  affected_account: string;
  legal_basis: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dispute_reason: string;
}

export interface ViolationSummary {
  id: string;
  user_id: string;
  processed_at: string;
  violation_count: number;
  account_count: number;
  inquiry_count: number;
  consumer_name: string;
  risk_level: 'No Violations' | 'Low Risk' | 'Medium Risk' | 'High Risk';
}

/**
 * Helper class for integrating with the Credit Report Processor GCF
 */
export class CreditReportProcessorClient {
  private gcfUrl: string;

  constructor(gcfUrl: string) {
    this.gcfUrl = gcfUrl;
  }

  /**
   * Trigger credit report processing via the Google Cloud Function
   */
  async processCreditReport(
    pdfUrl: string, 
    userId: string
  ): Promise<ProcessCreditReportResponse> {
    const request: ProcessCreditReportRequest = {
      pdf_url: pdfUrl,
      user_id: userId
    };

    try {
      const response = await fetch(this.gcfUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ProcessCreditReportResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error processing credit report:', error);
      throw error;
    }
  }

  /**
   * Get processing status (for polling)
   */
  async getProcessingStatus(analysisId: string): Promise<CreditReportAnalysis | null> {
    // This would require a separate endpoint in the GCF or use Supabase directly
    // For now, this is a placeholder for future implementation
    throw new Error('Status polling not implemented. Use Supabase client directly.');
  }
}

/**
 * Supabase integration helpers
 */
export class CreditReportSupabaseClient {
  private supabase: any; // Replace with proper Supabase client type

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Get all credit report analyses for a user
   */
  async getCreditReportAnalyses(userId: string): Promise<CreditReportAnalysis[]> {
    const { data, error } = await this.supabase
      .from('credit_reports_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('processed_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific credit report analysis
   */
  async getCreditReportAnalysis(analysisId: string): Promise<CreditReportAnalysis | null> {
    const { data, error } = await this.supabase
      .from('credit_reports_analysis')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Supabase error: ${error.message}`);
    }

    return data;
  }

  /**
   * Get violation summaries for a user
   */
  async getViolationSummaries(userId: string): Promise<ViolationSummary[]> {
    const { data, error } = await this.supabase
      .from('credit_report_violation_summary')
      .select('*')
      .eq('user_id', userId)
      .order('processed_at', { ascending: false });

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Delete a credit report analysis
   */
  async deleteCreditReportAnalysis(analysisId: string): Promise<void> {
    const { error } = await this.supabase
      .from('credit_reports_analysis')
      .delete()
      .eq('id', analysisId);

    if (error) {
      throw new Error(`Supabase error: ${error.message}`);
    }
  }

  /**
   * Subscribe to real-time updates for credit report analyses
   */
  subscribeToAnalyses(
    userId: string,
    callback: (payload: any) => void
  ) {
    return this.supabase
      .channel('credit_reports_analysis')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'credit_reports_analysis',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
}

/**
 * React Hook for credit report processing
 */
export function useCreditReportProcessor(gcfUrl: string, supabaseClient: any) {
  const processor = new CreditReportProcessorClient(gcfUrl);
  const supabaseHelper = new CreditReportSupabaseClient(supabaseClient);

  return {
    processor,
    supabaseHelper,
    
    // Convenience methods
    async processReport(pdfUrl: string, userId: string) {
      return processor.processCreditReport(pdfUrl, userId);
    },
    
    async getAnalyses(userId: string) {
      return supabaseHelper.getCreditReportAnalyses(userId);
    },
    
    async getAnalysis(analysisId: string) {
      return supabaseHelper.getCreditReportAnalysis(analysisId);
    },
    
    async getSummaries(userId: string) {
      return supabaseHelper.getViolationSummaries(userId);
    }
  };
}

/**
 * Utility functions
 */
export const CreditReportUtils = {
  /**
   * Format violation severity for display
   */
  formatSeverity(severity: string): string {
    const severityMap: Record<string, string> = {
      LOW: '🟢 Low',
      MEDIUM: '🟡 Medium', 
      HIGH: '🟠 High',
      CRITICAL: '🔴 Critical'
    };
    return severityMap[severity] || severity;
  },

  /**
   * Format risk level for display
   */
  formatRiskLevel(riskLevel: string): string {
    const riskMap: Record<string, string> = {
      'No Violations': '✅ No Issues',
      'Low Risk': '�� Low Risk',
      'Medium Risk': '🟡 Medium Risk',
      'High Risk': '🔴 High Risk'
    };
    return riskMap[riskLevel] || riskLevel;
  },

  /**
   * Calculate credit utilization
   */
  calculateUtilization(balance: number, creditLimit: number): number {
    if (creditLimit === 0) return 0;
    return Math.round((balance / creditLimit) * 100);
  },

  /**
   * Format currency amounts
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  /**
   * Parse date strings
   */
  parseDate(dateString: string): Date | null {
    try {
      return new Date(dateString);
    } catch {
      return null;
    }
  }
};

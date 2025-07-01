// Credit Report Types
// TypeScript definitions for the credit report database schema

export interface CreditReport {
  id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  file_type: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  processing_errors?: string[];
  raw_data?: Record<string, unknown>;
  parsed_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreditAccount {
  id: string;
  credit_report_id: string;
  account_number?: string;
  account_type?: string;
  creditor_name?: string;
  account_status?: string;
  date_opened?: string;
  date_closed?: string;
  date_reported?: string;
  credit_limit?: number;
  high_credit?: number;
  current_balance?: number;
  payment_status?: string;
  payment_history?: string;
  last_payment_date?: string;
  last_payment_amount?: number;
  account_holder?: string;
  responsibility?: string;
  raw_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface NegativeItem {
  id: string;
  credit_account_id: string;
  item_type: 'collection' | 'charge_off' | 'late_payment' | 'bankruptcy' | 'foreclosure' | 'repossession' | 'tax_lien' | 'judgment' | 'inquiry';
  creditor_name?: string;
  account_number?: string;
  original_balance?: number;
  current_balance?: number;
  date_reported?: string;
  date_of_first_delinquency?: string;
  date_of_last_activity?: string;
  status?: string;
  description?: string;
  raw_data?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Violation {
  id: string;
  negative_item_id?: string;
  credit_account_id?: string;
  violation_type: 'metro2_compliance' | 'fcra_violation' | 'fdcpa_violation' | 'other';
  violation_code?: string;
  violation_description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  evidence?: string;
  suggested_action?: string;
  // Enhanced fields from GCF violation detection
  title?: string;
  description?: string;
  legal_basis?: string;
  dispute_reason?: string;
  affected_account?: string;
  creditor_name?: string;
  potential_damages?: string;
  recommended_action?: string;
  created_at: string;
  updated_at: string;
}

// Extended types with relationships
export interface CreditReportWithDetails extends CreditReport {
  credit_accounts?: CreditAccountWithDetails[];
}

export interface CreditAccountWithDetails extends CreditAccount {
  negative_items?: NegativeItemWithDetails[];
}

export interface NegativeItemWithDetails extends NegativeItem {
  violations?: Violation[];
}

// File upload types
export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'extracting' | 'completed' | 'analyzing' | 'analyzed' | 'error' | 'analysis_error';
  error?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

// Processing status types
export interface ProcessingStatus {
  status: CreditReport['status'];
  progress?: number;
  message?: string;
  errors?: string[];
}

// Violation analysis types
export interface ViolationAnalysis {
  total_violations: number;
  critical_violations: number;
  high_violations: number;
  medium_violations: number;
  low_violations: number;
  violations_by_type: Record<string, number>;
  suggested_actions: string[];
}

// Credit report summary
export interface CreditReportSummary {
  total_accounts: number;
  negative_items_count: number;
  violations_count: number;
  average_credit_limit: number;
  total_balance: number;
  payment_history_score: number;
  risk_score: number;
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

export interface CreditInquiry {
  company: string;
  date: string;
} 
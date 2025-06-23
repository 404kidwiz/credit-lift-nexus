// Temporary Supabase types - should be generated from actual database
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string;
          full_name?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      credit_reports: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          file_name: string;
          file_url: string;
          file_size: number;
          file_type: string;
          status?: 'uploaded' | 'processing' | 'processed' | 'failed';
          processing_errors?: string[];
          raw_data?: Record<string, unknown>;
          parsed_data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          file_name?: string;
          file_url?: string;
          file_size?: number;
          file_type?: string;
          status?: 'uploaded' | 'processing' | 'processed' | 'failed';
          processing_errors?: string[];
          raw_data?: Record<string, unknown>;
          parsed_data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      credit_accounts: {
        Row: {
          id: string;
          credit_report_id: string;
          account_number?: string;
          account_type?: string;
          creditor_name?: string;
          account_status?: string;
          date_opened?: string;
          date_closed?: string;
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
        };
        Insert: {
          id?: string;
          credit_report_id: string;
          account_number?: string;
          account_type?: string;
          creditor_name?: string;
          account_status?: string;
          date_opened?: string;
          date_closed?: string;
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
          created_at?: string;
        };
        Update: {
          id?: string;
          credit_report_id?: string;
          account_number?: string;
          account_type?: string;
          creditor_name?: string;
          account_status?: string;
          date_opened?: string;
          date_closed?: string;
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
          created_at?: string;
        };
      };
      negative_items: {
        Row: {
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
        };
        Insert: {
          id?: string;
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
          created_at?: string;
        };
        Update: {
          id?: string;
          credit_account_id?: string;
          item_type?: 'collection' | 'charge_off' | 'late_payment' | 'bankruptcy' | 'foreclosure' | 'repossession' | 'tax_lien' | 'judgment' | 'inquiry';
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
          created_at?: string;
        };
      };
      violations: {
        Row: {
          id: string;
          negative_item_id?: string;
          credit_account_id?: string;
          violation_type: 'metro2_compliance' | 'fcra_violation' | 'fdcpa_violation' | 'other';
          violation_code?: string;
          violation_description: string;
          severity: 'low' | 'medium' | 'high' | 'critical';
          evidence?: string;
          suggested_action?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          negative_item_id?: string;
          credit_account_id?: string;
          violation_type: 'metro2_compliance' | 'fcra_violation' | 'fdcpa_violation' | 'other';
          violation_code?: string;
          violation_description: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          evidence?: string;
          suggested_action?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          negative_item_id?: string;
          credit_account_id?: string;
          violation_type?: 'metro2_compliance' | 'fcra_violation' | 'fdcpa_violation' | 'other';
          violation_code?: string;
          violation_description?: string;
          severity?: 'low' | 'medium' | 'high' | 'critical';
          evidence?: string;
          suggested_action?: string;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

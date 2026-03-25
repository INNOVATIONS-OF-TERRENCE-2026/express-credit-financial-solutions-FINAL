export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achieved_at: string | null
          client_id: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          achieved_at?: string | null
          client_id: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          achieved_at?: string | null
          client_id?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notes: {
        Row: {
          admin_user_id: string | null
          client_id: string | null
          created_at: string
          id: string
          note_text: string
          updated_at: string
        }
        Insert: {
          admin_user_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          note_text: string
          updated_at?: string
        }
        Update: {
          admin_user_id?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          note_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_notes_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      agreements: {
        Row: {
          client_id: string
          id: string
          signed_at: string
          signed_pdf_url: string
        }
        Insert: {
          client_id: string
          id?: string
          signed_at?: string
          signed_pdf_url: string
        }
        Update: {
          client_id?: string
          id?: string
          signed_at?: string
          signed_pdf_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_agreements_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_analysis_results: {
        Row: {
          analysis_type: string
          created_at: string
          credit_report_id: string | null
          fcra_violation_count: number | null
          flagged_count: number | null
          id: string
          model_used: string | null
          overall_utilization: number | null
          raw_result: Json | null
          summary: Json | null
          user_id: string
        }
        Insert: {
          analysis_type?: string
          created_at?: string
          credit_report_id?: string | null
          fcra_violation_count?: number | null
          flagged_count?: number | null
          id?: string
          model_used?: string | null
          overall_utilization?: number | null
          raw_result?: Json | null
          summary?: Json | null
          user_id: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          credit_report_id?: string | null
          fcra_violation_count?: number | null
          flagged_count?: number | null
          id?: string
          model_used?: string | null
          overall_utilization?: number | null
          raw_result?: Json | null
          summary?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_results_credit_report_id_fkey"
            columns: ["credit_report_id"]
            isOneToOne: false
            referencedRelation: "credit_report_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_letter_previews: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          letter_id: string | null
          preview_text: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          letter_id?: string | null
          preview_text: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          letter_id?: string | null
          preview_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_letter_previews_letter_id_fkey"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "dispute_letters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_letter_previews_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ai_letter_previews_letter_id"
            columns: ["letter_id"]
            isOneToOne: false
            referencedRelation: "dispute_letters"
            referencedColumns: ["id"]
          },
        ]
      }
      au_requests: {
        Row: {
          created_at: string
          credit_bureau: string
          email: string
          full_name: string
          id: string
          phone: string | null
          status: string | null
          tradeline_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_bureau: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          status?: string | null
          tradeline_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_bureau?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          status?: string | null
          tradeline_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          record_id: string | null
          risk_score: number | null
          security_level: string | null
          session_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          risk_score?: number | null
          security_level?: string | null
          session_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          record_id?: string | null
          risk_score?: number | null
          security_level?: string | null
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_links: {
        Row: {
          access_token: string | null
          account_id: string | null
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          created_at?: string
          id?: number
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          created_at?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      bulk_upload_batches: {
        Row: {
          created_at: string
          created_by: string
          failed_files: number
          id: string
          matched_files: number
          needs_review_count: number
          processed_files: number
          status: string
          total_files: number
        }
        Insert: {
          created_at?: string
          created_by: string
          failed_files?: number
          id?: string
          matched_files?: number
          needs_review_count?: number
          processed_files?: number
          status?: string
          total_files?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          failed_files?: number
          id?: string
          matched_files?: number
          needs_review_count?: number
          processed_files?: number
          status?: string
          total_files?: number
        }
        Relationships: []
      }
      bulk_upload_files: {
        Row: {
          ai_reason: string | null
          batch_id: string
          confidence_score: number | null
          created_at: string
          detected_document_type: string | null
          extracted_fields: Json | null
          file_name: string
          file_type: string | null
          id: string
          match_status: string
          matched_client_id: string | null
          storage_path: string | null
        }
        Insert: {
          ai_reason?: string | null
          batch_id: string
          confidence_score?: number | null
          created_at?: string
          detected_document_type?: string | null
          extracted_fields?: Json | null
          file_name: string
          file_type?: string | null
          id?: string
          match_status?: string
          matched_client_id?: string | null
          storage_path?: string | null
        }
        Update: {
          ai_reason?: string | null
          batch_id?: string
          confidence_score?: number | null
          created_at?: string
          detected_document_type?: string | null
          extracted_fields?: Json | null
          file_name?: string
          file_type?: string | null
          id?: string
          match_status?: string
          matched_client_id?: string | null
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bulk_upload_files_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "bulk_upload_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bulk_upload_files_matched_client_id_fkey"
            columns: ["matched_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      case_workflow_log: {
        Row: {
          changed_by: string | null
          created_at: string
          dispute_letter_id: string | null
          from_status: string | null
          id: string
          metadata: Json | null
          to_status: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          dispute_letter_id?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json | null
          to_status: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          dispute_letter_id?: string | null
          from_status?: string | null
          id?: string
          metadata?: Json | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_workflow_log_dispute_letter_id_fkey"
            columns: ["dispute_letter_id"]
            isOneToOne: false
            referencedRelation: "dispute_letters"
            referencedColumns: ["id"]
          },
        ]
      }
      cashapp_orders: {
        Row: {
          amount: number
          created_at: string
          email: string
          full_name: string
          id: string
          plan: string
          screenshot_url: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          email: string
          full_name: string
          id?: string
          plan: string
          screenshot_url: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          plan?: string
          screenshot_url?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          created_at: string
          id: string
          message_content: string
          message_role: string
          session_id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_content: string
          message_role: string
          session_id?: string
          timestamp?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_content?: string
          message_role?: string
          session_id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      client_agreements: {
        Row: {
          agreement_version: string | null
          created_at: string
          full_name: string
          id: string
          ip_address: string | null
          signature_data: string
          signed_at: string
          user_id: string
        }
        Insert: {
          agreement_version?: string | null
          created_at?: string
          full_name: string
          id?: string
          ip_address?: string | null
          signature_data: string
          signed_at?: string
          user_id: string
        }
        Update: {
          agreement_version?: string | null
          created_at?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          signature_data?: string
          signed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string | null
          file_path: string | null
          id: string
          notes: string | null
          purchase_id: string | null
          status: string | null
          uploaded_at: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          purchase_id?: string | null
          status?: string | null
          uploaded_at?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          purchase_id?: string | null
          status?: string | null
          uploaded_at?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      client_search_filters: {
        Row: {
          admin_user_id: string | null
          created_at: string
          filter_criteria: Json
          filter_name: string
          id: string
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          filter_criteria: Json
          filter_name: string
          id?: string
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          filter_criteria?: Json
          filter_name?: string
          id?: string
        }
        Relationships: []
      }
      client_timers: {
        Row: {
          created_at: string | null
          current_day: number | null
          end_date: string
          id: string
          paused_reason: string | null
          purchase_id: string | null
          start_date: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_day?: number | null
          end_date: string
          id?: string
          paused_reason?: string | null
          purchase_id?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_day?: number | null
          end_date?: string
          id?: string
          paused_reason?: string | null
          purchase_id?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_timers_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: true
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      client_verification_secure: {
        Row: {
          address_document_url: string | null
          created_at: string
          experian_password_encrypted: string | null
          experian_username_encrypted: string | null
          id: string
          id_document_url: string | null
          ssn_document_url: string | null
          ssn_encrypted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address_document_url?: string | null
          created_at?: string
          experian_password_encrypted?: string | null
          experian_username_encrypted?: string | null
          id?: string
          id_document_url?: string | null
          ssn_document_url?: string | null
          ssn_encrypted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address_document_url?: string | null
          created_at?: string
          experian_password_encrypted?: string | null
          experian_username_encrypted?: string | null
          id?: string
          id_document_url?: string | null
          ssn_document_url?: string | null
          ssn_encrypted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string
          agreement_signed: boolean | null
          created_at: string
          dob: string
          documents_uploaded: number | null
          email: string | null
          full_name: string
          id: string
          membership_plan: string | null
          phone: string
          progress_status: number | null
          ssn_last4: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          agreement_signed?: boolean | null
          created_at?: string
          dob: string
          documents_uploaded?: number | null
          email?: string | null
          full_name: string
          id?: string
          membership_plan?: string | null
          phone: string
          progress_status?: number | null
          ssn_last4: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          agreement_signed?: boolean | null
          created_at?: string
          dob?: string
          documents_uploaded?: number | null
          email?: string | null
          full_name?: string
          id?: string
          membership_plan?: string | null
          phone?: string
          progress_status?: number | null
          ssn_last4?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      "Credit Reports": {
        Row: {
          created_at: string | null
          Fico_score: number | null
          id: string
          negative_items: string | null
          User_id: string
        }
        Insert: {
          created_at?: string | null
          Fico_score?: number | null
          id?: string
          negative_items?: string | null
          User_id?: string
        }
        Update: {
          created_at?: string | null
          Fico_score?: number | null
          id?: string
          negative_items?: string | null
          User_id?: string
        }
        Relationships: []
      }
      credit_alerts: {
        Row: {
          alert_data: Json | null
          alert_description: string | null
          alert_title: string
          alert_type: string
          created_at: string
          id: string
          is_read: boolean | null
          severity: string | null
          user_id: string
        }
        Insert: {
          alert_data?: Json | null
          alert_description?: string | null
          alert_title: string
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          severity?: string | null
          user_id: string
        }
        Update: {
          alert_data?: Json | null
          alert_description?: string | null
          alert_title?: string
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          severity?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_analysis: {
        Row: {
          analysis_text: string | null
          bureau: string | null
          client_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          analysis_text?: string | null
          bureau?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          analysis_text?: string | null
          bureau?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_credit_analysis_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_api_credentials: {
        Row: {
          api_key: string
          api_provider: string
          api_secret: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync: string | null
          password: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          api_key: string
          api_provider: string
          api_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          password?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          api_key?: string
          api_provider?: string
          api_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          password?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      credit_monitoring: {
        Row: {
          created_at: string
          credit_score: number | null
          id: string
          previous_score: number | null
          report_data: Json | null
          score_change: number | null
          score_date: string
          score_provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_score?: number | null
          id?: string
          previous_score?: number | null
          report_data?: Json | null
          score_change?: number | null
          score_date: string
          score_provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_score?: number | null
          id?: string
          previous_score?: number | null
          report_data?: Json | null
          score_change?: number | null
          score_date?: string
          score_provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_report_uploads: {
        Row: {
          ai_analysis_summary: string | null
          analysis_status: string | null
          analysis_url: string | null
          client_id: string | null
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          flagged_accounts_count: number | null
          id: string
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          ai_analysis_summary?: string | null
          analysis_status?: string | null
          analysis_url?: string | null
          client_id?: string | null
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          flagged_accounts_count?: number | null
          id?: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          ai_analysis_summary?: string | null
          analysis_status?: string | null
          analysis_url?: string | null
          client_id?: string | null
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          flagged_accounts_count?: number | null
          id?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_report_uploads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_reports: {
        Row: {
          bureau: string | null
          client_id: string | null
          created_at: string | null
          fico_score: number | null
          file_name: string | null
          id: string
          negative_items: string[] | null
          notes: string | null
          storage_path: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          uploaded_file_url: string | null
          user_id: string
        }
        Insert: {
          bureau?: string | null
          client_id?: string | null
          created_at?: string | null
          fico_score?: number | null
          file_name?: string | null
          id?: string
          negative_items?: string[] | null
          notes?: string | null
          storage_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          uploaded_file_url?: string | null
          user_id: string
        }
        Update: {
          bureau?: string | null
          client_id?: string | null
          created_at?: string | null
          fico_score?: number | null
          file_name?: string | null
          id?: string
          negative_items?: string[] | null
          notes?: string | null
          storage_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          uploaded_file_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_credit_reports_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_scan_summaries: {
        Row: {
          ai_summary: string
          created_at: string
          dispute_opportunities: number | null
          file_name: string
          file_path: string | null
          flagged_accounts: Json | null
          id: string
          user_id: string
        }
        Insert: {
          ai_summary: string
          created_at?: string
          dispute_opportunities?: number | null
          file_name: string
          file_path?: string | null
          flagged_accounts?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          ai_summary?: string
          created_at?: string
          dispute_opportunities?: number | null
          file_name?: string
          file_path?: string | null
          flagged_accounts?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_scores: {
        Row: {
          bureau: string
          client_id: string | null
          created_at: string
          id: string
          score: number
          score_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          bureau: string
          client_id?: string | null
          created_at?: string
          id?: string
          score: number
          score_date: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          bureau?: string
          client_id?: string | null
          created_at?: string
          id?: string
          score?: number
          score_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_users: {
        Row: {
          created_at: string
          demo_data: Json | null
          id: string
          is_demo: boolean | null
          last_reset: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          demo_data?: Json | null
          id?: string
          is_demo?: boolean | null
          last_reset?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          demo_data?: Json | null
          id?: string
          is_demo?: boolean | null
          last_reset?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dispute_docs: {
        Row: {
          account_number: string | null
          created_at: string
          file_type: string
          file_url: string
          id: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          created_at?: string
          file_type: string
          file_url: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          created_at?: string
          file_type?: string
          file_url?: string
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dispute_letters: {
        Row: {
          account_name: string | null
          account_number: string | null
          additional_notes: string | null
          admin_review_notes: string | null
          assigned_admin: string | null
          authorized_user: string | null
          auto_send: boolean | null
          bureau: string | null
          case_status: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          creditor_name: string | null
          date_created: string | null
          dispute_reason: string
          draft_version: number | null
          full_name: string | null
          generated_letter: string
          id: string
          issue_type: string | null
          letter_body: string | null
          letter_title: string
          letter_type: string | null
          previous_drafts: Json | null
          signature_url: string | null
          status_updated_at: string | null
          uploaded_file_url: string | null
          user_id: string | null
          violation_notes: string | null
        }
        Insert: {
          account_name?: string | null
          account_number?: string | null
          additional_notes?: string | null
          admin_review_notes?: string | null
          assigned_admin?: string | null
          authorized_user?: string | null
          auto_send?: boolean | null
          bureau?: string | null
          case_status?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          creditor_name?: string | null
          date_created?: string | null
          dispute_reason: string
          draft_version?: number | null
          full_name?: string | null
          generated_letter: string
          id?: string
          issue_type?: string | null
          letter_body?: string | null
          letter_title: string
          letter_type?: string | null
          previous_drafts?: Json | null
          signature_url?: string | null
          status_updated_at?: string | null
          uploaded_file_url?: string | null
          user_id?: string | null
          violation_notes?: string | null
        }
        Update: {
          account_name?: string | null
          account_number?: string | null
          additional_notes?: string | null
          admin_review_notes?: string | null
          assigned_admin?: string | null
          authorized_user?: string | null
          auto_send?: boolean | null
          bureau?: string | null
          case_status?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          creditor_name?: string | null
          date_created?: string | null
          dispute_reason?: string
          draft_version?: number | null
          full_name?: string | null
          generated_letter?: string
          id?: string
          issue_type?: string | null
          letter_body?: string | null
          letter_title?: string
          letter_type?: string | null
          previous_drafts?: Json | null
          signature_url?: string | null
          status_updated_at?: string | null
          uploaded_file_url?: string | null
          user_id?: string | null
          violation_notes?: string | null
        }
        Relationships: []
      }
      dispute_timeline: {
        Row: {
          account_number: string
          actual_response_date: string | null
          created_at: string
          creditor_name: string
          date_generated: string | null
          date_mailed: string | null
          deadline_date: string | null
          dispute_letter_id: string | null
          estimated_response_date: string | null
          id: string
          outcome: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          actual_response_date?: string | null
          created_at?: string
          creditor_name: string
          date_generated?: string | null
          date_mailed?: string | null
          deadline_date?: string | null
          dispute_letter_id?: string | null
          estimated_response_date?: string | null
          id?: string
          outcome?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          actual_response_date?: string | null
          created_at?: string
          creditor_name?: string
          date_generated?: string | null
          date_mailed?: string | null
          deadline_date?: string | null
          dispute_letter_id?: string | null
          estimated_response_date?: string | null
          id?: string
          outcome?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispute_timeline_dispute_letter_id_fkey"
            columns: ["dispute_letter_id"]
            isOneToOne: false
            referencedRelation: "dispute_letters"
            referencedColumns: ["id"]
          },
        ]
      }
      document_archive: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          upload_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      document_classification_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          document_type: string | null
          extracted_text: string | null
          file_id: string
          id: string
          structured_data: Json | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          document_type?: string | null
          extracted_text?: string | null
          file_id: string
          id?: string
          structured_data?: Json | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          document_type?: string | null
          extracted_text?: string | null
          file_id?: string
          id?: string
          structured_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "document_classification_results_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "bulk_upload_files"
            referencedColumns: ["id"]
          },
        ]
      }
      document_match_reviews: {
        Row: {
          admin_selected_client_id: string | null
          created_at: string
          file_id: string
          id: string
          notes: string | null
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          suggested_client_id: string | null
        }
        Insert: {
          admin_selected_client_id?: string | null
          created_at?: string
          file_id: string
          id?: string
          notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          suggested_client_id?: string | null
        }
        Update: {
          admin_selected_client_id?: string | null
          created_at?: string
          file_id?: string
          id?: string
          notes?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          suggested_client_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_match_reviews_admin_selected_client_id_fkey"
            columns: ["admin_selected_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_match_reviews_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "bulk_upload_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_match_reviews_suggested_client_id_fkey"
            columns: ["suggested_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_uploads: {
        Row: {
          admin_notes: string | null
          admin_status: string | null
          ai_analysis_result: string | null
          created_at: string
          document_type: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          tag: string | null
          updated_at: string
          upload_date: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          admin_status?: string | null
          ai_analysis_result?: string | null
          created_at?: string
          document_type: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          tag?: string | null
          updated_at?: string
          upload_date?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          admin_status?: string | null
          ai_analysis_result?: string | null
          created_at?: string
          document_type?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          tag?: string | null
          updated_at?: string
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_id: string | null
          doc_type: string
          file_path: string
          id: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          doc_type: string
          file_path: string
          id?: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          doc_type?: string
          file_path?: string
          id?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      education_progress: {
        Row: {
          badges_earned: Json | null
          completed_at: string | null
          created_at: string
          id: string
          progress_percentage: number | null
          topic: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          badges_earned?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_percentage?: number | null
          topic: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          badges_earned?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          progress_percentage?: number | null
          topic?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      experian_credentials: {
        Row: {
          created_at: string | null
          id: string
          last_verified: string | null
          password_encrypted: string | null
          purchase_id: string | null
          submitted_at: string | null
          user_id: string
          username_encrypted: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_verified?: string | null
          password_encrypted?: string | null
          purchase_id?: string | null
          submitted_at?: string | null
          user_id: string
          username_encrypted?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_verified?: string | null
          password_encrypted?: string | null
          purchase_id?: string | null
          submitted_at?: string | null
          user_id?: string
          username_encrypted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experian_credentials_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      file_upload_config: {
        Row: {
          allowed_file_types: string[]
          created_at: string
          id: string
          max_file_size_mb: number
        }
        Insert: {
          allowed_file_types?: string[]
          created_at?: string
          id?: string
          max_file_size_mb?: number
        }
        Update: {
          allowed_file_types?: string[]
          created_at?: string
          id?: string
          max_file_size_mb?: number
        }
        Relationships: []
      }
      flagged_disputes: {
        Row: {
          account_number: string | null
          account_type: string | null
          additional_details: Json | null
          admin_approved: boolean | null
          admin_notes: string | null
          admin_reviewed: boolean | null
          balance: number | null
          created_at: string
          credit_report_id: string | null
          creditor_name: string
          dispute_letter_generated: boolean | null
          extraction_version: number | null
          flag_confidence: number | null
          flag_reason: string
          id: string
          recommended_dispute_type: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
          validated_data: Json | null
          violation_type: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          additional_details?: Json | null
          admin_approved?: boolean | null
          admin_notes?: string | null
          admin_reviewed?: boolean | null
          balance?: number | null
          created_at?: string
          credit_report_id?: string | null
          creditor_name: string
          dispute_letter_generated?: boolean | null
          extraction_version?: number | null
          flag_confidence?: number | null
          flag_reason: string
          id?: string
          recommended_dispute_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status: string
          updated_at?: string
          user_id: string
          validated_data?: Json | null
          violation_type?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          additional_details?: Json | null
          admin_approved?: boolean | null
          admin_notes?: string | null
          admin_reviewed?: boolean | null
          balance?: number | null
          created_at?: string
          credit_report_id?: string | null
          creditor_name?: string
          dispute_letter_generated?: boolean | null
          extraction_version?: number | null
          flag_confidence?: number | null
          flag_reason?: string
          id?: string
          recommended_dispute_type?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          validated_data?: Json | null
          violation_type?: string | null
        }
        Relationships: []
      }
      identity_docs: {
        Row: {
          client_id: string
          created_at: string
          doc_type: string
          id: string
          uploaded_file_url: string
        }
        Insert: {
          client_id: string
          created_at?: string
          doc_type: string
          id?: string
          uploaded_file_url: string
        }
        Update: {
          client_id?: string
          created_at?: string
          doc_type?: string
          id?: string
          uploaded_file_url?: string
        }
        Relationships: []
      }
      mailing_bundles: {
        Row: {
          bundle_name: string
          client_id: string | null
          created_at: string
          generated_at: string | null
          id: string
          status: string | null
          zip_file_url: string | null
        }
        Insert: {
          bundle_name: string
          client_id?: string | null
          created_at?: string
          generated_at?: string | null
          id?: string
          status?: string | null
          zip_file_url?: string | null
        }
        Update: {
          bundle_name?: string
          client_id?: string | null
          created_at?: string
          generated_at?: string | null
          id?: string
          status?: string | null
          zip_file_url?: string | null
        }
        Relationships: []
      }
      messaging_log: {
        Row: {
          channel: string
          created_at: string | null
          id: string
          message_content: string | null
          message_type: string
          purchase_id: string | null
          sent_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          channel: string
          created_at?: string | null
          id?: string
          message_content?: string | null
          message_type: string
          purchase_id?: string | null
          sent_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string | null
          id?: string
          message_content?: string | null
          message_type?: string
          purchase_id?: string | null
          sent_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messaging_log_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          created_at: string
          details: Json | null
          email_error: string | null
          email_sent: boolean | null
          id: string
          notification_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          email_error?: string | null
          email_sent?: boolean | null
          id?: string
          notification_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          email_error?: string | null
          email_sent?: boolean | null
          id?: string
          notification_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          amount_paid: number
          card_last_four: string | null
          client_name: string
          created_at: string
          email_sent: boolean | null
          id: string
          membership_level: string
          payment_date: string
          receipt_id: string
          receipt_pdf_url: string | null
          stripe_payment_intent_id: string | null
          user_id: string | null
        }
        Insert: {
          amount_paid: number
          card_last_four?: string | null
          client_name: string
          created_at?: string
          email_sent?: boolean | null
          id?: string
          membership_level: string
          payment_date?: string
          receipt_id: string
          receipt_pdf_url?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount_paid?: number
          card_last_four?: string | null
          client_name?: string
          created_at?: string
          email_sent?: boolean | null
          id?: string
          membership_level?: string
          payment_date?: string
          receipt_id?: string
          receipt_pdf_url?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number | null
          client_id: string | null
          id: string
          payment_date: string | null
          stripe_receipt_url: string | null
        }
        Insert: {
          amount?: number | null
          client_id?: string | null
          id?: string
          payment_date?: string | null
          stripe_receipt_url?: string | null
        }
        Update: {
          amount?: number | null
          client_id?: string | null
          id?: string
          payment_date?: string | null
          stripe_receipt_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_payments_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          completed_at: string | null
          created_at: string | null
          day_number: number
          id: string
          notes: string | null
          purchase_id: string | null
          stage_description: string | null
          stage_name: string
          started_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          day_number: number
          id?: string
          notes?: string | null
          purchase_id?: string | null
          stage_description?: string | null
          stage_name: string
          started_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          day_number?: number
          id?: string
          notes?: string | null
          purchase_id?: string | null
          stage_description?: string | null
          stage_name?: string
          started_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          stripe_product_id: string
          turnaround_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price: number
          stripe_product_id: string
          turnaround_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          stripe_product_id?: string
          turnaround_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_expires_at: string | null
          active_services: string[] | null
          created_at: string
          date_of_birth: string | null
          email: string
          expires_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          membership: string | null
          membership_plan: string | null
          membership_type: string | null
          middle_name: string | null
          payment_status: string | null
          plan_type: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed_at: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_expires_at?: string | null
          active_services?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          expires_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          membership?: string | null
          membership_plan?: string | null
          membership_type?: string | null
          middle_name?: string | null
          payment_status?: string | null
          plan_type?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_expires_at?: string | null
          active_services?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          expires_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          membership?: string | null
          membership_plan?: string | null
          membership_type?: string | null
          middle_name?: string | null
          payment_status?: string | null
          plan_type?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          product_id: string | null
          purchased_at: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          product_id?: string | null
          purchased_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          product_id?: string | null
          purchased_at?: string | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          client_id: string
          created_at: string | null
          id: string
          referred_email: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          id?: string
          referred_email: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          id?: string
          referred_email?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number
          created_at: string
          email: string
          id: string
          payment_frequency: string
          payment_status: string
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          email: string
          id?: string
          payment_frequency: string
          payment_status?: string
          plan: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          email?: string
          id?: string
          payment_frequency?: string
          payment_status?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number | null
          id: string
          replay_count: number | null
          skipped: boolean | null
          tour_completed: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          id?: string
          replay_count?: number | null
          skipped?: boolean | null
          tour_completed?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          id?: string
          replay_count?: number | null
          skipped?: boolean | null
          tour_completed?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          code_type: string | null
          created_at: string | null
          id: string
          purchase_id: string | null
          status: string | null
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          code_type?: string | null
          created_at?: string | null
          id?: string
          purchase_id?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          code_type?: string | null
          created_at?: string | null
          id?: string
          purchase_id?: string | null
          status?: string | null
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_codes_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      violation_flags: {
        Row: {
          client_id: string
          file_name: string
          id: string
          violation_type: string
        }
        Insert: {
          client_id: string
          file_name: string
          id?: string
          violation_type: string
        }
        Update: {
          client_id?: string
          file_name?: string
          id?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "violation_flags_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bank_links_safe: {
        Row: {
          account_id: string | null
          created_at: string | null
          id: number | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          id?: number | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          id?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      credit_api_credentials_safe: {
        Row: {
          api_provider: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          last_sync: string | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          api_provider?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          last_sync?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          api_provider?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          last_sync?: string | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      decrypt_plaid_token: {
        Args: { encrypted_token: string }
        Returns: string
      }
      decrypt_plaid_token_with_audit: {
        Args: { encrypted_token: string }
        Returns: string
      }
      decrypt_ssn_secure: { Args: { encrypted_ssn: string }; Returns: string }
      encrypt_plaid_token: { Args: { token_text: string }; Returns: string }
      encrypt_ssn_secure: { Args: { ssn_text: string }; Returns: string }
      expire_vip_trials: { Args: never; Returns: undefined }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_security_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_record_id?: string
          p_risk_score?: number
          p_security_level?: string
          p_table_name: string
        }
        Returns: undefined
      }
      validate_case_transition: {
        Args: { from_status: string; to_status: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      case_status:
        | "intake_received"
        | "documents_missing"
        | "extracted"
        | "validation_failed"
        | "validation_passed"
        | "draft_generated"
        | "needs_admin_review"
        | "approved"
        | "exported"
        | "followup_due"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      case_status: [
        "intake_received",
        "documents_missing",
        "extracted",
        "validation_failed",
        "validation_passed",
        "draft_generated",
        "needs_admin_review",
        "approved",
        "exported",
        "followup_due",
      ],
    },
  },
} as const

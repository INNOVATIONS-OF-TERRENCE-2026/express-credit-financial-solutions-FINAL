export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
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
            foreignKeyName: "agreements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
            foreignKeyName: "ai_letter_previews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_letter_previews_letter_id_fkey"
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          account_id?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          account_id?: string | null
          created_at?: string
          id?: number
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
      clients: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string
          email_address: string
          full_name: string
          id: string
          membership_plan: string | null
          phone_number: string
          ssn: string
          ssn_last4: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth: string
          email_address: string
          full_name: string
          id?: string
          membership_plan?: string | null
          phone_number: string
          ssn: string
          ssn_last4?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string
          email_address?: string
          full_name?: string
          id?: string
          membership_plan?: string | null
          phone_number?: string
          ssn?: string
          ssn_last4?: string | null
          updated_at?: string
          user_id?: string
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
      credit_reports: {
        Row: {
          bureau: string | null
          client_id: string | null
          created_at: string | null
          fico_score: number
          id: string
          negative_items: string[] | null
          notes: string | null
          uploaded_file_url: string | null
          user_id: string
        }
        Insert: {
          bureau?: string | null
          client_id?: string | null
          created_at?: string | null
          fico_score: number
          id?: string
          negative_items?: string[] | null
          notes?: string | null
          uploaded_file_url?: string | null
          user_id: string
        }
        Update: {
          bureau?: string | null
          client_id?: string | null
          created_at?: string | null
          fico_score?: number
          id?: string
          negative_items?: string[] | null
          notes?: string | null
          uploaded_file_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_reports_client_id_fkey"
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
          account_number: string
          additional_notes: string | null
          bureau: string | null
          client_id: string | null
          created_at: string | null
          creditor_name: string
          generated_letter: string
          id: string
          issue_type: string
          letter_title: string | null
          uploaded_file_url: string | null
          user_id: string
          violation_notes: string | null
        }
        Insert: {
          account_number: string
          additional_notes?: string | null
          bureau?: string | null
          client_id?: string | null
          created_at?: string | null
          creditor_name: string
          generated_letter: string
          id?: string
          issue_type: string
          letter_title?: string | null
          uploaded_file_url?: string | null
          user_id: string
          violation_notes?: string | null
        }
        Update: {
          account_number?: string
          additional_notes?: string | null
          bureau?: string | null
          client_id?: string | null
          created_at?: string | null
          creditor_name?: string
          generated_letter?: string
          id?: string
          issue_type?: string
          letter_title?: string | null
          uploaded_file_url?: string | null
          user_id?: string
          violation_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_letters_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_timeline: {
        Row: {
          account_number: string
          actual_response_date: string | null
          created_at: string
          creditor_name: string
          date_generated: string | null
          date_mailed: string | null
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
          doc_type: string
          file_path: string
          id: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          doc_type: string
          file_path: string
          id?: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          doc_type?: string
          file_path?: string
          id?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          flag_confidence: number | null
          flag_reason: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
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
          flag_confidence?: number | null
          flag_reason: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status: string
          updated_at?: string
          user_id: string
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
          flag_confidence?: number | null
          flag_reason?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
        Relationships: [
          {
            foreignKeyName: "identity_docs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      profiles: {
        Row: {
          access_expires_at: string | null
          created_at: string
          email: string
          expires_at: string | null
          id: string
          membership: string | null
          membership_plan: string | null
          membership_type: string | null
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
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          membership?: string | null
          membership_plan?: string | null
          membership_type?: string | null
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
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          membership?: string | null
          membership_plan?: string | null
          membership_type?: string | null
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
      wrappers_fdw_stats: {
        Row: {
          bytes_in: number | null
          bytes_out: number | null
          create_times: number | null
          created_at: string
          fdw_name: string
          metadata: Json | null
          rows_in: number | null
          rows_out: number | null
          updated_at: string
        }
        Insert: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Update: {
          bytes_in?: number | null
          bytes_out?: number | null
          create_times?: number | null
          created_at?: string
          fdw_name?: string
          metadata?: Json | null
          rows_in?: number | null
          rows_out?: number | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      airtable_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      airtable_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      airtable_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      auth0_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      auth0_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      auth0_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      big_query_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      big_query_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      big_query_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      click_house_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      click_house_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      click_house_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      cognito_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      cognito_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      cognito_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      decrypt_ssn: {
        Args: { encrypted_ssn: string }
        Returns: string
      }
      decrypt_ssn_secure: {
        Args: { encrypted_ssn: string }
        Returns: string
      }
      duckdb_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      duckdb_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      duckdb_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      encrypt_ssn: {
        Args: { ssn_text: string }
        Returns: string
      }
      encrypt_ssn_secure: {
        Args: { ssn_text: string }
        Returns: string
      }
      expire_vip_trials: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      firebase_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      firebase_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      firebase_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hello_world_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      hello_world_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      hello_world_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      iceberg_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      iceberg_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      iceberg_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_table_name: string
          p_record_id?: string
          p_details?: Json
          p_security_level?: string
          p_risk_score?: number
        }
        Returns: undefined
      }
      logflare_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      logflare_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      logflare_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      mssql_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      mssql_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      mssql_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      redis_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      redis_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      redis_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      s3_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      s3_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      s3_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      stripe_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      stripe_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      stripe_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
      wasm_fdw_handler: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      wasm_fdw_meta: {
        Args: Record<PropertyKey, never>
        Returns: {
          name: string
          version: string
          author: string
          website: string
        }[]
      }
      wasm_fdw_validator: {
        Args: { options: string[]; catalog: unknown }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const

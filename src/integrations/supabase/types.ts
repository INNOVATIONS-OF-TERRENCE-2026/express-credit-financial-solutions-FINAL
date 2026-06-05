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
          {
            foreignKeyName: "achievements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
          {
            foreignKeyName: "fk_admin_notes_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      admin_reminders: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string
          id: string
          is_completed: boolean
          reminder_type: string
          title: string
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at: string
          id?: string
          is_completed?: boolean
          reminder_type?: string
          title: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string
          id?: string
          is_completed?: boolean
          reminder_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_reminders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      admin_tasks: {
        Row: {
          category: string
          client_id: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          client_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          client_id?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
          {
            foreignKeyName: "fk_agreements_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      ai_agent_runs: {
        Row: {
          agent_name: string
          confidence_score: number | null
          created_at: string
          id: string
          input_payload: Json | null
          output_payload: Json | null
          status: string
          workflow_id: string
        }
        Insert: {
          agent_name: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          status?: string
          workflow_id: string
        }
        Update: {
          agent_name?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          status?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "ai_workflows"
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
            foreignKeyName: "fk_ai_letter_previews_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
      ai_workflows: {
        Row: {
          client_id: string
          confidence_score: number | null
          created_at: string
          current_step: string | null
          cycle_id: string | null
          id: string
          results: Json | null
          status: string
          updated_at: string
          workflow_type: string
        }
        Insert: {
          client_id: string
          confidence_score?: number | null
          created_at?: string
          current_step?: string | null
          cycle_id?: string | null
          id?: string
          results?: Json | null
          status?: string
          updated_at?: string
          workflow_type?: string
        }
        Update: {
          client_id?: string
          confidence_score?: number | null
          created_at?: string
          current_step?: string | null
          cycle_id?: string | null
          id?: string
          results?: Json | null
          status?: string
          updated_at?: string
          workflow_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_workflows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_workflows_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "ai_workflows_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "client_processing_cycles"
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
      automation_events: {
        Row: {
          client_id: string | null
          created_at: string
          error_message: string | null
          event_source: string | null
          event_type: string
          id: string
          payload: Json | null
          processed_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          event_source?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          event_source?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      autonomous_jobs: {
        Row: {
          client_id: string | null
          completed_at: string | null
          confidence_score: number | null
          created_at: string
          document_upload_id: string | null
          error_message: string | null
          id: string
          job_type: string
          result_data: Json | null
          status: string
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          document_upload_id?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          result_data?: Json | null
          status?: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          confidence_score?: number | null
          created_at?: string
          document_upload_id?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          result_data?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autonomous_jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      autonomous_settings: {
        Row: {
          auto_attach_threshold: number | null
          auto_generate_disputes: boolean | null
          autonomous_enabled: boolean | null
          id: string
          review_threshold: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          auto_attach_threshold?: number | null
          auto_generate_disputes?: boolean | null
          autonomous_enabled?: boolean | null
          id?: string
          review_threshold?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          auto_attach_threshold?: number | null
          auto_generate_disputes?: boolean | null
          autonomous_enabled?: boolean | null
          id?: string
          review_threshold?: number | null
          updated_at?: string | null
          updated_by?: string | null
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
          batch_id: string | null
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
          batch_id?: string | null
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
          batch_id?: string | null
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
          {
            foreignKeyName: "bulk_upload_files_matched_client_id_fkey"
            columns: ["matched_client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
      client_activity_timeline: {
        Row: {
          activity_type: string
          client_id: string | null
          created_at: string
          created_by_source: string | null
          description: string | null
          id: string
          metadata: Json | null
          title: string
          user_id: string | null
          visible_to_admin: boolean | null
          visible_to_client: boolean | null
        }
        Insert: {
          activity_type: string
          client_id?: string | null
          created_at?: string
          created_by_source?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          user_id?: string | null
          visible_to_admin?: boolean | null
          visible_to_client?: boolean | null
        }
        Update: {
          activity_type?: string
          client_id?: string | null
          created_at?: string
          created_by_source?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string | null
          visible_to_admin?: boolean | null
          visible_to_client?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_timeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_activity_timeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_agreements: {
        Row: {
          agreement_version: string | null
          client_id: string | null
          created_at: string
          full_name: string
          id: string
          ip_address: string | null
          signature_data: string
          signed_at: string
          signed_pdf_path: string | null
          user_id: string
        }
        Insert: {
          agreement_version?: string | null
          client_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          ip_address?: string | null
          signature_data: string
          signed_at?: string
          signed_pdf_path?: string | null
          user_id: string
        }
        Update: {
          agreement_version?: string | null
          client_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          ip_address?: string | null
          signature_data?: string
          signed_at?: string
          signed_pdf_path?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_credit_scores: {
        Row: {
          client_id: string
          equifax_score: number | null
          experian_score: number | null
          id: string
          source: string
          transunion_score: number | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          client_id: string
          equifax_score?: number | null
          experian_score?: number | null
          id?: string
          source?: string
          transunion_score?: number | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          client_id?: string
          equifax_score?: number | null
          experian_score?: number | null
          id?: string
          source?: string
          transunion_score?: number | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_credit_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_credit_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_intelligence_packets: {
        Row: {
          bureau_summary: Json | null
          client_id: string
          created_at: string
          cycle_id: string | null
          dob: string | null
          full_address: string | null
          full_name: string | null
          id: string
          identity_summary: Json | null
          inquiries: Json | null
          negative_accounts: Json | null
          outdated_personal_info: Json | null
          source_report_id: string | null
          ssn_last4: string | null
          status: string
          strategy_confidence: number | null
          strategy_type: string | null
          updated_at: string
          violations_identified: Json | null
        }
        Insert: {
          bureau_summary?: Json | null
          client_id: string
          created_at?: string
          cycle_id?: string | null
          dob?: string | null
          full_address?: string | null
          full_name?: string | null
          id?: string
          identity_summary?: Json | null
          inquiries?: Json | null
          negative_accounts?: Json | null
          outdated_personal_info?: Json | null
          source_report_id?: string | null
          ssn_last4?: string | null
          status?: string
          strategy_confidence?: number | null
          strategy_type?: string | null
          updated_at?: string
          violations_identified?: Json | null
        }
        Update: {
          bureau_summary?: Json | null
          client_id?: string
          created_at?: string
          cycle_id?: string | null
          dob?: string | null
          full_address?: string | null
          full_name?: string | null
          id?: string
          identity_summary?: Json | null
          inquiries?: Json | null
          negative_accounts?: Json | null
          outdated_personal_info?: Json | null
          source_report_id?: string | null
          ssn_last4?: string | null
          status?: string
          strategy_confidence?: number | null
          strategy_type?: string | null
          updated_at?: string
          violations_identified?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "client_intelligence_packets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_intelligence_packets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "client_intelligence_packets_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "client_processing_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notes: {
        Row: {
          client_id: string
          created_at: string | null
          created_by: string | null
          id: string
          note_body: string
          note_type: string | null
        }
        Insert: {
          client_id: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_body: string
          note_type?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          note_body?: string
          note_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_notifications: {
        Row: {
          channel: string
          client_id: string | null
          created_at: string
          error_message: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          payload: Json | null
          provider: string | null
          sent_at: string | null
          status: string
          subject: string | null
          user_id: string | null
        }
        Insert: {
          channel?: string
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          payload?: Json | null
          provider?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string
          client_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          payload?: Json | null
          provider?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_payment_summary: {
        Row: {
          client_id: string
          created_at: string
          expected_amount: number
          id: string
          notes: string | null
          paid_amount: number
          payment_date: string | null
          payment_method: string | null
          payment_status: string
          receipt_reference: string | null
          service_type: string | null
          updated_at: string
          user_id: string | null
          verified_by_admin: boolean
          visible_to_client: boolean
        }
        Insert: {
          client_id: string
          created_at?: string
          expected_amount?: number
          id?: string
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          receipt_reference?: string | null
          service_type?: string | null
          updated_at?: string
          user_id?: string | null
          verified_by_admin?: boolean
          visible_to_client?: boolean
        }
        Update: {
          client_id?: string
          created_at?: string
          expected_amount?: number
          id?: string
          notes?: string | null
          paid_amount?: number
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string
          receipt_reference?: string | null
          service_type?: string | null
          updated_at?: string
          user_id?: string | null
          verified_by_admin?: boolean
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "client_payment_summary_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_payment_summary_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_processing_cycles: {
        Row: {
          client_id: string | null
          created_at: string
          cycle_type: string
          id: string
          source_credit_report_id: string | null
          source_document_batch_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          cycle_type?: string
          id?: string
          source_credit_report_id?: string | null
          source_document_batch_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          cycle_type?: string
          id?: string
          source_credit_report_id?: string | null
          source_document_batch_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_processing_cycles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_processing_cycles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      client_registry_exclusions: {
        Row: {
          created_at: string
          email: string | null
          excluded_by: string | null
          id: string
          name: string | null
          notes: string | null
          reason: string | null
          source_id: string
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          excluded_by?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          reason?: string | null
          source_id: string
          source_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          excluded_by?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          reason?: string | null
          source_id?: string
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      client_timeline: {
        Row: {
          client_id: string
          created_at: string | null
          event_label: string
          event_meta: Json | null
          event_type: string
          id: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          event_label: string
          event_meta?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          event_label?: string
          event_meta?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_timeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_timeline_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
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
          access_services_enabled: boolean | null
          accounts_deleted_count: number | null
          address: string | null
          admin_notes: string | null
          agreement_signed: boolean | null
          client_visible_update: string | null
          created_at: string
          current_dispute_round: number | null
          current_score_eq: number | null
          current_score_ex: number | null
          current_score_tu: number | null
          debt_removed_total: number | null
          dob: string | null
          documents_uploaded: number | null
          email: string | null
          ftc_605b_readiness_status: string | null
          full_name: string
          hard_inquiries_removed: number | null
          id: string
          membership_plan: string | null
          mortgage_readiness_status: string | null
          next_action: string | null
          next_step_note: string | null
          not_a_client: boolean
          notes_summary: string | null
          onboarding_status: string | null
          payment_status: string | null
          personal_info_items_removed: number | null
          phone: string | null
          portal_status: string | null
          priority_level: string | null
          progress_status: number | null
          remaining_negatives: number | null
          round_number: number | null
          service_status: string | null
          ssn_encrypted: string | null
          ssn_last4: string | null
          starting_score_eq: number | null
          starting_score_ex: number | null
          starting_score_tu: number | null
          status: string | null
          updated_at: string
          user_id: string | null
          workflow_status: string | null
        }
        Insert: {
          access_services_enabled?: boolean | null
          accounts_deleted_count?: number | null
          address?: string | null
          admin_notes?: string | null
          agreement_signed?: boolean | null
          client_visible_update?: string | null
          created_at?: string
          current_dispute_round?: number | null
          current_score_eq?: number | null
          current_score_ex?: number | null
          current_score_tu?: number | null
          debt_removed_total?: number | null
          dob?: string | null
          documents_uploaded?: number | null
          email?: string | null
          ftc_605b_readiness_status?: string | null
          full_name: string
          hard_inquiries_removed?: number | null
          id?: string
          membership_plan?: string | null
          mortgage_readiness_status?: string | null
          next_action?: string | null
          next_step_note?: string | null
          not_a_client?: boolean
          notes_summary?: string | null
          onboarding_status?: string | null
          payment_status?: string | null
          personal_info_items_removed?: number | null
          phone?: string | null
          portal_status?: string | null
          priority_level?: string | null
          progress_status?: number | null
          remaining_negatives?: number | null
          round_number?: number | null
          service_status?: string | null
          ssn_encrypted?: string | null
          ssn_last4?: string | null
          starting_score_eq?: number | null
          starting_score_ex?: number | null
          starting_score_tu?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          workflow_status?: string | null
        }
        Update: {
          access_services_enabled?: boolean | null
          accounts_deleted_count?: number | null
          address?: string | null
          admin_notes?: string | null
          agreement_signed?: boolean | null
          client_visible_update?: string | null
          created_at?: string
          current_dispute_round?: number | null
          current_score_eq?: number | null
          current_score_ex?: number | null
          current_score_tu?: number | null
          debt_removed_total?: number | null
          dob?: string | null
          documents_uploaded?: number | null
          email?: string | null
          ftc_605b_readiness_status?: string | null
          full_name?: string
          hard_inquiries_removed?: number | null
          id?: string
          membership_plan?: string | null
          mortgage_readiness_status?: string | null
          next_action?: string | null
          next_step_note?: string | null
          not_a_client?: boolean
          notes_summary?: string | null
          onboarding_status?: string | null
          payment_status?: string | null
          personal_info_items_removed?: number | null
          phone?: string | null
          portal_status?: string | null
          priority_level?: string | null
          progress_status?: number | null
          remaining_negatives?: number | null
          round_number?: number | null
          service_status?: string | null
          ssn_encrypted?: string | null
          ssn_last4?: string | null
          starting_score_eq?: number | null
          starting_score_ex?: number | null
          starting_score_tu?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
          workflow_status?: string | null
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
          {
            foreignKeyName: "fk_credit_analysis_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
          match_checked_at: string | null
          match_error: string | null
          match_reasons: Json | null
          match_score: number | null
          match_status: string | null
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
          match_checked_at?: string | null
          match_error?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          match_status?: string | null
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
          match_checked_at?: string | null
          match_error?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          match_status?: string | null
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
          {
            foreignKeyName: "credit_report_uploads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
          is_current: boolean
          negative_items: string[] | null
          notes: string | null
          storage_path: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          uploaded_file_url: string | null
          user_id: string
          version: number
        }
        Insert: {
          bureau?: string | null
          client_id?: string | null
          created_at?: string | null
          fico_score?: number | null
          file_name?: string | null
          id?: string
          is_current?: boolean
          negative_items?: string[] | null
          notes?: string | null
          storage_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          uploaded_file_url?: string | null
          user_id: string
          version?: number
        }
        Update: {
          bureau?: string | null
          client_id?: string | null
          created_at?: string | null
          fico_score?: number | null
          file_name?: string | null
          id?: string
          is_current?: boolean
          negative_items?: string[] | null
          notes?: string | null
          storage_path?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          uploaded_file_url?: string | null
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_credit_reports_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_credit_reports_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
          {
            foreignKeyName: "credit_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
      document_ai_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          detected_doc_type: string | null
          document_id: string | null
          extracted_address: string | null
          extracted_dob: string | null
          extracted_name: string | null
          extracted_ssn_last4: string | null
          id: string
          is_verified: boolean | null
          match_reason: string | null
          matched_client_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          detected_doc_type?: string | null
          document_id?: string | null
          extracted_address?: string | null
          extracted_dob?: string | null
          extracted_name?: string | null
          extracted_ssn_last4?: string | null
          id?: string
          is_verified?: boolean | null
          match_reason?: string | null
          matched_client_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          detected_doc_type?: string | null
          document_id?: string | null
          extracted_address?: string | null
          extracted_dob?: string | null
          extracted_name?: string | null
          extracted_ssn_last4?: string | null
          id?: string
          is_verified?: boolean | null
          match_reason?: string | null
          matched_client_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_ai_results_matched_client_id_fkey"
            columns: ["matched_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_ai_results_matched_client_id_fkey"
            columns: ["matched_client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      document_archive: {
        Row: {
          ai_analysis: string | null
          bureau: string | null
          client_id: string | null
          created_at: string
          doc_type: string | null
          document_type: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          upload_date: string
          uploaded_file_url: string | null
          user_id: string | null
        }
        Insert: {
          ai_analysis?: string | null
          bureau?: string | null
          client_id?: string | null
          created_at?: string
          doc_type?: string | null
          document_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          upload_date?: string
          uploaded_file_url?: string | null
          user_id?: string | null
        }
        Update: {
          ai_analysis?: string | null
          bureau?: string | null
          client_id?: string | null
          created_at?: string
          doc_type?: string | null
          document_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          upload_date?: string
          uploaded_file_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_archive_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_archive_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
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
            foreignKeyName: "document_match_reviews_admin_selected_client_id_fkey"
            columns: ["admin_selected_client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
          {
            foreignKeyName: "document_match_reviews_suggested_client_id_fkey"
            columns: ["suggested_client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
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
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
      execution_queue: {
        Row: {
          client_id: string
          created_at: string
          cycle_id: string | null
          id: string
          item_id: string
          item_type: string
          priority: number | null
          queue_status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          item_id: string
          item_type: string
          priority?: number | null
          queue_status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          cycle_id?: string | null
          id?: string
          item_id?: string
          item_type?: string
          priority?: number | null
          queue_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_queue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_queue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
          {
            foreignKeyName: "execution_queue_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "client_processing_cycles"
            referencedColumns: ["id"]
          },
        ]
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
      marketing_cta_events: {
        Row: {
          created_at: string
          cta_id: string
          event: string
          id: string
          meta: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          cta_id: string
          event: string
          id?: string
          meta?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          cta_id?: string
          event?: string
          id?: string
          meta?: Json
          session_id?: string | null
          user_id?: string | null
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
      notification_templates: {
        Row: {
          channel: string | null
          event_type: string
          id: string
          is_active: boolean | null
          message_template: string
          subject_template: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          channel?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          message_template: string
          subject_template?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          channel?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          message_template?: string
          subject_template?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payment_activity_events: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          payment_record_id: string
          title: string
          user_id: string
          visible_to_client: boolean
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          payment_record_id: string
          title: string
          user_id: string
          visible_to_client?: boolean
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          payment_record_id?: string
          title?: string
          user_id?: string
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "payment_activity_events_payment_record_id_fkey"
            columns: ["payment_record_id"]
            isOneToOne: false
            referencedRelation: "payment_records"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_notifications: {
        Row: {
          created_at: string
          id: string
          message: string | null
          payment_record_id: string | null
          read_status: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          payment_record_id?: string | null
          read_status?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          payment_record_id?: string | null
          read_status?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_notifications_payment_record_id_fkey"
            columns: ["payment_record_id"]
            isOneToOne: false
            referencedRelation: "payment_records"
            referencedColumns: ["id"]
          },
        ]
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
      payment_records: {
        Row: {
          admin_notes: string | null
          client_id: string | null
          client_visible_message: string | null
          created_at: string
          id: string
          payment_amount: number
          payment_method: string
          payment_note: string | null
          payment_proof_file_path: string | null
          payment_status: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          client_id?: string | null
          client_visible_message?: string | null
          created_at?: string
          id?: string
          payment_amount: number
          payment_method: string
          payment_note?: string | null
          payment_proof_file_path?: string | null
          payment_status?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          client_id?: string | null
          client_visible_message?: string | null
          created_at?: string
          id?: string
          payment_amount?: number
          payment_method?: string
          payment_note?: string | null
          payment_proof_file_path?: string | null
          payment_status?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string
          updated_at?: string
          user_id?: string
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
          {
            foreignKeyName: "fk_payments_client_id"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
          {
            foreignKeyName: "referrals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      score_history: {
        Row: {
          bureau: string
          client_id: string | null
          id: string
          recorded_at: string
          report_id: string | null
          score_value: number
          source: string | null
          user_id: string | null
        }
        Insert: {
          bureau: string
          client_id?: string | null
          id?: string
          recorded_at?: string
          report_id?: string | null
          score_value: number
          source?: string | null
          user_id?: string | null
        }
        Update: {
          bureau?: string
          client_id?: string | null
          id?: string
          recorded_at?: string
          report_id?: string | null
          score_value?: number
          source?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_history_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
      score_predictions: {
        Row: {
          based_on_report_id: string | null
          client_id: string | null
          confidence_level: number | null
          created_at: string
          current_equifax: number | null
          current_experian: number | null
          current_transunion: number | null
          factors: Json | null
          id: string
          predicted_equifax_max: number | null
          predicted_equifax_min: number | null
          predicted_experian_max: number | null
          predicted_experian_min: number | null
          predicted_transunion_max: number | null
          predicted_transunion_min: number | null
          user_id: string | null
        }
        Insert: {
          based_on_report_id?: string | null
          client_id?: string | null
          confidence_level?: number | null
          created_at?: string
          current_equifax?: number | null
          current_experian?: number | null
          current_transunion?: number | null
          factors?: Json | null
          id?: string
          predicted_equifax_max?: number | null
          predicted_equifax_min?: number | null
          predicted_experian_max?: number | null
          predicted_experian_min?: number | null
          predicted_transunion_max?: number | null
          predicted_transunion_min?: number | null
          user_id?: string | null
        }
        Update: {
          based_on_report_id?: string | null
          client_id?: string | null
          confidence_level?: number | null
          created_at?: string
          current_equifax?: number | null
          current_experian?: number | null
          current_transunion?: number | null
          factors?: Json | null
          id?: string
          predicted_equifax_max?: number | null
          predicted_equifax_min?: number | null
          predicted_experian_max?: number | null
          predicted_experian_min?: number | null
          predicted_transunion_max?: number | null
          predicted_transunion_min?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_predictions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "score_predictions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
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
      task_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          items: Json
          name: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          items?: Json
          name?: string
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
          {
            foreignKeyName: "violation_flags_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "v_client_verification_report"
            referencedColumns: ["client_id"]
          },
        ]
      }
    }
    Views: {
      bank_links_public: {
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
      v_client_verification_report: {
        Row: {
          access_services_enabled: boolean | null
          archive_count: number | null
          client_id: string | null
          disputes_count: number | null
          documents_count: number | null
          email: string | null
          equifax_score: number | null
          expected_amount: number | null
          experian_score: number | null
          full_name: string | null
          has_score: boolean | null
          membership_plan: string | null
          not_a_client: boolean | null
          paid_amount: number | null
          payment_amount_ok: boolean | null
          payment_status: string | null
          payment_summary_exists: boolean | null
          payment_summary_status: string | null
          payment_user_link_ok: boolean | null
          portal_linked: boolean | null
          portal_status: string | null
          profile_email_match: boolean | null
          reports_count: number | null
          score_updated_at: string | null
          service_status: string | null
          status: string | null
          transunion_score: number | null
          user_id: string | null
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
      ensure_payment_summary: {
        Args: { p_client_id: string }
        Returns: {
          client_id: string
          created_at: string
          expected_amount: number
          id: string
          notes: string | null
          paid_amount: number
          payment_date: string | null
          payment_method: string | null
          payment_status: string
          receipt_reference: string | null
          service_type: string | null
          updated_at: string
          user_id: string | null
          verified_by_admin: boolean
          visible_to_client: boolean
        }
        SetofOptions: {
          from: "*"
          to: "client_payment_summary"
          isOneToOne: true
          isSetofReturn: false
        }
      }
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
      reconcile_client_links: { Args: { dry_run?: boolean }; Returns: Json }
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

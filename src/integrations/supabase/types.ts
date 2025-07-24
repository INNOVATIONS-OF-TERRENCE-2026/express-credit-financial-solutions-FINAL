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
      clients: {
        Row: {
          created_at: string
          credit_reports_path: string | null
          date_of_birth: string
          drivers_license_path: string | null
          email_address: string
          full_name: string
          id: string
          phone_number: string
          proof_of_address_path: string | null
          ssn: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_reports_path?: string | null
          date_of_birth: string
          drivers_license_path?: string | null
          email_address: string
          full_name: string
          id?: string
          phone_number: string
          proof_of_address_path?: string | null
          ssn: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_reports_path?: string | null
          date_of_birth?: string
          drivers_license_path?: string | null
          email_address?: string
          full_name?: string
          id?: string
          phone_number?: string
          proof_of_address_path?: string | null
          ssn?: string
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
      credit_reports: {
        Row: {
          created_at: string | null
          fico_score: number
          id: string
          negative_items: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          fico_score: number
          id?: string
          negative_items?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          fico_score?: number
          id?: string
          negative_items?: string[] | null
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
          client_id: string | null
          created_at: string | null
          creditor_name: string
          generated_letter: string
          id: string
          issue_type: string
          user_id: string
        }
        Insert: {
          account_number: string
          additional_notes?: string | null
          client_id?: string | null
          created_at?: string | null
          creditor_name: string
          generated_letter: string
          id?: string
          issue_type: string
          user_id: string
        }
        Update: {
          account_number?: string
          additional_notes?: string | null
          client_id?: string | null
          created_at?: string | null
          creditor_name?: string
          generated_letter?: string
          id?: string
          issue_type?: string
          user_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

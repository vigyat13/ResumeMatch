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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_feedback_usage: {
        Row: {
          cache_hit: boolean | null
          completion_tokens: number
          created_at: string | null
          estimated_cost: number | null
          id: string
          model: string
          prompt_tokens: number
          resume_id: string | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          cache_hit?: boolean | null
          completion_tokens?: number
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          model: string
          prompt_tokens?: number
          resume_id?: string | null
          total_tokens?: number
          user_id: string
        }
        Update: {
          cache_hit?: boolean | null
          completion_tokens?: number
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          model?: string
          prompt_tokens?: number
          resume_id?: string | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_feedback_usage_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      api_metrics: {
        Row: {
          created_at: string
          duration_ms: number
          endpoint: string
          error_message: string | null
          id: string
          method: string
          status_code: number
          user_id: string | null
        }
        Insert: {
          created_at?: string
          duration_ms: number
          endpoint: string
          error_message?: string | null
          id?: string
          method: string
          status_code: number
          user_id?: string | null
        }
        Update: {
          created_at?: string
          duration_ms?: number
          endpoint?: string
          error_message?: string | null
          id?: string
          method?: string
          status_code?: number
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          resource: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_reports: {
        Row: {
          category_scores: Json | null
          created_at: string | null
          id: string
          issues: Json | null
          overall_score: number | null
          recommendations: Json | null
          resume_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_scores?: Json | null
          created_at?: string | null
          id?: string
          issues?: Json | null
          overall_score?: number | null
          recommendations?: Json | null
          resume_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_scores?: Json | null
          created_at?: string | null
          id?: string
          issues?: Json | null
          overall_score?: number | null
          recommendations?: Json | null
          resume_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      email_preferences: {
        Row: {
          application_updates_frequency: string | null
          ats_tips: boolean | null
          billing_emails: boolean | null
          consent_given_at: string | null
          consent_version: string | null
          id: string
          job_alerts_frequency: string | null
          marketing_emails: boolean | null
          real_time_alerts: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_updates_frequency?: string | null
          ats_tips?: boolean | null
          billing_emails?: boolean | null
          consent_given_at?: string | null
          consent_version?: string | null
          id?: string
          job_alerts_frequency?: string | null
          marketing_emails?: boolean | null
          real_time_alerts?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_updates_frequency?: string | null
          ats_tips?: boolean | null
          billing_emails?: boolean | null
          consent_given_at?: string | null
          consent_version?: string | null
          id?: string
          job_alerts_frequency?: string | null
          marketing_emails?: boolean | null
          real_time_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_paid: number
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string | null
          currency: string | null
          id: string
          invoice_url: string | null
          status: string
          stripe_invoice_id: string
          user_id: string
        }
        Insert: {
          amount_paid: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          status: string
          stripe_invoice_id: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          invoice_url?: string | null
          status?: string
          stripe_invoice_id?: string
          user_id?: string
        }
        Relationships: []
      }
      job_matches: {
        Row: {
          company: string | null
          created_at: string | null
          deleted_at: string | null
          extra_skills: string[] | null
          id: string
          job_description: string
          job_skills: string[] | null
          job_title: string | null
          match_percentage: number | null
          matched_skills: string[] | null
          missing_skills: string[] | null
          recommendations: string[] | null
          resume_id: string | null
          saved: boolean | null
          saved_notes: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          deleted_at?: string | null
          extra_skills?: string[] | null
          id?: string
          job_description: string
          job_skills?: string[] | null
          job_title?: string | null
          match_percentage?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          recommendations?: string[] | null
          resume_id?: string | null
          saved?: boolean | null
          saved_notes?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string | null
          deleted_at?: string | null
          extra_skills?: string[] | null
          id?: string
          job_description?: string
          job_skills?: string[] | null
          job_title?: string | null
          match_percentage?: number | null
          matched_skills?: string[] | null
          missing_skills?: string[] | null
          recommendations?: string[] | null
          resume_id?: string | null
          saved?: boolean | null
          saved_notes?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_matches_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string
          id: string
          last_name: string
          role: string
          subscription_tier: string
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string
          id: string
          last_name?: string
          role?: string
          subscription_tier?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string
          id?: string
          last_name?: string
          role?: string
          subscription_tier?: string
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          created_at: string
          key: string
          window_end: string
        }
        Insert: {
          count?: number
          created_at?: string
          key: string
          window_end: string
        }
        Update: {
          count?: number
          created_at?: string
          key?: string
          window_end?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          extracted_skills: string[] | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          parsed_text: string | null
          parsing_status: string
          storage_path: string | null
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          extracted_skills?: string[] | null
          file_name: string
          file_size?: number
          file_type: string
          file_url?: string
          id?: string
          parsed_text?: string | null
          parsing_status?: string
          storage_path?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          extracted_skills?: string[] | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          parsed_text?: string | null
          parsing_status?: string
          storage_path?: string | null
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tracked_applications: {
        Row: {
          created_at: string | null
          id: string
          job_title: string | null
          company: string | null
          job_url: string | null
          session_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          job_title?: string | null
          company?: string | null
          job_url?: string | null
          session_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          job_title?: string | null
          company?: string | null
          job_url?: string | null
          session_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          created_at: string | null
          css_content: string
          description: string | null
          html_content: string
          id: string
          is_ats_safe: boolean | null
          name: string
          preview_url: string | null
          tier: string | null
        }
        Insert: {
          created_at?: string | null
          css_content?: string
          description?: string | null
          html_content?: string
          id?: string
          is_ats_safe?: boolean | null
          name: string
          preview_url?: string | null
          tier?: string | null
        }
        Update: {
          created_at?: string | null
          css_content?: string
          description?: string | null
          html_content?: string
          id?: string
          is_ats_safe?: boolean | null
          name?: string
          preview_url?: string | null
          tier?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_rate_limit: {
        Args: { p_key: string; p_window_end: string }
        Returns: number
      }
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

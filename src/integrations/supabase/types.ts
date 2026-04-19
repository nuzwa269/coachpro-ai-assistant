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
      ai_models: {
        Row: {
          api_base_url: string | null
          api_key_secret_name: string | null
          api_model_name: string | null
          category: Database["public"]["Enums"]["model_category"]
          created_at: string
          credits_cost: number
          description: string | null
          display_name: string
          id: string
          is_active: boolean
          min_plan: Database["public"]["Enums"]["user_plan"]
          provider: string
          provider_type: Database["public"]["Enums"]["provider_type"]
          updated_at: string
        }
        Insert: {
          api_base_url?: string | null
          api_key_secret_name?: string | null
          api_model_name?: string | null
          category?: Database["public"]["Enums"]["model_category"]
          created_at?: string
          credits_cost?: number
          description?: string | null
          display_name: string
          id: string
          is_active?: boolean
          min_plan?: Database["public"]["Enums"]["user_plan"]
          provider: string
          provider_type?: Database["public"]["Enums"]["provider_type"]
          updated_at?: string
        }
        Update: {
          api_base_url?: string | null
          api_key_secret_name?: string | null
          api_model_name?: string | null
          category?: Database["public"]["Enums"]["model_category"]
          created_at?: string
          credits_cost?: number
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean
          min_plan?: Database["public"]["Enums"]["user_plan"]
          provider?: string
          provider_type?: Database["public"]["Enums"]["provider_type"]
          updated_at?: string
        }
        Relationships: []
      }
      assistants: {
        Row: {
          category: string | null
          created_at: string
          default_model_id: string | null
          description: string | null
          icon: string
          id: string
          is_active: boolean
          is_prebuilt: boolean
          name: string
          owner_id: string | null
          system_prompt: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_model_id?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          is_prebuilt?: boolean
          name: string
          owner_id?: string | null
          system_prompt: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_model_id?: string | null
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          is_prebuilt?: boolean
          name?: string
          owner_id?: string | null
          system_prompt?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistants_default_model_id_fkey"
            columns: ["default_model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_summaries: {
        Row: {
          conversation_id: string
          durable_facts: string
          message_count_at_summary: number
          summarized_up_to_message_id: string | null
          summary: string
          updated_at: string
        }
        Insert: {
          conversation_id: string
          durable_facts?: string
          message_count_at_summary?: number
          summarized_up_to_message_id?: string | null
          summary?: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          durable_facts?: string
          message_count_at_summary?: number
          summarized_up_to_message_id?: string | null
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_summaries_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          assistant_id: string | null
          created_at: string
          id: string
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          project_id: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assistant_id?: string | null
          created_at?: string
          id?: string
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_packs: {
        Row: {
          created_at: string
          credits: number
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price_pkr: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          credits: number
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price_pkr: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          credits?: number
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price_pkr?: number
          sort_order?: number
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          model_id: string | null
          notes: string | null
          reference_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["transaction_kind"]
          model_id?: string | null
          notes?: string | null
          reference_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["transaction_kind"]
          model_id?: string | null
          notes?: string | null
          reference_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          credits_used: number
          id: string
          model_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          credits_used?: number
          id?: string
          model_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          credits_used?: number
          id?: string
          model_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_requests: {
        Row: {
          admin_notes: string | null
          amount_pkr: number
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["payment_kind"]
          method: Database["public"]["Enums"]["payment_method"]
          notes: string | null
          pack_id: string | null
          plan_id: string | null
          proof_url: string | null
          reference_no: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sender_name: string | null
          sender_phone: string | null
          status: Database["public"]["Enums"]["payment_status"]
          trial_credits_amount: number
          trial_credits_granted_at: string | null
          trial_credits_reverted: boolean
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount_pkr: number
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["payment_kind"]
          method: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          pack_id?: string | null
          plan_id?: string | null
          proof_url?: string | null
          reference_no?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          trial_credits_amount?: number
          trial_credits_granted_at?: string | null
          trial_credits_reverted?: boolean
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount_pkr?: number
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["payment_kind"]
          method?: Database["public"]["Enums"]["payment_method"]
          notes?: string | null
          pack_id?: string | null
          plan_id?: string | null
          proof_url?: string | null
          reference_no?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          trial_credits_amount?: number
          trial_credits_granted_at?: string | null
          trial_credits_reverted?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "credit_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: number
          email: string
          id: string
          name: string | null
          plan: Database["public"]["Enums"]["user_plan"]
          plan_renews_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          email: string
          id: string
          name?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          plan_renews_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: number
          email?: string
          id?: string
          name?: string | null
          plan?: Database["public"]["Enums"]["user_plan"]
          plan_renews_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_responses: {
        Row: {
          created_at: string
          id: string
          message_id: string
          note: string | null
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          note?: string | null
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          note?: string | null
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_responses_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_responses_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          features: Json
          id: string
          is_active: boolean
          is_popular: boolean
          max_custom_assistants: number | null
          max_projects: number | null
          max_saved_responses: number | null
          monthly_credits: number
          name: string
          price_pkr: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          features?: Json
          id: string
          is_active?: boolean
          is_popular?: boolean
          max_custom_assistants?: number | null
          max_projects?: number | null
          max_saved_responses?: number | null
          monthly_credits?: number
          name: string
          price_pkr?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_custom_assistants?: number | null
          max_projects?: number | null
          max_saved_responses?: number | null
          monthly_credits?: number
          name?: string
          price_pkr?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_active_assistants: {
        Row: {
          activated_at: string
          assistant_id: string
          id: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          assistant_id: string
          id?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          assistant_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_assistants_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_payment: { Args: { _payment_id: string }; Returns: undefined }
      deduct_credits: {
        Args: {
          _conversation_id: string
          _message_id: string
          _model_id: string
          _user_id: string
        }
        Returns: number
      }
      get_user_plan: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_plan"]
      }
      grant_trial_credits: { Args: { _payment_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_payment: {
        Args: { _admin_notes?: string; _payment_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      model_category: "text" | "image" | "reasoning"
      payment_kind: "subscription" | "credit_pack"
      payment_method: "jazzcash" | "easypaisa" | "bank_transfer" | "whatsapp"
      payment_status: "pending" | "approved" | "rejected"
      provider_type: "lovable" | "openai_compatible" | "anthropic"
      transaction_kind:
        | "signup_bonus"
        | "subscription_grant"
        | "pack_purchase"
        | "message_deduct"
        | "admin_adjust"
        | "refund"
        | "trial_grant"
        | "trial_revert"
      user_plan: "free" | "basic" | "pro"
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
      app_role: ["admin", "user"],
      model_category: ["text", "image", "reasoning"],
      payment_kind: ["subscription", "credit_pack"],
      payment_method: ["jazzcash", "easypaisa", "bank_transfer", "whatsapp"],
      payment_status: ["pending", "approved", "rejected"],
      provider_type: ["lovable", "openai_compatible", "anthropic"],
      transaction_kind: [
        "signup_bonus",
        "subscription_grant",
        "pack_purchase",
        "message_deduct",
        "admin_adjust",
        "refund",
        "trial_grant",
        "trial_revert",
      ],
      user_plan: ["free", "basic", "pro"],
    },
  },
} as const

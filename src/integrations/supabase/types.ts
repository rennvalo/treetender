// Supabase types removed in SQLite-only mode.
export {};

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      care_logs: {
        Row: {
          action_type: Database["public"]["Enums"]["care_action"]
          created_at: string
          id: string
          tree_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["care_action"]
          created_at?: string
          id?: string
          tree_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["care_action"]
          created_at?: string
          id?: string
          tree_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_logs_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      care_parameters: {
        Row: {
          created_at: string
          id: number
          interval_hours: number
          max_feed: number
          max_love: number
          max_sunlight: number
          max_water: number
          min_feed: number
          min_love: number
          min_sunlight: number
          min_water: number
          species_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          interval_hours?: number
          max_feed?: number
          max_love?: number
          max_sunlight?: number
          max_water?: number
          min_feed?: number
          min_love?: number
          min_sunlight?: number
          min_water?: number
          species_id: number
        }
        Update: {
          created_at?: string
          id?: number
          interval_hours?: number
          max_feed?: number
          max_love?: number
          max_sunlight?: number
          max_water?: number
          min_feed?: number
          min_love?: number
          min_sunlight?: number
          min_water?: number
          species_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "care_parameters_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: true
            referencedRelation: "tree_species"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      random_events: {
        Row: {
          created_at: string | null
          description: string
          emoji: string | null
          feed_modifier: number | null
          health_impact: string | null
          id: number
          love_modifier: number | null
          name: string
          rarity: number | null
          sunlight_modifier: number | null
          water_modifier: number | null
        }
        Insert: {
          created_at?: string | null
          description: string
          emoji?: string | null
          feed_modifier?: number | null
          health_impact?: string | null
          id?: number
          love_modifier?: number | null
          name: string
          rarity?: number | null
          sunlight_modifier?: number | null
          water_modifier?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string
          emoji?: string | null
          feed_modifier?: number | null
          health_impact?: string | null
          id?: number
          love_modifier?: number | null
          name?: string
          rarity?: number | null
          sunlight_modifier?: number | null
          water_modifier?: number | null
        }
        Relationships: []
      }
      tree_events: {
        Row: {
          event_id: number
          feed_change: number | null
          id: string
          love_change: number | null
          occurred_at: string | null
          sunlight_change: number | null
          tree_id: string
          water_change: number | null
        }
        Insert: {
          event_id: number
          feed_change?: number | null
          id?: string
          love_change?: number | null
          occurred_at?: string | null
          sunlight_change?: number | null
          tree_id: string
          water_change?: number | null
        }
        Update: {
          event_id?: number
          feed_change?: number | null
          id?: string
          love_change?: number | null
          occurred_at?: string | null
          sunlight_change?: number | null
          tree_id?: string
          water_change?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tree_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "random_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tree_events_tree_id_fkey"
            columns: ["tree_id"]
            isOneToOne: false
            referencedRelation: "trees"
            referencedColumns: ["id"]
          },
        ]
      }
      tree_species: {
        Row: {
          description: string | null
          id: number
          image_full_tree: string | null
          image_sapling: string | null
          image_seedling: string | null
          image_sprout: string | null
          name: string
        }
        Insert: {
          description?: string | null
          id?: number
          image_full_tree?: string | null
          image_sapling?: string | null
          image_seedling?: string | null
          image_sprout?: string | null
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          image_full_tree?: string | null
          image_sapling?: string | null
          image_seedling?: string | null
          image_sprout?: string | null
          name?: string
        }
        Relationships: []
      }
      trees: {
        Row: {
          growth_points: number | null
          growth_stage: Database["public"]["Enums"]["growth_stage"]
          id: string
          last_evaluation: string | null
          last_user_activity: string | null
          planted_at: string
          species_id: number
          target_feed: number | null
          target_love: number | null
          target_sunlight: number | null
          target_water: number | null
          user_id: string
        }
        Insert: {
          growth_points?: number | null
          growth_stage?: Database["public"]["Enums"]["growth_stage"]
          id?: string
          last_evaluation?: string | null
          last_user_activity?: string | null
          planted_at?: string
          species_id: number
          target_feed?: number | null
          target_love?: number | null
          target_sunlight?: number | null
          target_water?: number | null
          user_id: string
        }
        Update: {
          growth_points?: number | null
          growth_stage?: Database["public"]["Enums"]["growth_stage"]
          id?: string
          last_evaluation?: string | null
          last_user_activity?: string | null
          planted_at?: string
          species_id?: number
          target_feed?: number | null
          target_love?: number | null
          target_sunlight?: number | null
          target_water?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trees_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "tree_species"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      evaluate_tree_growth: {
        Args: { force_evaluation?: boolean }
        Returns: undefined
      }
    }
    Enums: {
      care_action: "water" | "feed" | "sunlight" | "love"
      growth_stage: "seedling" | "sprout" | "sapling" | "full_tree"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      care_action: ["water", "feed", "sunlight", "love"],
      growth_stage: ["seedling", "sprout", "sapling", "full_tree"],
    },
  },
} as const

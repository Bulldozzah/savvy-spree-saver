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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_banners: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_general: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ad_promotions: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          product_gtin: string | null
          promotional_price: number
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          product_gtin?: string | null
          promotional_price: number
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          product_gtin?: string | null
          promotional_price?: number
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_promotions_product_gtin_fkey"
            columns: ["product_gtin"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["gtin"]
          },
          {
            foreignKeyName: "ad_promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_promotions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          description: string
          gtin: string
        }
        Insert: {
          description: string
          gtin: string
        }
        Update: {
          description?: string
          gtin?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          contact: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          phone_area_code: string | null
          profile_completed: boolean | null
          updated_at: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          contact?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          phone_area_code?: string | null
          profile_completed?: boolean | null
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          contact?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          phone_area_code?: string | null
          profile_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      shopping_list_items: {
        Row: {
          created_at: string | null
          id: string
          product_gtin: string
          quantity: number
          shopping_list_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_gtin: string
          quantity?: number
          shopping_list_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_gtin?: string
          quantity?: number
          shopping_list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_product_gtin_fkey"
            columns: ["product_gtin"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["gtin"]
          },
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          assigned_store_id: string | null
          budget: number | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_store_id?: string | null
          budget?: number | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_store_id?: string | null
          budget?: number | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_assigned_store_id_fkey"
            columns: ["assigned_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_assigned_store_id_fkey"
            columns: ["assigned_store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_feedback: {
        Row: {
          body: string
          created_at: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id: string
          rating: number
          store_id: string
          title: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          feedback_type: Database["public"]["Enums"]["feedback_type"]
          id?: string
          rating: number
          store_id: string
          title?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          feedback_type?: Database["public"]["Enums"]["feedback_type"]
          id?: string
          rating?: number
          store_id?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_feedback_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_feedback_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_hq: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      store_prices: {
        Row: {
          id: string
          in_stock: boolean
          price: number
          product_gtin: string
          store_id: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          in_stock?: boolean
          price: number
          product_gtin: string
          store_id: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          in_stock?: boolean
          price?: number
          product_gtin?: string
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_prices_product_gtin_fkey"
            columns: ["product_gtin"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["gtin"]
          },
          {
            foreignKeyName: "store_prices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_prices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          city: string | null
          contact: string | null
          created_at: string | null
          email: string | null
          hq_id: string
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          store_owner_id: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          email?: string | null
          hq_id: string
          id?: string
          latitude?: number | null
          location: string
          longitude?: number | null
          store_owner_id?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact?: string | null
          created_at?: string | null
          email?: string | null
          hq_id?: string
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          store_owner_id?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_hq_id_fkey"
            columns: ["hq_id"]
            isOneToOne: false
            referencedRelation: "store_hq"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      stores_public: {
        Row: {
          created_at: string | null
          hq_id: string | null
          id: string | null
          location: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hq_id?: string | null
          id?: string | null
          location?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hq_id?: string | null
          id?: string | null
          location?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stores_hq_id_fkey"
            columns: ["hq_id"]
            isOneToOne: false
            referencedRelation: "store_hq"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "store_owner" | "shopper" | "super_admin"
      feedback_type:
        | "Store Service & Experience"
        | "Product Quality & Experience"
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
      app_role: ["admin", "store_owner", "shopper", "super_admin"],
      feedback_type: [
        "Store Service & Experience",
        "Product Quality & Experience",
      ],
    },
  },
} as const

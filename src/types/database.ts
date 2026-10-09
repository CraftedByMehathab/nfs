
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "contractors": {
                  Row: {
                    "accent": string,"created_at": string,"email": string | null,"id": string,"name": string,"phone": string | null,"slug": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accent"?: string,"created_at"?: string,"email"?: string | null,"id"?: string,"name": string,"phone"?: string | null,"slug": string,"user_id"?: string
                  }
                  Update: {
                    "accent"?: string,"created_at"?: string,"email"?: string | null,"id"?: string,"name"?: string,"phone"?: string | null,"slug"?: string,"user_id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"leads": {
                  Row: {
                    "contractor_id": string,"created_at": string,"email": string | null,"id": string,"message": string | null,"name": string,"phone": string | null,"template_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "contractor_id": string,"created_at"?: string,"email"?: string | null,"id"?: string,"message"?: string | null,"name": string,"phone"?: string | null,"template_id"?: string | null
                  }
                  Update: {
                    "contractor_id"?: string,"created_at"?: string,"email"?: string | null,"id"?: string,"message"?: string | null,"name"?: string,"phone"?: string | null,"template_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "leads_contractor_id_fkey"
      columns: ["contractor_id"]
isOneToOne: false
      referencedRelation: "contractors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "leads_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "templates"
      referencedColumns: ["id"]
    }
                  ]
                },"projects": {
                  Row: {
                    "corners": NonNullable<Json>,"created_at": string,"height": number,"id": string,"mask_path": string | null,"name": string | null,"original_path": string,"outline": Json | null,"user_id": string,"width": number
                  }
                  ComputedFields: never
                  Insert: {
                    "corners": NonNullable<Json>,"created_at"?: string,"height": number,"id"?: string,"mask_path"?: string | null,"name"?: string | null,"original_path": string,"outline"?: Json | null,"user_id"?: string,"width": number
                  }
                  Update: {
                    "corners"?: NonNullable<Json>,"created_at"?: string,"height"?: number,"id"?: string,"mask_path"?: string | null,"name"?: string | null,"original_path"?: string,"outline"?: Json | null,"user_id"?: string,"width"?: number
                  }
                  Relationships: [
                    
                  ]
                },"renders": {
                  Row: {
                    "created_at": string,"id": string,"image_path": string,"pattern_size": number,"photoreal": boolean,"project_id": string,"shading": number,"share_slug": string | null,"template_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"image_path": string,"pattern_size"?: number,"photoreal"?: boolean,"project_id": string,"shading"?: number,"share_slug"?: string | null,"template_id": string,"user_id"?: string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"image_path"?: string,"pattern_size"?: number,"photoreal"?: boolean,"project_id"?: string,"shading"?: number,"share_slug"?: string | null,"template_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "renders_project_id_fkey"
      columns: ["project_id"]
isOneToOne: false
      referencedRelation: "projects"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "renders_template_id_fkey"
      columns: ["template_id"]
isOneToOne: false
      referencedRelation: "templates"
      referencedColumns: ["id"]
    }
                  ]
                },"templates": {
                  Row: {
                    "category": string,"gloss": number | null,"id": string,"name": string,"scale": number,"texture_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "category": string,"gloss"?: number | null,"id": string,"name": string,"scale": number,"texture_url"?: string | null
                  }
                  Update: {
                    "category"?: string,"gloss"?: number | null,"id"?: string,"name"?: string,"scale"?: number,"texture_url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "get_contractor":
{ Args: { "slug": string }; Returns: {
              "accent": string,"email": string,"name": string,"phone": string
            }[]
                           },
"get_shared_render":
{ Args: { "slug": string }; Returns: {
              "created_at": string,"height": number,"template_name": string,"width": number
            }[]
                           },
"lead_awaits_picture":
{ Args: { "path": string }; Returns: boolean
                           },
"submit_lead":
{ Args: { "email": string,"message": string,"name": string,"phone": string,"slug": string,"template_id": string }; Returns: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const

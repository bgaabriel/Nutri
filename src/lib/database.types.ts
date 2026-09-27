// Gerado a partir do projeto Supabase (supabase gen types typescript).
// Não edite à mão: regenere depois de mudar o schema.
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
      agendamentos: {
        Row: {
          created_at: string
          data: string
          duracao_min: number
          hora: string
          id: string
          modalidade: string
          observacoes: string | null
          paciente_id: string
          pago: boolean
          profissional_id: string
          status: string
          tipo: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          data: string
          duracao_min?: number
          hora: string
          id?: string
          modalidade?: string
          observacoes?: string | null
          paciente_id: string
          pago?: boolean
          profissional_id?: string
          status?: string
          tipo: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          data?: string
          duracao_min?: number
          hora?: string
          id?: string
          modalidade?: string
          observacoes?: string | null
          paciente_id?: string
          pago?: boolean
          profissional_id?: string
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      alimentos_taco: {
        Row: {
          calcio_mg_100g: number
          carb_100g: number
          colesterol_mg_100g: number
          dados_incompletos: boolean
          ferro_mg_100g: number
          fibra_100g: number
          fonte: string
          fosforo_mg_100g: number
          grupo: string
          id: string
          kcal_100g: number
          lip_100g: number
          magnesio_mg_100g: number
          medida_caseira: string
          nome: string
          porcao_padrao_g: number
          potassio_mg_100g: number
          prot_100g: number
          sodio_mg_100g: number
          taco_numero: number | null
          umidade_100g: number | null
          vitc_mg_100g: number
          zinco_mg_100g: number
        }
        Insert: {
          calcio_mg_100g?: number
          carb_100g?: number
          colesterol_mg_100g?: number
          dados_incompletos?: boolean
          ferro_mg_100g?: number
          fibra_100g?: number
          fonte: string
          fosforo_mg_100g?: number
          grupo: string
          id: string
          kcal_100g?: number
          lip_100g?: number
          magnesio_mg_100g?: number
          medida_caseira?: string
          nome: string
          porcao_padrao_g?: number
          potassio_mg_100g?: number
          prot_100g?: number
          sodio_mg_100g?: number
          taco_numero?: number | null
          umidade_100g?: number | null
          vitc_mg_100g?: number
          zinco_mg_100g?: number
        }
        Update: {
          calcio_mg_100g?: number
          carb_100g?: number
          colesterol_mg_100g?: number
          dados_incompletos?: boolean
          ferro_mg_100g?: number
          fibra_100g?: number
          fonte?: string
          fosforo_mg_100g?: number
          grupo?: string
          id?: string
          kcal_100g?: number
          lip_100g?: number
          magnesio_mg_100g?: number
          medida_caseira?: string
          nome?: string
          porcao_padrao_g?: number
          potassio_mg_100g?: number
          prot_100g?: number
          sodio_mg_100g?: number
          taco_numero?: number | null
          umidade_100g?: number | null
          vitc_mg_100g?: number
          zinco_mg_100g?: number
        }
        Relationships: []
      }
      consultas: {
        Row: {
          anamnese: Json
          antropometria: Json
          calculado: Json | null
          cardapio: Json | null
          created_at: string
          data: string
          id: string
          paciente_id: string
          prescricao: Json
          profissional_id: string
          titulo: string
          updated_at: string
        }
        Insert: {
          anamnese?: Json
          antropometria?: Json
          calculado?: Json | null
          cardapio?: Json | null
          created_at?: string
          data?: string
          id?: string
          paciente_id: string
          prescricao?: Json
          profissional_id?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          anamnese?: Json
          antropometria?: Json
          calculado?: Json | null
          cardapio?: Json | null
          created_at?: string
          data?: string
          id?: string
          paciente_id?: string
          prescricao?: Json
          profissional_id?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "pacientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      pacientes: {
        Row: {
          created_at: string
          email: string | null
          id: string
          idade: number | null
          nome: string
          objetivo: string | null
          profissional_id: string
          sexo: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          idade?: number | null
          nome: string
          objetivo?: string | null
          profissional_id?: string
          sexo: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          idade?: number | null
          nome?: string
          objetivo?: string | null
          profissional_id?: string
          sexo?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pacientes_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          clinica: string | null
          cpf: string
          created_at: string
          crn_numero: string
          crn_regiao: number
          email: string
          endereco_rodape: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          clinica?: string | null
          cpf: string
          created_at?: string
          crn_numero: string
          crn_regiao: number
          email: string
          endereco_rodape?: string | null
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          clinica?: string | null
          cpf?: string
          created_at?: string
          crn_numero?: string
          crn_regiao?: number
          email?: string
          endereco_rodape?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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

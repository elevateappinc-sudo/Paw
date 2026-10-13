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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      assistant_messages: {
        Row: {
          actions: Json | null
          content: string
          created_at: string | null
          id: string
          pet_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          actions?: Json | null
          content: string
          created_at?: string | null
          id?: string
          pet_id?: string | null
          role: string
          user_id: string
        }
        Update: {
          actions?: Json | null
          content?: string
          created_at?: string | null
          id?: string
          pet_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_messages_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistant_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_sync_errors: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      bookings: {
        Row: {
          business_id: string
          business_notes: string | null
          completed_at: string | null
          created_at: string | null
          ends_at: string | null
          id: string
          notes: string | null
          pet_id: string
          price: number | null
          service_id: string | null
          starts_at: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          business_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          notes?: string | null
          pet_id: string
          price?: number | null
          service_id?: string | null
          starts_at: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          business_notes?: string | null
          completed_at?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          notes?: string | null
          pet_id?: string
          price?: number | null
          service_id?: string | null
          starts_at?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "business_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      business_services: {
        Row: {
          active: boolean
          business_id: string
          care_cycle_kind: Database["public"]["Enums"]["care_cycle_kind"] | null
          care_cycle_name: string | null
          created_at: string | null
          description: string | null
          duration_min: number | null
          id: string
          name: string
          price: number | null
          sort: number
        }
        Insert: {
          active?: boolean
          business_id: string
          care_cycle_kind?:
            | Database["public"]["Enums"]["care_cycle_kind"]
            | null
          care_cycle_name?: string | null
          created_at?: string | null
          description?: string | null
          duration_min?: number | null
          id?: string
          name: string
          price?: number | null
          sort?: number
        }
        Update: {
          active?: boolean
          business_id?: string
          care_cycle_kind?:
            | Database["public"]["Enums"]["care_cycle_kind"]
            | null
          care_cycle_name?: string | null
          created_at?: string | null
          description?: string | null
          duration_min?: number | null
          id?: string
          name?: string
          price?: number | null
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "business_services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_subscriptions: {
        Row: {
          business_id: string
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "marketplace_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          active: boolean
          address: string | null
          categories: string[]
          city: string | null
          claimed: boolean
          cover_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          emergency_24h: boolean
          hours: Json | null
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          logo_url: string | null
          name: string
          neighborhood: string | null
          owner_user_id: string | null
          phone: string | null
          photos: string[]
          price_from: number | null
          price_level: number | null
          promo_text: string | null
          qr_code: string
          rating_avg: number
          rating_count: number
          type: string
          updated_at: string | null
          verified: boolean | null
          whatsapp: string | null
          writes_history: boolean
        }
        Insert: {
          active?: boolean
          address?: string | null
          categories?: string[]
          city?: string | null
          claimed?: boolean
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          emergency_24h?: boolean
          hours?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          logo_url?: string | null
          name: string
          neighborhood?: string | null
          owner_user_id?: string | null
          phone?: string | null
          photos?: string[]
          price_from?: number | null
          price_level?: number | null
          promo_text?: string | null
          qr_code?: string
          rating_avg?: number
          rating_count?: number
          type: string
          updated_at?: string | null
          verified?: boolean | null
          whatsapp?: string | null
          writes_history?: boolean
        }
        Update: {
          active?: boolean
          address?: string | null
          categories?: string[]
          city?: string | null
          claimed?: boolean
          cover_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          emergency_24h?: boolean
          hours?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          logo_url?: string | null
          name?: string
          neighborhood?: string | null
          owner_user_id?: string | null
          phone?: string | null
          photos?: string[]
          price_from?: number | null
          price_level?: number | null
          promo_text?: string | null
          qr_code?: string
          rating_avg?: number
          rating_count?: number
          type?: string
          updated_at?: string | null
          verified?: boolean | null
          whatsapp?: string | null
          writes_history?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "businesses_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_mappings: {
        Row: {
          gcal_deleted: boolean | null
          gcal_event_id: string
          id: string
          last_synced_at: string | null
          paw_event_id: string
          paw_event_type: string
          user_id: string
        }
        Insert: {
          gcal_deleted?: boolean | null
          gcal_event_id: string
          id?: string
          last_synced_at?: string | null
          paw_event_id: string
          paw_event_type: string
          user_id: string
        }
        Update: {
          gcal_deleted?: boolean | null
          gcal_event_id?: string
          id?: string
          last_synced_at?: string | null
          paw_event_id?: string
          paw_event_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_mappings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          access_token: string
          created_at: string | null
          gcal_calendar_id: string
          gcal_sync_token: string | null
          id: string
          refresh_token: string
          sync_enabled: boolean | null
          synced_event_types: string[] | null
          token_expires_at: string
          updated_at: string | null
          user_id: string
          webhook_channel_id: string | null
          webhook_expires_at: string | null
          webhook_resource_id: string | null
        }
        Insert: {
          access_token: string
          created_at?: string | null
          gcal_calendar_id?: string
          gcal_sync_token?: string | null
          id?: string
          refresh_token: string
          sync_enabled?: boolean | null
          synced_event_types?: string[] | null
          token_expires_at: string
          updated_at?: string | null
          user_id: string
          webhook_channel_id?: string | null
          webhook_expires_at?: string | null
          webhook_resource_id?: string | null
        }
        Update: {
          access_token?: string
          created_at?: string | null
          gcal_calendar_id?: string
          gcal_sync_token?: string | null
          id?: string
          refresh_token?: string
          sync_enabled?: boolean | null
          synced_event_types?: string[] | null
          token_expires_at?: string
          updated_at?: string | null
          user_id?: string
          webhook_channel_id?: string | null
          webhook_expires_at?: string | null
          webhook_resource_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_integrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      care_cycle_logs: {
        Row: {
          booking_id: string | null
          business_id: string | null
          cost: number | null
          created_at: string | null
          cycle_id: string
          done_at: string
          dose: string | null
          id: string
          notes: string | null
          pet_id: string
          photo_url: string | null
          product: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          business_id?: string | null
          cost?: number | null
          created_at?: string | null
          cycle_id: string
          done_at?: string
          dose?: string | null
          id?: string
          notes?: string | null
          pet_id: string
          photo_url?: string | null
          product?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          business_id?: string | null
          cost?: number | null
          created_at?: string | null
          cycle_id?: string
          done_at?: string
          dose?: string | null
          id?: string
          notes?: string | null
          pet_id?: string
          photo_url?: string | null
          product?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_cycle_logs_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycle_logs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycle_logs_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycle_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycle_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      care_cycles: {
        Row: {
          active: boolean
          created_at: string | null
          dose: string | null
          id: string
          interval_days: number
          interval_unit: string
          interval_value: number | null
          kind: Database["public"]["Enums"]["care_cycle_kind"]
          last_done_at: string | null
          name: string
          next_due_at: string
          notes: string | null
          pet_id: string
          product: string | null
          protocol_id: string | null
          source: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string | null
          dose?: string | null
          id?: string
          interval_days: number
          interval_unit?: string
          interval_value?: number | null
          kind: Database["public"]["Enums"]["care_cycle_kind"]
          last_done_at?: string | null
          name: string
          next_due_at: string
          notes?: string | null
          pet_id: string
          product?: string | null
          protocol_id?: string | null
          source?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string | null
          dose?: string | null
          id?: string
          interval_days?: number
          interval_unit?: string
          interval_value?: number | null
          kind?: Database["public"]["Enums"]["care_cycle_kind"]
          last_done_at?: string | null
          name?: string
          next_due_at?: string
          notes?: string | null
          pet_id?: string
          product?: string | null
          protocol_id?: string | null
          source?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_cycles_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycles_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "care_protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_cycles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      care_protocols: {
        Row: {
          end_age_days: number | null
          first_due_offset_days: number
          id: string
          interval_days: number
          interval_unit: string
          kind: Database["public"]["Enums"]["care_cycle_kind"]
          name: string
          notes: string | null
          sort: number
          species: Database["public"]["Enums"]["pet_species"]
          stage: Database["public"]["Enums"]["life_stage"]
          start_age_days: number
        }
        Insert: {
          end_age_days?: number | null
          first_due_offset_days?: number
          id?: string
          interval_days: number
          interval_unit?: string
          kind: Database["public"]["Enums"]["care_cycle_kind"]
          name: string
          notes?: string | null
          sort?: number
          species: Database["public"]["Enums"]["pet_species"]
          stage: Database["public"]["Enums"]["life_stage"]
          start_age_days?: number
        }
        Update: {
          end_age_days?: number | null
          first_due_offset_days?: number
          id?: string
          interval_days?: number
          interval_unit?: string
          kind?: Database["public"]["Enums"]["care_cycle_kind"]
          name?: string
          notes?: string | null
          sort?: number
          species?: Database["public"]["Enums"]["pet_species"]
          stage?: Database["public"]["Enums"]["life_stage"]
          start_age_days?: number
        }
        Relationships: []
      }
      clinical_documents: {
        Row: {
          clinical_record_id: string
          created_at: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string
          file_url: string
          id: string
          storage_path: string
        }
        Insert: {
          clinical_record_id: string
          created_at?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          file_url: string
          id?: string
          storage_path: string
        }
        Update: {
          clinical_record_id?: string
          created_at?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          file_url?: string
          id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_documents_clinical_record_id_fkey"
            columns: ["clinical_record_id"]
            isOneToOne: false
            referencedRelation: "clinical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      clinical_records: {
        Row: {
          clinic_name: string | null
          created_at: string | null
          created_by_role: string | null
          diagnosis: string | null
          id: string
          notes: string | null
          pet_id: string
          treatment: string | null
          updated_at: string | null
          user_id: string
          vaccine_id: string | null
          vet_name: string | null
          visit_date: string
          visit_type: string
        }
        Insert: {
          clinic_name?: string | null
          created_at?: string | null
          created_by_role?: string | null
          diagnosis?: string | null
          id?: string
          notes?: string | null
          pet_id: string
          treatment?: string | null
          updated_at?: string | null
          user_id: string
          vaccine_id?: string | null
          vet_name?: string | null
          visit_date: string
          visit_type: string
        }
        Update: {
          clinic_name?: string | null
          created_at?: string | null
          created_by_role?: string | null
          diagnosis?: string | null
          id?: string
          notes?: string | null
          pet_id?: string
          treatment?: string | null
          updated_at?: string | null
          user_id?: string
          vaccine_id?: string | null
          vet_name?: string | null
          visit_date?: string
          visit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_records_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string | null
          event_id: string
          pet_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          pet_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          pet_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          active: boolean
          address: string | null
          business_id: string | null
          capacity: number | null
          category: string
          city: string | null
          cover_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          organizer_name: string | null
          price: number
          species: Database["public"]["Enums"]["pet_species"][] | null
          starts_at: string
          title: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          business_id?: string | null
          capacity?: number | null
          category: string
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          organizer_name?: string | null
          price?: number
          species?: Database["public"]["Enums"]["pet_species"][] | null
          starts_at: string
          title: string
        }
        Update: {
          active?: boolean
          address?: string | null
          business_id?: string | null
          capacity?: number | null
          category?: string
          city?: string | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          organizer_name?: string | null
          price?: number
          species?: Database["public"]["Enums"]["pet_species"][] | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          categoria: string
          created_at: string | null
          descripcion: string | null
          fecha: string
          id: string
          monto: number
          pet_id: string
          quien_pago: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          descripcion?: string | null
          fecha: string
          id?: string
          monto: number
          pet_id: string
          quien_pago?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          descripcion?: string | null
          fecha?: string
          id?: string
          monto?: number
          pet_id?: string
          quien_pago?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary: {
        Row: {
          cantidad: string | null
          created_at: string | null
          dias: number[]
          hora: string
          id: string
          nombre: string
          notas: string | null
          pet_id: string
          tipo: Database["public"]["Enums"]["itinerary_tipo"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cantidad?: string | null
          created_at?: string | null
          dias: number[]
          hora: string
          id?: string
          nombre: string
          notas?: string | null
          pet_id: string
          tipo: Database["public"]["Enums"]["itinerary_tipo"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cantidad?: string | null
          created_at?: string | null
          dias?: number[]
          hora?: string
          id?: string
          nombre?: string
          notas?: string | null
          pet_id?: string
          tipo?: Database["public"]["Enums"]["itinerary_tipo"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      itinerary_records: {
        Row: {
          completado: boolean | null
          completado_por: string | null
          created_at: string | null
          fecha: string
          id: string
          item_id: string
          pet_id: string
        }
        Insert: {
          completado?: boolean | null
          completado_por?: string | null
          created_at?: string | null
          fecha: string
          id?: string
          item_id: string
          pet_id: string
        }
        Update: {
          completado?: boolean | null
          completado_por?: string | null
          created_at?: string | null
          fecha?: string
          id?: string
          item_id?: string
          pet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_records_completado_por_fkey"
            columns: ["completado_por"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_records_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "itinerary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itinerary_records_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          listing_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          listing_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_analytics_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "marketplace_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_pet_alerts: {
        Row: {
          address: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          last_seen_at: string
          lat: number | null
          lng: number | null
          location: unknown
          message: string | null
          pet_id: string
          photo_url: string | null
          radius_m: number
          resolved_at: string | null
          reward: number | null
          status: string
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          last_seen_at?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          message?: string | null
          pet_id: string
          photo_url?: string | null
          radius_m?: number
          resolved_at?: string | null
          reward?: number | null
          status?: string
          user_id: string
        }
        Update: {
          address?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          last_seen_at?: string
          lat?: number | null
          lng?: number | null
          location?: unknown
          message?: string | null
          pet_id?: string
          photo_url?: string | null
          radius_m?: number
          resolved_at?: string | null
          reward?: number | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lost_pet_alerts_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_pet_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      lost_pet_sightings: {
        Row: {
          alert_id: string
          created_at: string | null
          id: string
          lat: number | null
          lng: number | null
          message: string | null
          photo_url: string | null
          user_id: string | null
        }
        Insert: {
          alert_id: string
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string | null
          photo_url?: string | null
          user_id?: string | null
        }
        Update: {
          alert_id?: string
          created_at?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          message?: string | null
          photo_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lost_pet_sightings_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "lost_pet_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lost_pet_sightings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_config: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      marketplace_listings: {
        Row: {
          active: boolean | null
          business_id: string
          category: string
          contact_email: string | null
          contact_whatsapp: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          price: number | null
          price_unit: string | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          business_id: string
          category: string
          contact_email?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          price?: number | null
          price_unit?: string | null
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          business_id?: string
          category?: string
          contact_email?: string | null
          contact_whatsapp?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          price?: number | null
          price_unit?: string | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_listings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_plans: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          has_analytics: boolean | null
          has_featured: boolean | null
          has_verified_badge: boolean | null
          id: string
          max_images: number | null
          max_listings: number | null
          name: string
          price_monthly: number | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          has_analytics?: boolean | null
          has_featured?: boolean | null
          has_verified_badge?: boolean | null
          id?: string
          max_images?: number | null
          max_listings?: number | null
          name: string
          price_monthly?: number | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          has_analytics?: boolean | null
          has_featured?: boolean | null
          has_verified_badge?: boolean | null
          id?: string
          max_images?: number | null
          max_listings?: number | null
          name?: string
          price_monthly?: number | null
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          administered_at: string | null
          created_at: string | null
          id: string
          medication_id: string
          notes: string | null
          pet_id: string
          scheduled_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          administered_at?: string | null
          created_at?: string | null
          id?: string
          medication_id: string
          notes?: string | null
          pet_id: string
          scheduled_at: string
          status?: string | null
          user_id: string
        }
        Update: {
          administered_at?: string | null
          created_at?: string | null
          id?: string
          medication_id?: string
          notes?: string | null
          pet_id?: string
          scheduled_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean | null
          created_at: string | null
          dose_amount: number
          dose_unit: string
          duration_days: number | null
          end_date: string | null
          frequency_unit: string
          frequency_value: number
          id: string
          name: string
          notes: string | null
          pet_id: string
          reason: string | null
          start_date: string
          updated_at: string | null
          user_id: string
          vet_name: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          dose_amount: number
          dose_unit: string
          duration_days?: number | null
          end_date?: string | null
          frequency_unit: string
          frequency_value: number
          id?: string
          name: string
          notes?: string | null
          pet_id: string
          reason?: string | null
          start_date: string
          updated_at?: string | null
          user_id: string
          vet_name?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          dose_amount?: number
          dose_unit?: string
          duration_days?: number | null
          end_date?: string | null
          frequency_unit?: string
          frequency_value?: number
          id?: string
          name?: string
          notes?: string | null
          pet_id?: string
          reason?: string | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
          vet_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medications_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          category: string
          enabled: boolean | null
          id: string
          user_id: string
        }
        Insert: {
          category: string
          enabled?: boolean | null
          id?: string
          user_id: string
        }
        Update: {
          category?: string
          enabled?: boolean | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_queue: {
        Row: {
          attempts: number | null
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          scheduled_for: string
          status: string | null
          subscription_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          attempts?: number | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          scheduled_for: string
          status?: string | null
          subscription_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          attempts?: number | null
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          scheduled_for?: string
          status?: string | null
          subscription_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_queue_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rate_tracker: {
        Row: {
          count: number | null
          hour_bucket: string
          user_id: string
        }
        Insert: {
          count?: number | null
          hour_bucket: string
          user_id: string
        }
        Update: {
          count?: number | null
          hour_bucket?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          leida: boolean | null
          mensaje: string | null
          pet_id: string | null
          scheduled_at: string | null
          tipo: Database["public"]["Enums"]["notification_tipo"]
          titulo: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string | null
          pet_id?: string | null
          scheduled_at?: string | null
          tipo: Database["public"]["Enums"]["notification_tipo"]
          titulo: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leida?: boolean | null
          mensaje?: string | null
          pet_id?: string | null
          scheduled_at?: string | null
          tipo?: Database["public"]["Enums"]["notification_tipo"]
          titulo?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_member_permissions: {
        Row: {
          id: string
          module: string
          permission: string
          pet_member_id: string
        }
        Insert: {
          id?: string
          module: string
          permission: string
          pet_member_id: string
        }
        Update: {
          id?: string
          module?: string
          permission?: string
          pet_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_member_permissions_pet_member_id_fkey"
            columns: ["pet_member_id"]
            isOneToOne: false
            referencedRelation: "pet_members"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_members: {
        Row: {
          accepted_at: string | null
          business_id: string | null
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          pet_id: string
          role: string
          service_type: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          pet_id: string
          role: string
          service_type?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          business_id?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          pet_id?: string
          role?: string
          service_type?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_members_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_photos: {
        Row: {
          created_at: string | null
          id: string
          original_filename: string | null
          pet_id: string
          photo_migration_failed: boolean | null
          photo_url: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_filename?: string | null
          pet_id: string
          photo_migration_failed?: boolean | null
          photo_url: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          original_filename?: string | null
          pet_id?: string
          photo_migration_failed?: boolean | null
          photo_url?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_photos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_photos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_videos: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          file_size_bytes: number
          id: string
          mime_type: string | null
          pet_id: string
          storage_path: string
          user_id: string
          video_url: string
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes: number
          id?: string
          mime_type?: string | null
          pet_id: string
          storage_path: string
          user_id: string
          video_url: string
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number
          id?: string
          mime_type?: string | null
          pet_id?: string
          storage_path?: string
          user_id?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_videos_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          activity_level: string | null
          allergies: string[] | null
          avatar_config: Json | null
          birth_date: string | null
          blood_type: string | null
          breed: string | null
          color: string | null
          conditions: string[] | null
          created_at: string | null
          emergency_contact: Json | null
          emoji: string | null
          food: Json | null
          id: string
          microchip: string | null
          name: string
          neutered: boolean | null
          photo_url: string | null
          reproductive: Json | null
          sex: string | null
          species: Database["public"]["Enums"]["pet_species"]
          updated_at: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          activity_level?: string | null
          allergies?: string[] | null
          avatar_config?: Json | null
          birth_date?: string | null
          blood_type?: string | null
          breed?: string | null
          color?: string | null
          conditions?: string[] | null
          created_at?: string | null
          emergency_contact?: Json | null
          emoji?: string | null
          food?: Json | null
          id?: string
          microchip?: string | null
          name: string
          neutered?: boolean | null
          photo_url?: string | null
          reproductive?: Json | null
          sex?: string | null
          species: Database["public"]["Enums"]["pet_species"]
          updated_at?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          activity_level?: string | null
          allergies?: string[] | null
          avatar_config?: Json | null
          birth_date?: string | null
          blood_type?: string | null
          breed?: string | null
          color?: string | null
          conditions?: string[] | null
          created_at?: string | null
          emergency_contact?: Json | null
          emoji?: string | null
          food?: Json | null
          id?: string
          microchip?: string | null
          name?: string
          neutered?: boolean | null
          photo_url?: string | null
          reproductive?: Json | null
          sex?: string | null
          species?: Database["public"]["Enums"]["pet_species"]
          updated_at?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          active: boolean | null
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          platform: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          platform?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          platform?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          business_id: string
          created_at: string | null
          id: string
          pet_id: string | null
          rating: number
          replied_at: string | null
          reply: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          business_id: string
          created_at?: string | null
          id?: string
          pet_id?: string | null
          rating: number
          replied_at?: string | null
          reply?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          business_id?: string
          created_at?: string | null
          id?: string
          pet_id?: string | null
          rating?: number
          replied_at?: string | null
          reply?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_businesses: {
        Row: {
          business_id: string
          created_at: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_businesses_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      share_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          pet_id: string
          scope: string
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string
          id?: string
          pet_id: string
          scope?: string
          token?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          pet_id?: string
          scope?: string
          token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_tokens_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_tokens_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      storage_cleanup_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          failed_permanently: boolean | null
          id: string
          last_attempt_at: string | null
          record_id: string | null
          record_type: string | null
          storage_path: string
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          failed_permanently?: boolean | null
          id?: string
          last_attempt_at?: string | null
          record_id?: string | null
          record_type?: string | null
          storage_path: string
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          failed_permanently?: boolean | null
          id?: string
          last_attempt_at?: string | null
          record_id?: string | null
          record_type?: string | null
          storage_path?: string
        }
        Relationships: []
      }
      training_sessions: {
        Row: {
          avances: string | null
          created_at: string | null
          ejercicios: string | null
          entrenador: string | null
          fecha: string
          id: string
          modalidad: Database["public"]["Enums"]["training_modalidad"] | null
          notas: string | null
          pet_id: string
          temas: string | null
          tipo_ejercicio: Database["public"]["Enums"]["training_tipo"]
          updated_at: string | null
          user_id: string
          video_storage_path: string | null
          video_url: string | null
        }
        Insert: {
          avances?: string | null
          created_at?: string | null
          ejercicios?: string | null
          entrenador?: string | null
          fecha: string
          id?: string
          modalidad?: Database["public"]["Enums"]["training_modalidad"] | null
          notas?: string | null
          pet_id: string
          temas?: string | null
          tipo_ejercicio: Database["public"]["Enums"]["training_tipo"]
          updated_at?: string | null
          user_id: string
          video_storage_path?: string | null
          video_url?: string | null
        }
        Update: {
          avances?: string | null
          created_at?: string | null
          ejercicios?: string | null
          entrenador?: string | null
          fecha?: string
          id?: string
          modalidad?: Database["public"]["Enums"]["training_modalidad"] | null
          notas?: string | null
          pet_id?: string
          temas?: string | null
          tipo_ejercicio?: Database["public"]["Enums"]["training_tipo"]
          updated_at?: string | null
          user_id?: string
          video_storage_path?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_tasks: {
        Row: {
          descripcion: string
          estado: Database["public"]["Enums"]["training_task_estado"] | null
          id: string
          session_id: string
        }
        Insert: {
          descripcion: string
          estado?: Database["public"]["Enums"]["training_task_estado"] | null
          id?: string
          session_id: string
        }
        Update: {
          descripcion?: string
          estado?: Database["public"]["Enums"]["training_task_estado"] | null
          id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_tasks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_locations: {
        Row: {
          city: string | null
          lat: number
          lng: number
          location: unknown
          neighborhood: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          lat: number
          lng: number
          location?: unknown
          neighborhood?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          lat?: number
          lng?: number
          location?: unknown
          neighborhood?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_locations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_storage_usage: {
        Row: {
          total_video_bytes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          total_video_bytes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          total_video_bytes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_storage_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          email: string
          google_id: string | null
          google_linked: boolean | null
          google_linked_at: string | null
          id: string
          migration_completed: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          google_id?: string | null
          google_linked?: boolean | null
          google_linked_at?: string | null
          id: string
          migration_completed?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          google_id?: string | null
          google_linked?: boolean | null
          google_linked_at?: string | null
          id?: string
          migration_completed?: boolean | null
        }
        Relationships: []
      }
      vaccines: {
        Row: {
          created_at: string | null
          cycle_id: string | null
          fecha_aplicacion: string
          id: string
          nombre: string
          notas: string | null
          pet_id: string
          proxima_fecha: string | null
          updated_at: string | null
          user_id: string
          veterinario: string | null
        }
        Insert: {
          created_at?: string | null
          cycle_id?: string | null
          fecha_aplicacion: string
          id?: string
          nombre: string
          notas?: string | null
          pet_id: string
          proxima_fecha?: string | null
          updated_at?: string | null
          user_id: string
          veterinario?: string | null
        }
        Update: {
          created_at?: string | null
          cycle_id?: string | null
          fecha_aplicacion?: string
          id?: string
          nombre?: string
          notas?: string | null
          pet_id?: string
          proxima_fecha?: string | null
          updated_at?: string | null
          user_id?: string
          veterinario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vaccines_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "care_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccines_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      weight_logs: {
        Row: {
          created_at: string | null
          id: string
          measured_at: string
          notes: string | null
          pet_id: string
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          measured_at?: string
          notes?: string | null
          pet_id: string
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          id?: string
          measured_at?: string
          notes?: string | null
          pet_id?: string
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "weight_logs_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weight_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      business_is_open: {
        Args: { p_emergency?: boolean; p_hours: Json }
        Returns: boolean
      }
      can_access_pet: {
        Args: { p_module?: string; p_perm?: string; p_pet_id: string }
        Returns: boolean
      }
      complete_care_cycle: {
        Args: {
          p_business_id?: string
          p_cost?: number
          p_cycle_id: string
          p_done_at?: string
          p_dose?: string
          p_notes?: string
          p_product?: string
        }
        Returns: string
      }
      decrypt_calendar_token: {
        Args: { p_key: string; p_token: string }
        Returns: string
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      encrypt_calendar_tokens: {
        Args: { p_access_token: string; p_key: string; p_refresh_token: string }
        Returns: Json
      }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_care_cycles_for_pet: {
        Args: { p_pet_id: string }
        Returns: number
      }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      gettransactionid: { Args: never; Returns: unknown }
      life_stage_for: {
        Args: {
          p_birth: string
          p_species: Database["public"]["Enums"]["pet_species"]
        }
        Returns: Database["public"]["Enums"]["life_stage"]
      }
      longtransactionsenabled: { Args: never; Returns: boolean }
      nearby_businesses: {
        Args: {
          p_categories?: string[]
          p_lat: number
          p_limit?: number
          p_lng: number
          p_min_rating?: number
          p_open_now?: boolean
          p_radius_m?: number
        }
        Returns: {
          address: string
          categories: string[]
          city: string
          cover_url: string
          description: string
          distance_m: number
          emergency_24h: boolean
          hours: Json
          id: string
          is_open: boolean
          lat: number
          lng: number
          logo_url: string
          name: string
          neighborhood: string
          phone: string
          price_from: number
          price_level: number
          promo_text: string
          rating_avg: number
          rating_count: number
          type: string
          verified: boolean
          whatsapp: string
          writes_history: boolean
        }[]
      }
      nearby_lost_pets: {
        Args: { p_lat: number; p_lng: number; p_radius_m?: number }
        Returns: {
          address: string
          breed: string
          contact_phone: string
          distance_m: number
          id: string
          last_seen_at: string
          lat: number
          lng: number
          message: string
          pet_id: string
          pet_name: string
          photo_url: string
          reward: number
          species: Database["public"]["Enums"]["pet_species"]
        }[]
      }
      nearest_emergency: {
        Args: { p_lat: number; p_limit?: number; p_lng: number }
        Returns: {
          active: boolean
          address: string | null
          categories: string[]
          city: string | null
          claimed: boolean
          cover_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          emergency_24h: boolean
          hours: Json | null
          id: string
          lat: number | null
          lng: number | null
          location: unknown
          logo_url: string | null
          name: string
          neighborhood: string | null
          owner_user_id: string | null
          phone: string | null
          photos: string[]
          price_from: number | null
          price_level: number | null
          promo_text: string | null
          qr_code: string
          rating_avg: number
          rating_count: number
          type: string
          updated_at: string | null
          verified: boolean | null
          whatsapp: string | null
          writes_history: boolean
        }[]
        SetofOptions: {
          from: "*"
          to: "businesses"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      pet_emergency_card: {
        Args: { p_token: string }
        Returns: {
          active_medications: Json
          allergies: string[]
          birth_date: string
          blood_type: string
          breed: string
          conditions: string[]
          emergency_contact: Json
          last_vaccines: Json
          lost_alert: Json
          microchip: string
          neutered: boolean
          owner_name: string
          pet_name: string
          photo_url: string
          sex: string
          species: Database["public"]["Enums"]["pet_species"]
          weight: number
        }[]
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      track_listing_event: {
        Args: { p_event: string; p_listing_id: string }
        Returns: undefined
      }
      unlockrows: { Args: { "": string }; Returns: number }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      users_within_radius: {
        Args: {
          p_lat: number
          p_limit?: number
          p_lng: number
          p_radius_m?: number
        }
        Returns: {
          distance_m: number
          user_id: string
        }[]
      }
    }
    Enums: {
      care_cycle_kind:
        | "vaccine"
        | "deworm_internal"
        | "deworm_external"
        | "bath"
        | "grooming"
        | "nails"
        | "ears"
        | "dental"
        | "food_restock"
        | "checkup"
        | "weight"
        | "other"
      itinerary_tipo: "comida" | "salida"
      life_stage: "puppy" | "adult" | "senior"
      notification_tipo: "nota" | "alerta" | "logro"
      pet_species: "perro" | "gato" | "ave" | "conejo" | "otro"
      training_modalidad: "clase" | "practica"
      training_task_estado: "pendiente" | "en_progreso" | "completado"
      training_tipo: "fisico" | "mental" | "comportamental"
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      care_cycle_kind: [
        "vaccine",
        "deworm_internal",
        "deworm_external",
        "bath",
        "grooming",
        "nails",
        "ears",
        "dental",
        "food_restock",
        "checkup",
        "weight",
        "other",
      ],
      itinerary_tipo: ["comida", "salida"],
      life_stage: ["puppy", "adult", "senior"],
      notification_tipo: ["nota", "alerta", "logro"],
      pet_species: ["perro", "gato", "ave", "conejo", "otro"],
      training_modalidad: ["clase", "practica"],
      training_task_estado: ["pendiente", "en_progreso", "completado"],
      training_tipo: ["fisico", "mental", "comportamental"],
    },
  },
} as const

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
      about_page_content: {
        Row: {
          id: number
          intro_ar: string
          intro_en: string
          mission_ar: string
          mission_en: string
          stat_countries: number
          stat_creators: number
          stat_users: number
          story_ar: string
          story_en: string
          team_ar: string
          team_en: string
          title_ar: string
          title_en: string
          updated_at: string
          vision_ar: string
          vision_en: string
        }
        Insert: {
          id?: number
          intro_ar?: string
          intro_en?: string
          mission_ar?: string
          mission_en?: string
          stat_countries?: number
          stat_creators?: number
          stat_users?: number
          story_ar?: string
          story_en?: string
          team_ar?: string
          team_en?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
          vision_ar?: string
          vision_en?: string
        }
        Update: {
          id?: number
          intro_ar?: string
          intro_en?: string
          mission_ar?: string
          mission_en?: string
          stat_countries?: number
          stat_creators?: number
          stat_users?: number
          story_ar?: string
          story_en?: string
          team_ar?: string
          team_en?: string
          title_ar?: string
          title_en?: string
          updated_at?: string
          vision_ar?: string
          vision_en?: string
        }
        Relationships: []
      }
      account_restrictions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          imposed_by: string | null
          reason: string | null
          shadow_banned: boolean
          updated_at: string
          user_id: string
          verification_frozen: boolean
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          imposed_by?: string | null
          reason?: string | null
          shadow_banned?: boolean
          updated_at?: string
          user_id: string
          verification_frozen?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          imposed_by?: string | null
          reason?: string | null
          shadow_banned?: boolean
          updated_at?: string
          user_id?: string
          verification_frozen?: boolean
        }
        Relationships: []
      }
      activity_intel: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          device: string | null
          event_type: string
          id: string
          ip: string | null
          metadata: Json | null
          os: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          event_type: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          os?: string | null
          severity?: string
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          event_type?: string
          id?: string
          ip?: string | null
          metadata?: Json | null
          os?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ad_interactions: {
        Row: {
          ad_id: string
          created_at: string | null
          id: string
          interaction_type: string
          user_id: string | null
        }
        Insert: {
          ad_id: string
          created_at?: string | null
          id?: string
          interaction_type: string
          user_id?: string | null
        }
        Update: {
          ad_id?: string
          created_at?: string | null
          id?: string
          interaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_interactions_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_otp_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string
          id: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      advertisements: {
        Row: {
          clicks_count: number | null
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          placement: string
          start_date: string
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          clicks_count?: number | null
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          placement: string
          start_date?: string
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          clicks_count?: number | null
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          placement?: string
          start_date?: string
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      agora_calls: {
        Row: {
          call_type: string
          caller_id: string
          channel_name: string
          created_at: string
          ended_at: string | null
          ended_by: string | null
          id: string
          receiver_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          call_type: string
          caller_id: string
          channel_name: string
          created_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          receiver_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          call_type?: string
          caller_id?: string
          channel_name?: string
          created_at?: string
          ended_at?: string | null
          ended_by?: string | null
          id?: string
          receiver_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_session_activity: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          session_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          session_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          session_date?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      app_settings_finance: {
        Row: {
          id: number
          platform_commission_rate: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          platform_commission_rate?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          platform_commission_rate?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      bot_config: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      bot_knowledge_base: {
        Row: {
          answer_ar: string
          answer_en: string
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          keywords: string[] | null
          priority: number | null
          question_ar: string
          question_en: string
          updated_at: string
        }
        Insert: {
          answer_ar: string
          answer_en: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question_ar: string
          question_en: string
          updated_at?: string
        }
        Update: {
          answer_ar?: string
          answer_en?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          priority?: number | null
          question_ar?: string
          question_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      broadcast_donations: {
        Row: {
          amount: number
          broadcast_id: string
          created_at: string | null
          creator_earning: number
          creator_user_id: string
          donor_user_id: string
          id: string
          message: string | null
          platform_fee: number
        }
        Insert: {
          amount: number
          broadcast_id: string
          created_at?: string | null
          creator_earning?: number
          creator_user_id: string
          donor_user_id: string
          id?: string
          message?: string | null
          platform_fee?: number
        }
        Update: {
          amount?: number
          broadcast_id?: string
          created_at?: string | null
          creator_earning?: number
          creator_user_id?: string
          donor_user_id?: string
          id?: string
          message?: string | null
          platform_fee?: number
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_donations_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_donations_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_donations_donor_user_id_fkey"
            columns: ["donor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_donations_donor_user_id_fkey"
            columns: ["donor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      call_history: {
        Row: {
          agora_call_id: string | null
          call_type: string
          caller_id: string
          created_at: string
          duration: number | null
          ended_at: string | null
          id: string
          receiver_id: string
          started_at: string
          status: string
        }
        Insert: {
          agora_call_id?: string | null
          call_type: string
          caller_id: string
          created_at?: string
          duration?: number | null
          ended_at?: string | null
          id?: string
          receiver_id: string
          started_at?: string
          status: string
        }
        Update: {
          agora_call_id?: string | null
          call_type?: string
          caller_id?: string
          created_at?: string
          duration?: number | null
          ended_at?: string | null
          id?: string
          receiver_id?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      call_settings: {
        Row: {
          auto_quality: boolean | null
          block_unverified: boolean | null
          call_sound: boolean | null
          created_at: string
          custom_allowed_users: string[] | null
          default_camera_off: boolean | null
          default_mic_muted: boolean | null
          echo_cancellation: boolean | null
          end_to_end_encryption: boolean | null
          hide_call_duration: boolean | null
          hide_online_status: boolean | null
          id: string
          in_app_notifications: boolean | null
          mute_duration: number | null
          mute_until: string | null
          noise_reduction: boolean | null
          prevent_recording: boolean | null
          push_notifications: boolean | null
          recording_alert: boolean | null
          updated_at: string
          user_id: string
          vibration: boolean | null
          video_calls_enabled: boolean | null
          voice_calls_enabled: boolean | null
          who_can_call: string | null
        }
        Insert: {
          auto_quality?: boolean | null
          block_unverified?: boolean | null
          call_sound?: boolean | null
          created_at?: string
          custom_allowed_users?: string[] | null
          default_camera_off?: boolean | null
          default_mic_muted?: boolean | null
          echo_cancellation?: boolean | null
          end_to_end_encryption?: boolean | null
          hide_call_duration?: boolean | null
          hide_online_status?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          mute_duration?: number | null
          mute_until?: string | null
          noise_reduction?: boolean | null
          prevent_recording?: boolean | null
          push_notifications?: boolean | null
          recording_alert?: boolean | null
          updated_at?: string
          user_id: string
          vibration?: boolean | null
          video_calls_enabled?: boolean | null
          voice_calls_enabled?: boolean | null
          who_can_call?: string | null
        }
        Update: {
          auto_quality?: boolean | null
          block_unverified?: boolean | null
          call_sound?: boolean | null
          created_at?: string
          custom_allowed_users?: string[] | null
          default_camera_off?: boolean | null
          default_mic_muted?: boolean | null
          echo_cancellation?: boolean | null
          end_to_end_encryption?: boolean | null
          hide_call_duration?: boolean | null
          hide_online_status?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          mute_duration?: number | null
          mute_until?: string | null
          noise_reduction?: boolean | null
          prevent_recording?: boolean | null
          push_notifications?: boolean | null
          recording_alert?: boolean | null
          updated_at?: string
          user_id?: string
          vibration?: boolean | null
          video_calls_enabled?: boolean | null
          voice_calls_enabled?: boolean | null
          who_can_call?: string | null
        }
        Relationships: []
      }
      call_signals: {
        Row: {
          call_id: string
          created_at: string
          from_user_id: string
          id: string
          signal_data: Json | null
          signal_type: string
          to_user_id: string
        }
        Insert: {
          call_id: string
          created_at?: string
          from_user_id: string
          id?: string
          signal_data?: Json | null
          signal_type: string
          to_user_id: string
        }
        Update: {
          call_id?: string
          created_at?: string
          from_user_id?: string
          id?: string
          signal_data?: Json | null
          signal_type?: string
          to_user_id?: string
        }
        Relationships: []
      }
      careers_jobs: {
        Row: {
          department: string | null
          description: string
          employment_type: string | null
          id: string
          is_open: boolean
          location: string | null
          posted_at: string
          requirements: string | null
          title: string
          updated_at: string
        }
        Insert: {
          department?: string | null
          description?: string
          employment_type?: string | null
          id?: string
          is_open?: boolean
          location?: string | null
          posted_at?: string
          requirements?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          department?: string | null
          description?: string
          employment_type?: string | null
          id?: string
          is_open?: boolean
          location?: string | null
          posted_at?: string
          requirements?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      close_friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      combo_leaderboard: {
        Row: {
          created_at: string
          id: string
          max_combo: number
          room_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_combo?: number
          room_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          max_combo?: number
          room_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "combo_leaderboard_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          replies_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          replies_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          replies_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          website?: string | null
        }
        Relationships: []
      }
      company_affiliation_requests: {
        Row: {
          company_id: string
          created_at: string
          id: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_affiliation_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_logs: {
        Row: {
          accepted_at: string
          context: string | null
          document_type: string
          document_version: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          context?: string | null
          document_type: string
          document_version: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          context?: string | null
          document_type?: string
          document_version?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archived_by: string[] | null
          created_at: string
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          pinned_by: string[] | null
          updated_at: string
        }
        Insert: {
          archived_by?: string[] | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          pinned_by?: string[] | null
          updated_at?: string
        }
        Update: {
          archived_by?: string[] | null
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          pinned_by?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          amount: number
          created_at: string
          id: string
          receipt_url: string | null
          reject_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          receipt_url?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          receipt_url?: string | null
          reject_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      donation_replies: {
        Row: {
          created_at: string | null
          creator_user_id: string
          donation_id: string
          donor_user_id: string
          id: string
          reply_message: string
        }
        Insert: {
          created_at?: string | null
          creator_user_id: string
          donation_id: string
          donor_user_id: string
          id?: string
          reply_message: string
        }
        Update: {
          created_at?: string | null
          creator_user_id?: string
          donation_id?: string
          donor_user_id?: string
          id?: string
          reply_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_replies_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_replies_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_replies_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "broadcast_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_replies_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "broadcast_donations_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_replies_donor_user_id_fkey"
            columns: ["donor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_replies_donor_user_id_fkey"
            columns: ["donor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invite_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          parent_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          parent_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          parent_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      family_links: {
        Row: {
          created_at: string
          id: string
          parent_id: string
          teen_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id: string
          teen_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string
          teen_id?: string
        }
        Relationships: []
      }
      family_restrictions: {
        Row: {
          content_filter_level: string
          daily_time_limit_minutes: number | null
          dm_scope: string
          id: string
          link_id: string
          updated_at: string
        }
        Insert: {
          content_filter_level?: string
          daily_time_limit_minutes?: number | null
          dm_scope?: string
          id?: string
          link_id: string
          updated_at?: string
        }
        Update: {
          content_filter_level?: string
          daily_time_limit_minutes?: number | null
          dm_scope?: string
          id?: string
          link_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_restrictions_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: true
            referencedRelation: "family_links"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_posts: {
        Row: {
          author_avatar: string | null
          author_location: string | null
          author_name: string
          comments_count: number | null
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          likes_count: number | null
          media_url: string | null
        }
        Insert: {
          author_avatar?: string | null
          author_location?: string | null
          author_name: string
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          likes_count?: number | null
          media_url?: string | null
        }
        Update: {
          author_avatar?: string | null
          author_location?: string | null
          author_name?: string
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          likes_count?: number | null
          media_url?: string | null
        }
        Relationships: []
      }
      financial_alerts: {
        Row: {
          alert_type: string
          amount: number
          created_at: string
          evidence: Json | null
          id: string
          status: string
          user_id: string
          window_minutes: number | null
        }
        Insert: {
          alert_type: string
          amount?: number
          created_at?: string
          evidence?: Json | null
          id?: string
          status?: string
          user_id: string
          window_minutes?: number | null
        }
        Update: {
          alert_type?: string
          amount?: number
          created_at?: string
          evidence?: Json | null
          id?: string
          status?: string
          user_id?: string
          window_minutes?: number | null
        }
        Relationships: []
      }
      follow_events: {
        Row: {
          created_at: string
          event_type: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          event_type?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      gift_codes: {
        Row: {
          code: string
          coin_amount: number
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          redeemed_at: string | null
          redeemed_by: string | null
          status: string
        }
        Insert: {
          code: string
          coin_amount: number
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
        }
        Update: {
          code?: string
          coin_amount?: number
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      gift_ledger: {
        Row: {
          channel_name: string | null
          commission_rate: number
          created_at: string
          creator_earning: number
          creator_id: string
          gift_id: string
          gift_name: string | null
          id: string
          ip_address: string | null
          platform_fee: number
          quantity: number
          sender_id: string
          status: string
          stream_id: string | null
          total_price: number
          unit_price: number
          user_agent: string | null
        }
        Insert: {
          channel_name?: string | null
          commission_rate?: number
          created_at?: string
          creator_earning?: number
          creator_id: string
          gift_id: string
          gift_name?: string | null
          id?: string
          ip_address?: string | null
          platform_fee?: number
          quantity?: number
          sender_id: string
          status?: string
          stream_id?: string | null
          total_price: number
          unit_price: number
          user_agent?: string | null
        }
        Update: {
          channel_name?: string | null
          commission_rate?: number
          created_at?: string
          creator_earning?: number
          creator_id?: string
          gift_id?: string
          gift_name?: string | null
          id?: string
          ip_address?: string | null
          platform_fee?: number
          quantity?: number
          sender_id?: string
          status?: string
          stream_id?: string | null
          total_price?: number
          unit_price?: number
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_ledger_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_redemptions: {
        Row: {
          code: string
          coin_amount: number
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          coin_amount: number
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          coin_amount?: number
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      highlight_stories: {
        Row: {
          added_at: string
          highlight_id: string
          id: string
          story_id: string
        }
        Insert: {
          added_at?: string
          highlight_id: string
          id?: string
          story_id: string
        }
        Update: {
          added_at?: string
          highlight_id?: string
          id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "highlight_stories_highlight_id_fkey"
            columns: ["highlight_id"]
            isOneToOne: false
            referencedRelation: "highlights"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "highlight_stories_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      highlights: {
        Row: {
          cover_image: string | null
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      live_bans: {
        Row: {
          banned_by: string
          created_at: string
          host_id: string
          id: string
          reason: string | null
          stream_id: string
          user_id: string
        }
        Insert: {
          banned_by: string
          created_at?: string
          host_id: string
          id?: string
          reason?: string | null
          stream_id: string
          user_id: string
        }
        Update: {
          banned_by?: string
          created_at?: string
          host_id?: string
          id?: string
          reason?: string | null
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_bans_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_entrance_events: {
        Row: {
          created_at: string
          effect_key: string | null
          host_id: string
          id: string
          stream_id: string | null
          viewer_id: string
          vip_tier: string
        }
        Insert: {
          created_at?: string
          effect_key?: string | null
          host_id: string
          id?: string
          stream_id?: string | null
          viewer_id: string
          vip_tier?: string
        }
        Update: {
          created_at?: string
          effect_key?: string | null
          host_id?: string
          id?: string
          stream_id?: string | null
          viewer_id?: string
          vip_tier?: string
        }
        Relationships: []
      }
      live_gift_catalog: {
        Row: {
          animation_key: string | null
          category: string
          combo_enabled: boolean
          created_at: string
          emoji: string | null
          icon_url: string | null
          id: string
          is_active: boolean
          leaderboard_points: number
          name: string
          name_ar: string | null
          price_coins: number
          sort_order: number
          sound_key: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          animation_key?: string | null
          category: string
          combo_enabled?: boolean
          created_at?: string
          emoji?: string | null
          icon_url?: string | null
          id: string
          is_active?: boolean
          leaderboard_points?: number
          name: string
          name_ar?: string | null
          price_coins?: number
          sort_order?: number
          sound_key?: string | null
          tier?: string
          updated_at?: string
        }
        Update: {
          animation_key?: string | null
          category?: string
          combo_enabled?: boolean
          created_at?: string
          emoji?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean
          leaderboard_points?: number
          name?: string
          name_ar?: string | null
          price_coins?: number
          sort_order?: number
          sound_key?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_goals: {
        Row: {
          created_at: string
          current_count: number
          host_id: string
          id: string
          is_completed: boolean
          reward_coins: number
          stream_id: string
          target_count: number
          target_gift_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_count?: number
          host_id: string
          id?: string
          is_completed?: boolean
          reward_coins?: number
          stream_id: string
          target_count: number
          target_gift_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_count?: number
          host_id?: string
          id?: string
          is_completed?: boolean
          reward_coins?: number
          stream_id?: string
          target_count?: number
          target_gift_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_goals_target_gift_id_fkey"
            columns: ["target_gift_id"]
            isOneToOne: false
            referencedRelation: "live_gift_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      live_guest_slots: {
        Row: {
          created_at: string
          guest_user_id: string | null
          host_id: string
          id: string
          joined_at: string | null
          requested_at: string | null
          slot_index: number
          status: string
          stream_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guest_user_id?: string | null
          host_id: string
          id?: string
          joined_at?: string | null
          requested_at?: string | null
          slot_index: number
          status?: string
          stream_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guest_user_id?: string | null
          host_id?: string
          id?: string
          joined_at?: string | null
          requested_at?: string | null
          slot_index?: number
          status?: string
          stream_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_guest_slots_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_join_requests: {
        Row: {
          created_at: string
          id: string
          room_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          room_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          room_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_join_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "live_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      live_leaderboard_snapshots: {
        Row: {
          computed_at: string
          created_at: string
          id: string
          kind: string
          period: string
          rank: number
          score: number
          user_id: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          id?: string
          kind: string
          period: string
          rank: number
          score?: number
          user_id: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          id?: string
          kind?: string
          period?: string
          rank?: number
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      live_mission_progress: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          mission_id: string
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id: string
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_mission_progress_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "live_missions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_missions: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          kind: string
          requirement_target: number
          requirement_type: string
          reward_coins: number
          sort_order: number
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          kind: string
          requirement_target?: number
          requirement_type: string
          reward_coins?: number
          sort_order?: number
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          requirement_target?: number
          requirement_type?: string
          reward_coins?: number
          sort_order?: number
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      live_moderators: {
        Row: {
          created_at: string
          granted_by: string
          host_id: string
          id: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by: string
          host_id: string
          id?: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          host_id?: string
          id?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_moderators_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_pinned_messages: {
        Row: {
          created_at: string
          host_id: string
          id: string
          message: string
          pinned_by: string
          stream_id: string
        }
        Insert: {
          created_at?: string
          host_id: string
          id?: string
          message: string
          pinned_by: string
          stream_id: string
        }
        Update: {
          created_at?: string
          host_id?: string
          id?: string
          message?: string
          pinned_by?: string
          stream_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_pinned_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_pk_battles: {
        Row: {
          created_at: string
          ended_at: string | null
          host_id: string
          host_score: number
          host_stream_id: string | null
          id: string
          opponent_id: string | null
          opponent_score: number
          opponent_stream_id: string | null
          started_at: string | null
          status: string
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          host_id: string
          host_score?: number
          host_stream_id?: string | null
          id?: string
          opponent_id?: string | null
          opponent_score?: number
          opponent_stream_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          host_id?: string
          host_score?: number
          host_stream_id?: string | null
          id?: string
          opponent_id?: string | null
          opponent_score?: number
          opponent_stream_id?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      live_quest_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          ends_at: string | null
          host_id: string
          id: string
          is_completed: boolean
          progress: number
          quest_id: string
          stream_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          ends_at?: string | null
          host_id: string
          id?: string
          is_completed?: boolean
          progress?: number
          quest_id: string
          stream_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          ends_at?: string | null
          host_id?: string
          id?: string
          is_completed?: boolean
          progress?: number
          quest_id?: string
          stream_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "live_quests"
            referencedColumns: ["id"]
          },
        ]
      }
      live_quests: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          id: string
          is_active: boolean
          metric: string
          reward_coins: number
          sort_order: number
          target_value: number
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          metric: string
          reward_coins?: number
          sort_order?: number
          target_value: number
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          id?: string
          is_active?: boolean
          metric?: string
          reward_coins?: number
          sort_order?: number
          target_value?: number
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      live_rooms: {
        Row: {
          created_at: string
          daily_room_name: string
          daily_room_url: string
          ended_at: string | null
          host_id: string
          id: string
          last_heartbeat_at: string
          max_participants: number | null
          status: string
          title: string | null
          updated_at: string
          viewer_count: number | null
        }
        Insert: {
          created_at?: string
          daily_room_name: string
          daily_room_url: string
          ended_at?: string | null
          host_id: string
          id?: string
          last_heartbeat_at?: string
          max_participants?: number | null
          status?: string
          title?: string | null
          updated_at?: string
          viewer_count?: number | null
        }
        Update: {
          created_at?: string
          daily_room_name?: string
          daily_room_url?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          last_heartbeat_at?: string
          max_participants?: number | null
          status?: string
          title?: string | null
          updated_at?: string
          viewer_count?: number | null
        }
        Relationships: []
      }
      live_rounds: {
        Row: {
          created_at: string
          ends_at: string | null
          host_id: string
          id: string
          round_name: string
          round_number: number
          score: Json
          started_at: string
          stream_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          host_id: string
          id?: string
          round_name: string
          round_number: number
          score?: Json
          started_at?: string
          stream_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          host_id?: string
          id?: string
          round_name?: string
          round_number?: number
          score?: Json
          started_at?: string
          stream_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_streams: {
        Row: {
          channel_name: string
          created_at: string
          ended_at: string | null
          host_id: string
          id: string
          killed_by: string | null
          killed_reason: string | null
          last_heartbeat_at: string
          started_at: string
          status: string
          title: string | null
          updated_at: string
          viewer_count: number
        }
        Insert: {
          channel_name: string
          created_at?: string
          ended_at?: string | null
          host_id: string
          id?: string
          killed_by?: string | null
          killed_reason?: string | null
          last_heartbeat_at?: string
          started_at?: string
          status?: string
          title?: string | null
          updated_at?: string
          viewer_count?: number
        }
        Update: {
          channel_name?: string
          created_at?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          killed_by?: string | null
          killed_reason?: string | null
          last_heartbeat_at?: string
          started_at?: string
          status?: string
          title?: string | null
          updated_at?: string
          viewer_count?: number
        }
        Relationships: []
      }
      live_summary: {
        Row: {
          chart_data: Json
          coins_earned: number
          comments_count: number
          created_at: string
          duration_seconds: number
          estimated_revenue_iqd: number
          followers_gained: number
          gift_income_coins: number
          host_id: string
          id: string
          likes_count: number
          peak_viewers: number
          stream_id: string
          top_supporters: Json
          updated_at: string
          views_count: number
        }
        Insert: {
          chart_data?: Json
          coins_earned?: number
          comments_count?: number
          created_at?: string
          duration_seconds?: number
          estimated_revenue_iqd?: number
          followers_gained?: number
          gift_income_coins?: number
          host_id: string
          id?: string
          likes_count?: number
          peak_viewers?: number
          stream_id: string
          top_supporters?: Json
          updated_at?: string
          views_count?: number
        }
        Update: {
          chart_data?: Json
          coins_earned?: number
          comments_count?: number
          created_at?: string
          duration_seconds?: number
          estimated_revenue_iqd?: number
          followers_gained?: number
          gift_income_coins?: number
          host_id?: string
          id?: string
          likes_count?: number
          peak_viewers?: number
          stream_id?: string
          top_supporters?: Json
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      live_super_gift_events: {
        Row: {
          created_at: string
          gift_id: string
          host_id: string
          id: string
          quantity: number
          sender_id: string
          stream_id: string | null
          vip_level: string | null
        }
        Insert: {
          created_at?: string
          gift_id: string
          host_id: string
          id?: string
          quantity?: number
          sender_id: string
          stream_id?: string | null
          vip_level?: string | null
        }
        Update: {
          created_at?: string
          gift_id?: string
          host_id?: string
          id?: string
          quantity?: number
          sender_id?: string
          stream_id?: string | null
          vip_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_super_gift_events_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "live_gift_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      live_treasure_box: {
        Row: {
          created_at: string
          expires_at: string | null
          host_id: string
          id: string
          opened_at: string | null
          opened_by: string | null
          reward_coins: number
          stream_id: string
          tier: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          host_id: string
          id?: string
          opened_at?: string | null
          opened_by?: string | null
          reward_coins?: number
          stream_id: string
          tier?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          host_id?: string
          id?: string
          opened_at?: string | null
          opened_by?: string | null
          reward_coins?: number
          stream_id?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_treasure_box_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_vip_levels: {
        Row: {
          entrance_effect: string | null
          lifetime_spend: number
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          entrance_effect?: string | null
          lifetime_spend?: number
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          entrance_effect?: string | null
          lifetime_spend?: number
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      login_history: {
        Row: {
          city: string | null
          country: string | null
          country_code: string | null
          created_at: string
          device_label: string | null
          id: string
          ip_address: string | null
          is_new_device: boolean
          is_new_ip: boolean
          isp: string | null
          user_agent: string | null
          user_agent_hash: string | null
          user_id: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_label?: string | null
          id?: string
          ip_address?: string | null
          is_new_device?: boolean
          is_new_ip?: boolean
          isp?: string | null
          user_agent?: string | null
          user_agent_hash?: string | null
          user_id: string
        }
        Update: {
          city?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          device_label?: string | null
          id?: string
          ip_address?: string | null
          is_new_device?: boolean
          is_new_ip?: boolean
          isp?: string | null
          user_agent?: string | null
          user_agent_hash?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_otp_codes: {
        Row: {
          attempts: number
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          attempts?: number
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          attempts?: number
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          away_team: string
          created_at: string
          created_by: string | null
          home_team: string
          id: string
          league: string | null
          notes: string | null
          start_time: string
          status: string
          stream_url: string | null
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          away_team: string
          created_at?: string
          created_by?: string | null
          home_team: string
          id?: string
          league?: string | null
          notes?: string | null
          start_time?: string
          status?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          away_team?: string
          created_at?: string
          created_by?: string | null
          home_team?: string
          id?: string
          league?: string | null
          notes?: string | null
          start_time?: string
          status?: string
          stream_url?: string | null
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          deleted_for_everyone: boolean | null
          deleted_for_receiver: boolean | null
          deleted_for_sender: boolean | null
          id: string
          is_read: boolean | null
          is_temporary: boolean | null
          media_type: string | null
          media_url: string | null
          reply_to_message_id: string | null
          sender_id: string
          view_count: number | null
          view_once: boolean | null
          view_twice: boolean | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          deleted_for_everyone?: boolean | null
          deleted_for_receiver?: boolean | null
          deleted_for_sender?: boolean | null
          id?: string
          is_read?: boolean | null
          is_temporary?: boolean | null
          media_type?: string | null
          media_url?: string | null
          reply_to_message_id?: string | null
          sender_id: string
          view_count?: number | null
          view_once?: boolean | null
          view_twice?: boolean | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          deleted_for_everyone?: boolean | null
          deleted_for_receiver?: boolean | null
          deleted_for_sender?: boolean | null
          id?: string
          is_read?: boolean | null
          is_temporary?: boolean | null
          media_type?: string | null
          media_url?: string | null
          reply_to_message_id?: string | null
          sender_id?: string
          view_count?: number | null
          view_once?: boolean | null
          view_twice?: boolean | null
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
            foreignKeyName: "messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      moderator_permissions: {
        Row: {
          can_approve_videos: boolean
          can_ban_users: boolean
          can_delete_content: boolean
          can_manage_comments: boolean
          can_view_logs: boolean
          can_view_reports: boolean
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_approve_videos?: boolean
          can_ban_users?: boolean
          can_delete_content?: boolean
          can_manage_comments?: boolean
          can_view_logs?: boolean
          can_view_reports?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_approve_videos?: boolean
          can_ban_users?: boolean
          can_delete_content?: boolean
          can_manage_comments?: boolean
          can_view_logs?: boolean
          can_view_reports?: boolean
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      muted_callers: {
        Row: {
          created_at: string
          id: string
          muted_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          muted_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          muted_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          comment_id: string | null
          content: string | null
          created_at: string
          id: string
          is_read: boolean | null
          post_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id: string
          comment_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          post_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string
          comment_id?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          post_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_gateways: {
        Row: {
          barcode_image_url: string | null
          bonus_percent: number
          created_at: string
          icon: string | null
          id: string
          instructions_ar: string | null
          instructions_en: string | null
          is_active: boolean
          key: string
          max_amount: number
          min_amount: number
          name_ar: string
          name_en: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          barcode_image_url?: string | null
          bonus_percent?: number
          created_at?: string
          icon?: string | null
          id?: string
          instructions_ar?: string | null
          instructions_en?: string | null
          is_active?: boolean
          key: string
          max_amount?: number
          min_amount?: number
          name_ar: string
          name_en: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          barcode_image_url?: string | null
          bonus_percent?: number
          created_at?: string
          icon?: string | null
          id?: string
          instructions_ar?: string | null
          instructions_en?: string | null
          is_active?: boolean
          key?: string
          max_amount?: number
          min_amount?: number
          name_ar?: string
          name_en?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          is_default: boolean | null
          method_details: Json
          method_name: string
          method_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          method_details: Json
          method_name: string
          method_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean | null
          method_details?: Json
          method_name?: string
          method_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pinned_explore_posts: {
        Row: {
          created_at: string
          id: string
          pinned_by: string
          position: number
          post_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pinned_by: string
          position: number
          post_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pinned_by?: string
          position?: number
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinned_explore_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_entitlements: {
        Row: {
          created_at: string
          enabled: boolean
          feature_key: string
          id: string
          limit_value: number | null
          plan_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature_key: string
          id?: string
          limit_value?: number | null
          plan_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_key?: string
          id?: string
          limit_value?: number | null
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_entitlements_feature_key_fkey"
            columns: ["feature_key"]
            isOneToOne: false
            referencedRelation: "plan_features"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "plan_entitlements_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_features: {
        Row: {
          category: string
          created_at: string
          description: string | null
          key: string
          name: string
          name_ar: string
          sort_order: number
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          key: string
          name: string
          name_ar: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          key?: string
          name?: string
          name_ar?: string
          sort_order?: number
        }
        Relationships: []
      }
      post_tips: {
        Row: {
          amount: number
          created_at: string
          creator_earning: number
          creator_id: string
          id: string
          message: string | null
          platform_fee: number
          post_id: string
          tipper_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          creator_earning?: number
          creator_id: string
          id?: string
          message?: string | null
          platform_fee?: number
          post_id: string
          tipper_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          creator_earning?: number
          creator_id?: string
          id?: string
          message?: string | null
          platform_fee?: number
          post_id?: string
          tipper_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tips_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          close_friends_only: boolean | null
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          location: string | null
          location_lat: number | null
          location_lng: number | null
          media_url: string | null
          mentions: string[] | null
          music_artist: string | null
          music_start_time: number
          music_title: string | null
          music_url: string | null
          shares_count: number | null
          tipping_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          close_friends_only?: boolean | null
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          media_url?: string | null
          mentions?: string[] | null
          music_artist?: string | null
          music_start_time?: number
          music_title?: string | null
          music_url?: string | null
          shares_count?: number | null
          tipping_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          close_friends_only?: boolean | null
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          media_url?: string | null
          mentions?: string[] | null
          music_artist?: string | null
          music_start_time?: number
          music_title?: string | null
          music_url?: string | null
          shares_count?: number | null
          tipping_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type_enum"] | null
          affiliated_company_id: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          business_category: string | null
          business_description: string | null
          business_email: string | null
          business_hours: Json | null
          business_website: string | null
          cover_url: string | null
          created_at: string
          fame_score: number | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          gender: string | null
          id: string
          is_banned: boolean
          is_business_account: boolean | null
          is_live: boolean
          is_suspended: boolean
          is_verified: boolean | null
          location: string | null
          phone_country_code: string | null
          phone_number: string | null
          profession: string | null
          school: string | null
          social_links: Json | null
          specialty: string | null
          updated_at: string
          username: string | null
          verification_type: string | null
          website: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type_enum"] | null
          affiliated_company_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          business_category?: string | null
          business_description?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_website?: string | null
          cover_url?: string | null
          created_at?: string
          fame_score?: number | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_banned?: boolean
          is_business_account?: boolean | null
          is_live?: boolean
          is_suspended?: boolean
          is_verified?: boolean | null
          location?: string | null
          phone_country_code?: string | null
          phone_number?: string | null
          profession?: string | null
          school?: string | null
          social_links?: Json | null
          specialty?: string | null
          updated_at?: string
          username?: string | null
          verification_type?: string | null
          website?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type_enum"] | null
          affiliated_company_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          business_category?: string | null
          business_description?: string | null
          business_email?: string | null
          business_hours?: Json | null
          business_website?: string | null
          cover_url?: string | null
          created_at?: string
          fame_score?: number | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_banned?: boolean
          is_business_account?: boolean | null
          is_live?: boolean
          is_suspended?: boolean
          is_verified?: boolean | null
          location?: string | null
          phone_country_code?: string | null
          phone_number?: string | null
          profession?: string | null
          school?: string | null
          social_links?: Json | null
          specialty?: string | null
          updated_at?: string
          username?: string | null
          verification_type?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_affiliated_company_id_fkey"
            columns: ["affiliated_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      public_stories: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          media_type: string
          media_url: string
          start_date: string
          title: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          media_type: string
          media_url: string
          start_date?: string
          title: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          media_type?: string
          media_url?: string
          start_date?: string
          title?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      public_story_usage: {
        Row: {
          created_at: string
          id: string
          public_story_id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          public_story_id: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          public_story_id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_story_usage_public_story_id_fkey"
            columns: ["public_story_id"]
            isOneToOne: false
            referencedRelation: "public_stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_story_usage_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reel_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          reel_id: string
          replies_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          reel_id: string
          replies_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          reel_id?: string
          replies_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "reel_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_likes: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reel_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          caption: string | null
          close_friends_only: boolean | null
          comments_count: number | null
          created_at: string
          duration: number | null
          id: string
          likes_count: number | null
          location: string | null
          location_lat: number | null
          location_lng: number | null
          mentions: string[] | null
          music_artist: string | null
          music_title: string | null
          music_url: string | null
          shares_count: number | null
          show_in_feed: boolean | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
          video_url: string
          views_count: number | null
        }
        Insert: {
          caption?: string | null
          close_friends_only?: boolean | null
          comments_count?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          likes_count?: number | null
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          mentions?: string[] | null
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          shares_count?: number | null
          show_in_feed?: boolean | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
          video_url: string
          views_count?: number | null
        }
        Update: {
          caption?: string | null
          close_friends_only?: boolean | null
          comments_count?: number | null
          created_at?: string
          duration?: number | null
          id?: string
          likes_count?: number | null
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          mentions?: string[] | null
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          shares_count?: number | null
          show_in_feed?: boolean | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
          video_url?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reels_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          additional_details: string | null
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          reel_id: string | null
          report_reason: string
          report_type: string
          reported_user_id: string | null
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          additional_details?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reel_id?: string | null
          report_reason: string
          report_type: string
          reported_user_id?: string | null
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          additional_details?: string | null
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          reel_id?: string | null
          report_reason?: string
          report_type?: string
          reported_user_id?: string | null
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reposts: {
        Row: {
          created_at: string
          id: string
          post_id: string | null
          reel_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id?: string | null
          reel_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string | null
          reel_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reposts_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_hashtags: {
        Row: {
          created_at: string
          hashtag: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hashtag: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hashtag?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_music: {
        Row: {
          created_at: string
          id: string
          music_artist: string | null
          music_title: string
          music_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          music_artist?: string | null
          music_title: string
          music_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          music_artist?: string | null
          music_title?: string
          music_url?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_posts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_reels: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_reels_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          action_type: string
          attempted_route: string
          created_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type?: string
          attempted_route: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          attempted_route?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seo_meta: {
        Row: {
          description: string
          id: string
          keywords: string
          route: string
          title: string
          updated_at: string
        }
        Insert: {
          description?: string
          id?: string
          keywords?: string
          route: string
          title?: string
          updated_at?: string
        }
        Update: {
          description?: string
          id?: string
          keywords?: string
          route?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_pages: {
        Row: {
          body: string
          id: string
          meta_description: string | null
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          body?: string
          id?: string
          meta_description?: string | null
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          body?: string
          id?: string
          meta_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      stories: {
        Row: {
          allow_story_replies: boolean | null
          close_friends_only: boolean | null
          created_at: string
          expires_at: string
          id: string
          location: string | null
          location_lat: number | null
          location_lng: number | null
          media_type: string
          media_url: string
          music_artist: string | null
          music_title: string | null
          music_url: string | null
          poll_options: Json | null
          poll_question: string | null
          poll_votes: Json | null
          question_text: string | null
          sticker_data: Json | null
          story_type: string | null
          user_id: string
          views_count: number | null
        }
        Insert: {
          allow_story_replies?: boolean | null
          close_friends_only?: boolean | null
          created_at?: string
          expires_at?: string
          id?: string
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          media_type: string
          media_url: string
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          poll_options?: Json | null
          poll_question?: string | null
          poll_votes?: Json | null
          question_text?: string | null
          sticker_data?: Json | null
          story_type?: string | null
          user_id: string
          views_count?: number | null
        }
        Update: {
          allow_story_replies?: boolean | null
          close_friends_only?: boolean | null
          created_at?: string
          expires_at?: string
          id?: string
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          media_type?: string
          media_url?: string
          music_artist?: string | null
          music_title?: string | null
          music_url?: string | null
          poll_options?: Json | null
          poll_question?: string | null
          poll_votes?: Json | null
          question_text?: string | null
          sticker_data?: Json | null
          story_type?: string | null
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      story_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_comments_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_question_responses: {
        Row: {
          created_at: string
          id: string
          response_text: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          response_text: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          response_text?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_question_responses_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_replies: {
        Row: {
          content: string | null
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          receiver_id: string
          sender_id: string
          story_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          receiver_id: string
          sender_id: string
          story_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          receiver_id?: string
          sender_id?: string
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_replies_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          user_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          story_id: string
          user_id: string
          viewed_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          user_id?: string
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          accent: string
          badge_color: string | null
          created_at: string
          gradient: string
          icon: string
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          name_ar: string
          price_usd: number
          price_yearly_usd: number | null
          sort_order: number
          tagline: string | null
          tagline_ar: string | null
          updated_at: string
        }
        Insert: {
          accent?: string
          badge_color?: string | null
          created_at?: string
          gradient?: string
          icon?: string
          id: string
          is_active?: boolean
          is_public?: boolean
          name: string
          name_ar: string
          price_usd?: number
          price_yearly_usd?: number | null
          sort_order?: number
          tagline?: string | null
          tagline_ar?: string | null
          updated_at?: string
        }
        Update: {
          accent?: string
          badge_color?: string | null
          created_at?: string
          gradient?: string
          icon?: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          name_ar?: string
          price_usd?: number
          price_yearly_usd?: number | null
          sort_order?: number
          tagline?: string | null
          tagline_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      support_settings: {
        Row: {
          call_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          id: string
          sections: Json
          support_phone: string | null
          updated_at: string
          whatsapp_url: string | null
        }
        Insert: {
          call_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          sections?: Json
          support_phone?: string | null
          updated_at?: string
          whatsapp_url?: string | null
        }
        Update: {
          call_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: string
          sections?: Json
          support_phone?: string | null
          updated_at?: string
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          context: Json | null
          created_at: string
          id: string
          question: string
          resolution: string | null
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          question: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          context?: Json | null
          created_at?: string
          id?: string
          question?: string
          resolution?: string | null
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      system_broadcasts: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          title: string
          variant: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          title: string
          variant?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          title?: string
          variant?: string
        }
        Relationships: []
      }
      system_messages: {
        Row: {
          content: string
          created_at: string
          event_type: string
          id: string
          is_from_bot: boolean
          is_read: boolean
          metadata: Json | null
          severity: string
          title: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_type: string
          id?: string
          is_from_bot?: boolean
          is_read?: boolean
          metadata?: Json | null
          severity?: string
          title?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_type?: string
          id?: string
          is_from_bot?: boolean
          is_read?: boolean
          metadata?: Json | null
          severity?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      threat_flags: {
        Row: {
          auto_action: string | null
          created_at: string
          evidence: Json | null
          flag_type: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          severity: string
          status: string
          user_id: string
        }
        Insert: {
          auto_action?: string | null
          created_at?: string
          evidence?: Json | null
          flag_type: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          user_id: string
        }
        Update: {
          auto_action?: string | null
          created_at?: string
          evidence?: Json | null
          flag_type?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          severity?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          admin_id: string
          amount: number
          created_at: string | null
          id: string
          notes: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          admin_id: string
          amount: number
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          admin_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          notes?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      tweet_likes: {
        Row: {
          created_at: string
          id: string
          tweet_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tweet_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tweet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tweet_likes_tweet_id_fkey"
            columns: ["tweet_id"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
        ]
      }
      tweet_retweets: {
        Row: {
          created_at: string
          id: string
          tweet_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tweet_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tweet_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tweet_retweets_tweet_id_fkey"
            columns: ["tweet_id"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
        ]
      }
      tweets: {
        Row: {
          content: string
          created_at: string
          id: string
          is_public: boolean
          likes_count: number
          parent_id: string | null
          quote_tweet_id: string | null
          replies_count: number
          retweets_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_public?: boolean
          likes_count?: number
          parent_id?: string | null
          quote_tweet_id?: string | null
          replies_count?: number
          retweets_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_public?: boolean
          likes_count?: number
          parent_id?: string | null
          quote_tweet_id?: string | null
          replies_count?: number
          retweets_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tweets_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tweets_quote_tweet_id_fkey"
            columns: ["quote_tweet_id"]
            isOneToOne: false
            referencedRelation: "tweets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tweets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tweets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_finances: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          total_earnings: number | null
          total_withdrawn: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          total_earnings?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          total_earnings?: number | null
          total_withdrawn?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_finances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_finances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gems: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_settings: {
        Row: {
          allow_message_requests: boolean | null
          allow_messages_from_non_friends: boolean | null
          allow_story_replies: boolean | null
          auto_backup_enabled: boolean | null
          comments_enabled: boolean | null
          comments_notifications: boolean | null
          created_at: string
          follows_notifications: boolean | null
          id: string
          likes_enabled: boolean | null
          likes_notifications: boolean | null
          notifications_enabled: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_message_requests?: boolean | null
          allow_messages_from_non_friends?: boolean | null
          allow_story_replies?: boolean | null
          auto_backup_enabled?: boolean | null
          comments_enabled?: boolean | null
          comments_notifications?: boolean | null
          created_at?: string
          follows_notifications?: boolean | null
          id?: string
          likes_enabled?: boolean | null
          likes_notifications?: boolean | null
          notifications_enabled?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_message_requests?: boolean | null
          allow_messages_from_non_friends?: boolean | null
          allow_story_replies?: boolean | null
          auto_backup_enabled?: boolean | null
          comments_enabled?: boolean | null
          comments_notifications?: boolean | null
          created_at?: string
          follows_notifications?: boolean | null
          id?: string
          likes_enabled?: boolean | null
          likes_notifications?: boolean | null
          notifications_enabled?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          activated_by: string | null
          billing_cycle: string
          canceled_at: string | null
          created_at: string
          expires_at: string | null
          id: string
          payment_ref: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          plan_id: string
          r_coins: number
          renews_at: string | null
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_by?: string | null
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_ref?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_id?: string
          r_coins?: number
          renews_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_by?: string | null
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_ref?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          plan_id?: string
          r_coins?: number
          renews_at?: string | null
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          notes: string | null
          target_user_id: string
          verification_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          notes?: string | null
          target_user_id: string
          verification_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          target_user_id?: string
          verification_type?: string | null
        }
        Relationships: []
      }
      verification_requests: {
        Row: {
          account_type: string
          business_document_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          id_document_url: string | null
          reason: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          account_type?: string
          business_document_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          id_document_url?: string | null
          reason?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          account_type?: string
          business_document_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          id_document_url?: string | null
          reason?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      video_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "video_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_comments_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      video_likes: {
        Row: {
          created_at: string
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_likes_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string | null
          comments_count: number | null
          created_at: string
          description: string | null
          duration: number | null
          id: string
          is_published: boolean | null
          likes_count: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          video_url: string
          views_count: number | null
        }
        Insert: {
          category?: string | null
          comments_count?: number | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
          video_url: string
          views_count?: number | null
        }
        Update: {
          category?: string | null
          comments_count?: number | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          is_published?: boolean | null
          likes_count?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string
          views_count?: number | null
        }
        Relationships: []
      }
      wheel_settings: {
        Row: {
          default_prize: number
          guaranteed_win: boolean
          id: string
          is_active: boolean
          spins_per_day: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          default_prize?: number
          guaranteed_win?: boolean
          id?: string
          is_active?: boolean
          spins_per_day?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          default_prize?: number
          guaranteed_win?: boolean
          id?: string
          is_active?: boolean
          spins_per_day?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      wheel_spins: {
        Row: {
          created_at: string
          id: string
          points_won: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points_won?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points_won?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      broadcast_donations_public: {
        Row: {
          amount: number | null
          broadcast_id: string | null
          created_at: string | null
          creator_user_id: string | null
          donor_user_id: string | null
          id: string | null
          message: string | null
        }
        Insert: {
          amount?: number | null
          broadcast_id?: string | null
          created_at?: string | null
          creator_user_id?: string | null
          donor_user_id?: string | null
          id?: string | null
          message?: string | null
        }
        Update: {
          amount?: number | null
          broadcast_id?: string | null
          created_at?: string | null
          creator_user_id?: string | null
          donor_user_id?: string | null
          id?: string | null
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_donations_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_donations_creator_user_id_fkey"
            columns: ["creator_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_donations_donor_user_id_fkey"
            columns: ["donor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_donations_donor_user_id_fkey"
            columns: ["donor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type_enum"] | null
          affiliated_company_id: string | null
          avatar_url: string | null
          bio: string | null
          business_category: string | null
          business_description: string | null
          business_website: string | null
          cover_url: string | null
          created_at: string | null
          fame_score: number | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string | null
          is_business_account: boolean | null
          is_live: boolean | null
          is_verified: boolean | null
          profession: string | null
          school: string | null
          social_links: Json | null
          specialty: string | null
          updated_at: string | null
          username: string | null
          verification_type: string | null
          website: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type_enum"] | null
          affiliated_company_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_category?: string | null
          business_description?: string | null
          business_website?: string | null
          cover_url?: string | null
          created_at?: string | null
          fame_score?: number | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string | null
          is_business_account?: boolean | null
          is_live?: boolean | null
          is_verified?: boolean | null
          profession?: string | null
          school?: string | null
          social_links?: Json | null
          specialty?: string | null
          updated_at?: string | null
          username?: string | null
          verification_type?: string | null
          website?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type_enum"] | null
          affiliated_company_id?: string | null
          avatar_url?: string | null
          bio?: string | null
          business_category?: string | null
          business_description?: string | null
          business_website?: string | null
          cover_url?: string | null
          created_at?: string | null
          fame_score?: number | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string | null
          is_business_account?: boolean | null
          is_live?: boolean | null
          is_verified?: boolean | null
          profession?: string | null
          school?: string | null
          social_links?: Json | null
          specialty?: string | null
          updated_at?: string | null
          username?: string | null
          verification_type?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_affiliated_company_id_fkey"
            columns: ["affiliated_company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _compute_vip_tier: { Args: { _spend: number }; Returns: string }
      admin_get_profile_pii: {
        Args: { _user_id: string }
        Returns: {
          account_type: Database["public"]["Enums"]["account_type_enum"] | null
          affiliated_company_id: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          business_category: string | null
          business_description: string | null
          business_email: string | null
          business_hours: Json | null
          business_website: string | null
          cover_url: string | null
          created_at: string
          fame_score: number | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          gender: string | null
          id: string
          is_banned: boolean
          is_business_account: boolean | null
          is_live: boolean
          is_suspended: boolean
          is_verified: boolean | null
          location: string | null
          phone_country_code: string | null
          phone_number: string | null
          profession: string | null
          school: string | null
          social_links: Json | null
          specialty: string | null
          updated_at: string
          username: string | null
          verification_type: string | null
          website: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_list_users: {
        Args: { _limit?: number; _offset?: number; _search?: string }
        Returns: {
          account_type: string
          avatar_url: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_banned: boolean
          is_suspended: boolean
          is_verified: boolean
          phone_number: string
          role: string
          total_count: number
          username: string
          verification_type: string
        }[]
      }
      admin_set_subscription: {
        Args: {
          _billing_cycle?: string
          _months?: number
          _payment_ref?: string
          _plan_id: string
          _user_id: string
        }
        Returns: Json
      }
      calculate_fame_score: { Args: { user_id: string }; Returns: number }
      can_add_participant_to_conversation: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      expire_subscriptions: { Args: never; Returns: number }
      get_effective_plan: { Args: { _user_id: string }; Returns: string }
      get_my_phone: {
        Args: never
        Returns: {
          phone_country_code: string
          phone_number: string
        }[]
      }
      get_own_profile: {
        Args: never
        Returns: {
          account_type: Database["public"]["Enums"]["account_type_enum"] | null
          affiliated_company_id: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          business_category: string | null
          business_description: string | null
          business_email: string | null
          business_hours: Json | null
          business_website: string | null
          cover_url: string | null
          created_at: string
          fame_score: number | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          gender: string | null
          id: string
          is_banned: boolean
          is_business_account: boolean | null
          is_live: boolean
          is_suspended: boolean
          is_verified: boolean | null
          location: string | null
          phone_country_code: string | null
          phone_number: string | null
          profession: string | null
          school: string | null
          social_links: Json | null
          specialty: string | null
          updated_at: string
          username: string | null
          verification_type: string | null
          website: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_conversation_ids: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      has_feature: {
        Args: { _feature_key: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      live_approve_guest: {
        Args: { _slot_index: number; _stream_id: string }
        Returns: Json
      }
      live_ban_user: {
        Args: { _reason?: string; _stream_id: string; _user_id: string }
        Returns: Json
      }
      live_grant_moderator: {
        Args: { _stream_id: string; _user_id: string }
        Returns: Json
      }
      live_increment_mission: {
        Args: { _amount?: number; _requirement_type: string; _user_id: string }
        Returns: undefined
      }
      live_kick_guest: {
        Args: { _slot_index: number; _stream_id: string }
        Returns: Json
      }
      live_request_guest_seat: { Args: { _stream_id: string }; Returns: Json }
      live_revoke_moderator: {
        Args: { _stream_id: string; _user_id: string }
        Returns: Json
      }
      live_tap_like: {
        Args: { _amount?: number; _stream_id: string }
        Returns: undefined
      }
      live_toggle_mute_guest: {
        Args: { _slot_index: number; _stream_id: string }
        Returns: Json
      }
      live_top_supporters: {
        Args: { _limit?: number; _stream_id: string }
        Returns: {
          avatar_url: string
          gifts_count: number
          total_coins: number
          user_id: string
          username: string
        }[]
      }
      live_unban_user: {
        Args: { _stream_id: string; _user_id: string }
        Returns: Json
      }
      my_entitlements: {
        Args: never
        Returns: {
          accent: string
          badge_color: string
          expires_at: string
          feature_key: string
          limit_value: number
          plan_id: string
          plan_name: string
          plan_name_ar: string
          status: string
        }[]
      }
      owner_cancel_invite: { Args: { _request_id: string }; Returns: Json }
      owner_invite_affiliate: {
        Args: { _company_id: string; _username: string }
        Returns: Json
      }
      owner_list_affiliates: {
        Args: { _company_id: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          is_verified: boolean
          username: string
        }[]
      }
      owner_list_pending_invites: {
        Args: { _company_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          request_id: string
          user_id: string
          username: string
        }[]
      }
      owner_set_affiliate: {
        Args: { _attach: boolean; _company_id: string; _username: string }
        Returns: Json
      }
      redeem_family_code: { Args: { _code: string }; Returns: Json }
      refresh_profile_live_status: {
        Args: { _host_id: string }
        Returns: undefined
      }
      send_live_gift: {
        Args: { _gift_id: string; _quantity?: number; _stream_id: string }
        Returns: Json
      }
      send_tip: {
        Args: {
          receiver_id: string
          sender_id: string
          tip_amount: number
          tip_message?: string
        }
        Returns: Json
      }
      send_tip_v2: {
        Args: {
          currency_type?: string
          receiver_id: string
          sender_id: string
          tip_amount: number
          tip_message?: string
        }
        Returns: Json
      }
      update_all_fame_scores: { Args: never; Returns: undefined }
      user_list_my_invites: {
        Args: never
        Returns: {
          company_id: string
          company_logo: string
          company_name: string
          created_at: string
          request_id: string
        }[]
      }
      user_respond_affiliation: {
        Args: { _accept: boolean; _request_id: string }
        Returns: Json
      }
    }
    Enums: {
      account_type_enum: "creator" | "personal" | "business" | "government"
      app_role: "admin" | "moderator" | "user"
      subscription_plan: "free" | "plus" | "creator" | "business" | "government"
      subscription_status: "active" | "pending" | "canceled" | "expired"
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
      account_type_enum: ["creator", "personal", "business", "government"],
      app_role: ["admin", "moderator", "user"],
      subscription_plan: ["free", "plus", "creator", "business", "government"],
      subscription_status: ["active", "pending", "canceled", "expired"],
    },
  },
} as const

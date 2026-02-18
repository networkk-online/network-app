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
            foreignKeyName: "broadcast_donations_donor_user_id_fkey"
            columns: ["donor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_history: {
        Row: {
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
            foreignKeyName: "donation_replies_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "broadcast_donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donation_replies_donor_user_id_fkey"
            columns: ["donor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
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
        ]
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
          is_business_account: boolean | null
          is_verified: boolean | null
          location: string | null
          phone_country_code: string | null
          phone_number: string | null
          profession: string | null
          school: string | null
          social_links: Json | null
          updated_at: string
          username: string | null
          website: string | null
        }
        Insert: {
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
          is_business_account?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          phone_country_code?: string | null
          phone_number?: string | null
          profession?: string | null
          school?: string | null
          social_links?: Json | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Update: {
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
          is_business_account?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          phone_country_code?: string | null
          phone_number?: string | null
          profession?: string | null
          school?: string | null
          social_links?: Json | null
          updated_at?: string
          username?: string | null
          website?: string | null
        }
        Relationships: []
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
        ]
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
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      user_settings: {
        Row: {
          allow_messages_from_non_friends: boolean | null
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
          allow_messages_from_non_friends?: boolean | null
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
          allow_messages_from_non_friends?: boolean | null
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
      verification_requests: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_fame_score: { Args: { user_id: string }; Returns: number }
      can_add_participant_to_conversation: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: boolean
      }
      get_user_conversation_ids: {
        Args: { p_user_id: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_all_fame_scores: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const

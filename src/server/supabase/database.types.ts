export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Enums: {
      allocation_audit_action:
        | "initial_draw"
        | "rerun"
        | "manual_move";
      badge_status: "active" | "undecided" | "manual_future";
      board_variant: "official" | "alternative";
      leaderboard_snapshot_trigger:
        | "initial_baseline"
        | "completed_match_change"
        | "manual_recalculation";
      match_status:
        | "scheduled"
        | "delayed"
        | "live"
        | "final"
        | "postponed"
        | "cancelled";
      shared_view_mode: "participant_board" | "countdown";
      sweepstake_status: "draft" | "shared" | "archived";
      sync_run_status: "started" | "succeeded" | "failed";
    };
    Tables: {
      allocation_audit_events: {
        Row: {
          id: string;
          sweepstake_id: string;
          action: Database["public"]["Enums"]["allocation_audit_action"];
          actor_user_id: string | null;
          note: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          sweepstake_id: string;
          action: Database["public"]["Enums"]["allocation_audit_action"];
          actor_user_id?: string | null;
          note: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["allocation_audit_events"]["Insert"]>;
      };
      ai_generations: {
        Row: {
          id: string;
          sweepstake_id: string;
          feature_key: string;
          input_hash: string;
          source_updated_at: string | null;
          model: string;
          output_text: string;
          generation_status: "generating" | "ready" | "invalid";
          generation_reason: string;
          rewritten_by: string | null;
          lease_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sweepstake_id: string;
          feature_key: string;
          input_hash: string;
          source_updated_at?: string | null;
          model: string;
          output_text: string;
          generation_status?: "generating" | "ready" | "invalid";
          generation_reason?: string;
          rewritten_by?: string | null;
          lease_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ai_generations"]["Insert"]>;
      };
      badge_categories: {
        Row: {
          id: string;
          sweepstake_id: string;
          key: string;
          label: string;
          status: Database["public"]["Enums"]["badge_status"];
          sort_order: number;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sweepstake_id: string;
          key: string;
          label: string;
          status?: Database["public"]["Enums"]["badge_status"];
          sort_order?: number;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["badge_categories"]["Insert"]>;
      };
      badge_holders: {
        Row: {
          id: string;
          sweepstake_id: string;
          badge_category_id: string;
          participant_id: string | null;
          team_id: string | null;
          reason: string | null;
          source_updated_at: string | null;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          sweepstake_id: string;
          badge_category_id: string;
          participant_id?: string | null;
          team_id?: string | null;
          reason?: string | null;
          source_updated_at?: string | null;
          calculated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["badge_holders"]["Insert"]>;
      };
      leaderboard_snapshots: {
        Row: {
          id: string;
          sweepstake_id: string;
          tournament_code: string;
          sync_run_id: string | null;
          trigger_type: Database["public"]["Enums"]["leaderboard_snapshot_trigger"];
          snapshot_key: string;
          completed_match_count: number;
          latest_completed_match_id: string | null;
          changed_match_ids: string[];
          match_transition_summary: Json;
          source_updated_at: string | null;
          snapshot_reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          sweepstake_id: string;
          tournament_code: string;
          sync_run_id?: string | null;
          trigger_type: Database["public"]["Enums"]["leaderboard_snapshot_trigger"];
          snapshot_key: string;
          completed_match_count?: number;
          latest_completed_match_id?: string | null;
          changed_match_ids?: string[];
          match_transition_summary?: Json;
          source_updated_at?: string | null;
          snapshot_reason: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leaderboard_snapshots"]["Insert"]>;
      };
      leaderboard_snapshot_rows: {
        Row: {
          id: string;
          snapshot_id: string;
          participant_id: string;
          participant_name: string;
          official_rank: number;
          official_points: number;
          official_team_count: number;
          official_team_ids: string[];
          alternative_rank: number;
          alternative_score: number;
          alternative_total_points: number;
          alternative_team_count: number;
          alternative_team_ids: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          snapshot_id: string;
          participant_id: string;
          participant_name: string;
          official_rank: number;
          official_points: number;
          official_team_count: number;
          official_team_ids?: string[];
          alternative_rank: number;
          alternative_score: number;
          alternative_total_points: number;
          alternative_team_count: number;
          alternative_team_ids?: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["leaderboard_snapshot_rows"]["Insert"]>;
      };
      participants: {
        Row: {
          id: string;
          sweepstake_id: string;
          display_name: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sweepstake_id: string;
          display_name: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["participants"]["Insert"]>;
      };
      participant_emails: {
        Row: {
          participant_id: string;
          email: string;
          verified_at: string | null;
          update_opt_in: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          participant_id: string;
          email: string;
          verified_at?: string | null;
          update_opt_in?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["participant_emails"]["Insert"]>;
      };
      participant_scores: {
        Row: {
          id: string;
          sweepstake_id: string;
          participant_id: string;
          points: number;
          rank: number | null;
          team_count: number;
          source_updated_at: string | null;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          sweepstake_id: string;
          participant_id: string;
          points?: number;
          rank?: number | null;
          team_count?: number;
          source_updated_at?: string | null;
          calculated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["participant_scores"]["Insert"]>;
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      sweepstake_admins: {
        Row: {
          id: string;
          sweepstake_id: string;
          user_id: string | null;
          role: "owner" | "admin";
          invited_email: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sweepstake_id: string;
          user_id?: string | null;
          role?: "owner" | "admin";
          invited_email?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sweepstake_admins"]["Insert"]>;
      };
      sweepstakes: {
        Row: {
          id: string;
          name: string;
          tournament_code: string;
          status: Database["public"]["Enums"]["sweepstake_status"];
          shared_view_mode: Database["public"]["Enums"]["shared_view_mode"];
          board_variant: Database["public"]["Enums"]["board_variant"];
          share_token: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          tournament_code?: string;
          status?: Database["public"]["Enums"]["sweepstake_status"];
          shared_view_mode?: Database["public"]["Enums"]["shared_view_mode"];
          board_variant?: Database["public"]["Enums"]["board_variant"];
          share_token?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sweepstakes"]["Insert"]>;
      };
      team_allocations: {
        Row: {
          id: string;
          sweepstake_id: string;
          participant_id: string;
          team_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sweepstake_id: string;
          participant_id: string;
          team_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_allocations"]["Insert"]>;
      };
      team_scores: {
        Row: {
          id: string;
          sweepstake_id: string;
          team_id: string;
          points: number;
          scoring_breakdown: Json;
          source_updated_at: string | null;
          calculated_at: string;
        };
        Insert: {
          id?: string;
          sweepstake_id: string;
          team_id: string;
          points?: number;
          scoring_breakdown?: Json;
          source_updated_at?: string | null;
          calculated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_scores"]["Insert"]>;
      };
      matches: {
        Row: {
          id: string;
          external_id: string | null;
          tournament_code: string;
          stage: string;
          status: Database["public"]["Enums"]["match_status"];
          home_team_id: string | null;
          away_team_id: string | null;
          home_score: number | null;
          away_score: number | null;
          kickoff_at: string | null;
          data_freshness: string;
          raw_payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          tournament_code?: string;
          stage: string;
          status?: Database["public"]["Enums"]["match_status"];
          home_team_id?: string | null;
          away_team_id?: string | null;
          home_score?: number | null;
          away_score?: number | null;
          kickoff_at?: string | null;
          data_freshness?: string;
          raw_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
      };
      team_match_stats: {
        Row: {
          id: string;
          match_id: string;
          team_id: string;
          goals_for: number;
          goals_against: number;
          cards: number | null;
          raw_payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          team_id: string;
          goals_for?: number;
          goals_against?: number;
          cards?: number | null;
          raw_payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_match_stats"]["Insert"]>;
      };
      teams: {
        Row: {
          id: string;
          external_id: string | null;
          tournament_code: string;
          name: string;
          short_name: string | null;
          group_name: string | null;
          flag_source_url: string | null;
          flag_asset_path: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_id?: string | null;
          tournament_code?: string;
          name: string;
          short_name?: string | null;
          group_name?: string | null;
          flag_source_url?: string | null;
          flag_asset_path?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
      };
      football_data_sync_runs: {
        Row: {
          id: string;
          status: Database["public"]["Enums"]["sync_run_status"];
          endpoint: string;
          started_at: string;
          finished_at: string | null;
          records_changed: number;
          error_message: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          status?: Database["public"]["Enums"]["sync_run_status"];
          endpoint: string;
          started_at?: string;
          finished_at?: string | null;
          records_changed?: number;
          error_message?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["football_data_sync_runs"]["Insert"]>;
      };
      football_data_sync_state: {
        Row: {
          key: string;
          last_successful_sync_at: string | null;
          last_run_id: string | null;
          metadata: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          last_successful_sync_at?: string | null;
          last_run_id?: string | null;
          metadata?: Json;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["football_data_sync_state"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_ai_generation: {
        Args: {
          target_sweepstake_id: string;
          target_feature_key: string;
          target_input_hash: string;
          target_source_updated_at: string | null;
          target_model: string;
          target_reason: string;
          target_rewritten_by?: string | null;
          force_rewrite?: boolean;
        };
        Returns: Array<{
          generation_id: string;
          claimed: boolean;
          previous_output_text: string;
          created_at: string;
          updated_at: string;
          model: string;
        }>;
      };
      get_sweepstake_by_share_token: {
        Args: { target_share_token: string };
        Returns: {
          id: string;
          name: string;
          tournament_code: string;
          status: Database["public"]["Enums"]["sweepstake_status"];
          shared_view_mode: Database["public"]["Enums"]["shared_view_mode"];
          board_variant: Database["public"]["Enums"]["board_variant"];
          created_at: string;
          updated_at: string;
        }[];
      };
      is_sweepstake_admin: {
        Args: { target_sweepstake_id: string };
        Returns: boolean;
      };
    };
  };
};

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
      allocation_audit_action: "initial_draw" | "rerun" | "manual_move";
      badge_status: "active" | "undecided" | "manual_future";
      match_status:
        | "scheduled"
        | "delayed"
        | "live"
        | "final"
        | "postponed"
        | "cancelled";
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
      get_sweepstake_by_share_token: {
        Args: { target_share_token: string };
        Returns: {
          id: string;
          name: string;
          tournament_code: string;
          status: Database["public"]["Enums"]["sweepstake_status"];
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

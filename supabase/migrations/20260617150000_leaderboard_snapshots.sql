do $$
begin
  create type public.leaderboard_snapshot_trigger as enum (
    'initial_baseline',
    'completed_match_change',
    'manual_recalculation'
  );
exception
  when duplicate_object then null;
end $$;

create table public.leaderboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  tournament_code text not null,
  sync_run_id uuid references public.football_data_sync_runs(id) on delete set null,
  trigger_type public.leaderboard_snapshot_trigger not null,
  snapshot_key text not null,
  completed_match_count integer not null default 0,
  latest_completed_match_id uuid references public.matches(id) on delete set null,
  changed_match_ids uuid[] not null default '{}',
  match_transition_summary jsonb not null default '[]'::jsonb,
  source_updated_at timestamptz,
  snapshot_reason text not null,
  created_at timestamptz not null default now(),
  unique (sweepstake_id, snapshot_key)
);

create table public.leaderboard_snapshot_rows (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references public.leaderboard_snapshots(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  participant_name text not null,
  official_rank integer not null,
  official_points integer not null,
  official_team_count integer not null,
  official_team_ids uuid[] not null default '{}',
  alternative_rank integer not null,
  alternative_score numeric(12,4) not null,
  alternative_total_points integer not null,
  alternative_team_count integer not null,
  alternative_team_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (snapshot_id, participant_id)
);

create unique index leaderboard_snapshots_initial_baseline_unique_idx
on public.leaderboard_snapshots (sweepstake_id)
where trigger_type = 'initial_baseline';

create index leaderboard_snapshots_sweepstake_created_idx
on public.leaderboard_snapshots (sweepstake_id, created_at desc);

create index leaderboard_snapshots_sync_run_idx
on public.leaderboard_snapshots (sync_run_id);

create index leaderboard_snapshot_rows_snapshot_rank_idx
on public.leaderboard_snapshot_rows (snapshot_id, official_rank, alternative_rank);

alter table public.leaderboard_snapshots enable row level security;
alter table public.leaderboard_snapshot_rows enable row level security;

create policy "leaderboard snapshots admin read"
on public.leaderboard_snapshots
for select
using (public.is_sweepstake_admin(sweepstake_id));

create policy "leaderboard snapshot rows admin read"
on public.leaderboard_snapshot_rows
for select
using (
  exists (
    select 1
    from public.leaderboard_snapshots snapshot
    where snapshot.id = snapshot_id
      and public.is_sweepstake_admin(snapshot.sweepstake_id)
  )
);

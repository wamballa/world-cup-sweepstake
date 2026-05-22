create extension if not exists pgcrypto;

create type public.sweepstake_status as enum ('draft', 'shared', 'archived');
create type public.allocation_audit_action as enum ('initial_draw', 'rerun', 'manual_move');
create type public.match_status as enum ('scheduled', 'delayed', 'live', 'final', 'postponed', 'cancelled');
create type public.badge_status as enum ('active', 'undecided', 'manual_future');
create type public.sync_run_status as enum ('started', 'succeeded', 'failed');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sweepstakes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 120),
  tournament_code text not null default 'WC_2026',
  status public.sweepstake_status not null default 'draft',
  share_token text not null unique default encode(gen_random_bytes(24), 'base64url'),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sweepstake_admins (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null default 'admin' check (role in ('owner', 'admin')),
  invited_email text,
  created_at timestamptz not null default now()
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sweepstake_id, display_name)
);

create table public.participant_emails (
  participant_id uuid primary key references public.participants(id) on delete cascade,
  email text not null check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  verified_at timestamptz,
  update_opt_in boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.badge_categories (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  key text not null,
  label text not null,
  status public.badge_status not null default 'active',
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sweepstake_id, key)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  tournament_code text not null default 'WC_2026',
  name text not null,
  short_name text,
  group_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tournament_code, name)
);

create table public.team_allocations (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sweepstake_id, team_id)
);

create table public.allocation_audit_events (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  action public.allocation_audit_action not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  note text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  tournament_code text not null default 'WC_2026',
  stage text not null,
  status public.match_status not null default 'scheduled',
  home_team_id uuid references public.teams(id) on delete restrict,
  away_team_id uuid references public.teams(id) on delete restrict,
  home_score integer,
  away_score integer,
  kickoff_at timestamptz,
  data_freshness text not null default 'scheduled',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_match_stats (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  goals_for integer not null default 0,
  goals_against integer not null default 0,
  cards integer,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, team_id)
);

create table public.team_scores (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  points integer not null default 0,
  scoring_breakdown jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz,
  calculated_at timestamptz not null default now(),
  unique (sweepstake_id, team_id)
);

create table public.participant_scores (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  points integer not null default 0,
  rank integer,
  team_count integer not null default 0,
  source_updated_at timestamptz,
  calculated_at timestamptz not null default now(),
  unique (sweepstake_id, participant_id)
);

create table public.badge_holders (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  badge_category_id uuid not null references public.badge_categories(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  reason text,
  source_updated_at timestamptz,
  calculated_at timestamptz not null default now()
);

create table public.football_data_sync_runs (
  id uuid primary key default gen_random_uuid(),
  status public.sync_run_status not null default 'started',
  endpoint text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_changed integer not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb
);

create table public.football_data_sync_state (
  key text primary key,
  last_successful_sync_at timestamptz,
  last_run_id uuid references public.football_data_sync_runs(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.ai_generations (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  feature_key text not null,
  input_hash text not null,
  source_updated_at timestamptz,
  model text not null,
  output_text text not null,
  created_at timestamptz not null default now()
);

create table public.email_update_logs (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete set null,
  email text not null,
  update_type text not null,
  provider_message_id text,
  status text not null,
  error_message text,
  created_at timestamptz not null default now()
);

create index sweepstakes_share_token_idx on public.sweepstakes(share_token);
create unique index sweepstake_admins_unique_user_idx on public.sweepstake_admins(sweepstake_id, user_id) where user_id is not null;
create unique index sweepstake_admins_unique_invite_idx on public.sweepstake_admins(sweepstake_id, lower(invited_email)) where invited_email is not null;
create index participants_sweepstake_id_idx on public.participants(sweepstake_id);
create index team_allocations_sweepstake_id_idx on public.team_allocations(sweepstake_id);
create index team_allocations_participant_id_idx on public.team_allocations(participant_id);
create index participant_scores_sweepstake_rank_idx on public.participant_scores(sweepstake_id, rank);
create index badge_holders_sweepstake_id_idx on public.badge_holders(sweepstake_id);
create index matches_tournament_status_idx on public.matches(tournament_code, status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger sweepstakes_set_updated_at before update on public.sweepstakes for each row execute function public.set_updated_at();
create trigger participants_set_updated_at before update on public.participants for each row execute function public.set_updated_at();
create trigger participant_emails_set_updated_at before update on public.participant_emails for each row execute function public.set_updated_at();
create trigger badge_categories_set_updated_at before update on public.badge_categories for each row execute function public.set_updated_at();
create trigger teams_set_updated_at before update on public.teams for each row execute function public.set_updated_at();
create trigger team_allocations_set_updated_at before update on public.team_allocations for each row execute function public.set_updated_at();
create trigger matches_set_updated_at before update on public.matches for each row execute function public.set_updated_at();
create trigger team_match_stats_set_updated_at before update on public.team_match_stats for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_sweepstake_admin(target_sweepstake_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.sweepstake_admins admin
    where admin.sweepstake_id = target_sweepstake_id
      and admin.user_id = auth.uid()
  );
$$;

create or replace function public.get_sweepstake_by_share_token(target_share_token text)
returns table (
  id uuid,
  name text,
  tournament_code text,
  status public.sweepstake_status,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.name, s.tournament_code, s.status, s.created_at, s.updated_at
  from public.sweepstakes s
  where s.share_token = target_share_token
    and s.status = 'shared';
$$;

alter table public.profiles enable row level security;
alter table public.sweepstakes enable row level security;
alter table public.sweepstake_admins enable row level security;
alter table public.participants enable row level security;
alter table public.participant_emails enable row level security;
alter table public.badge_categories enable row level security;
alter table public.teams enable row level security;
alter table public.team_allocations enable row level security;
alter table public.allocation_audit_events enable row level security;
alter table public.matches enable row level security;
alter table public.team_match_stats enable row level security;
alter table public.team_scores enable row level security;
alter table public.participant_scores enable row level security;
alter table public.badge_holders enable row level security;
alter table public.football_data_sync_runs enable row level security;
alter table public.football_data_sync_state enable row level security;
alter table public.ai_generations enable row level security;
alter table public.email_update_logs enable row level security;

create policy "profiles read self" on public.profiles for select using (id = auth.uid());
create policy "profiles update self" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "sweepstakes admin read" on public.sweepstakes for select using (public.is_sweepstake_admin(id));
create policy "sweepstakes authenticated create" on public.sweepstakes for insert to authenticated with check (created_by = auth.uid());
create policy "sweepstakes admin update" on public.sweepstakes for update using (public.is_sweepstake_admin(id)) with check (public.is_sweepstake_admin(id));

create policy "sweepstake admins read" on public.sweepstake_admins for select using (public.is_sweepstake_admin(sweepstake_id));
create policy "sweepstake admins create self or admin" on public.sweepstake_admins for insert to authenticated with check (user_id = auth.uid() or public.is_sweepstake_admin(sweepstake_id));
create policy "sweepstake admins update admin" on public.sweepstake_admins for update using (public.is_sweepstake_admin(sweepstake_id)) with check (public.is_sweepstake_admin(sweepstake_id));
create policy "sweepstake admins delete admin" on public.sweepstake_admins for delete using (public.is_sweepstake_admin(sweepstake_id));

create policy "participants admin read" on public.participants for select using (public.is_sweepstake_admin(sweepstake_id));
create policy "participants admin write" on public.participants for all using (public.is_sweepstake_admin(sweepstake_id)) with check (public.is_sweepstake_admin(sweepstake_id));

create policy "participant emails admin only" on public.participant_emails for all using (
  exists (
    select 1 from public.participants p
    where p.id = participant_id and public.is_sweepstake_admin(p.sweepstake_id)
  )
) with check (
  exists (
    select 1 from public.participants p
    where p.id = participant_id and public.is_sweepstake_admin(p.sweepstake_id)
  )
);

create policy "badge categories admin read" on public.badge_categories for select using (public.is_sweepstake_admin(sweepstake_id));
create policy "badge categories admin write" on public.badge_categories for all using (public.is_sweepstake_admin(sweepstake_id)) with check (public.is_sweepstake_admin(sweepstake_id));

create policy "teams authenticated read" on public.teams for select to authenticated using (true);
create policy "matches authenticated read" on public.matches for select to authenticated using (true);
create policy "team match stats authenticated read" on public.team_match_stats for select to authenticated using (true);

create policy "team allocations admin read" on public.team_allocations for select using (public.is_sweepstake_admin(sweepstake_id));
create policy "team allocations admin write" on public.team_allocations for all using (public.is_sweepstake_admin(sweepstake_id)) with check (public.is_sweepstake_admin(sweepstake_id));

create policy "allocation audit admin read" on public.allocation_audit_events for select using (public.is_sweepstake_admin(sweepstake_id));
create policy "allocation audit admin insert" on public.allocation_audit_events for insert to authenticated with check (public.is_sweepstake_admin(sweepstake_id));

create policy "team scores admin read" on public.team_scores for select using (public.is_sweepstake_admin(sweepstake_id));
create policy "participant scores admin read" on public.participant_scores for select using (public.is_sweepstake_admin(sweepstake_id));
create policy "badge holders admin read" on public.badge_holders for select using (public.is_sweepstake_admin(sweepstake_id));

create policy "ai generations admin read" on public.ai_generations for select using (public.is_sweepstake_admin(sweepstake_id));
create policy "email logs admin read" on public.email_update_logs for select using (public.is_sweepstake_admin(sweepstake_id));

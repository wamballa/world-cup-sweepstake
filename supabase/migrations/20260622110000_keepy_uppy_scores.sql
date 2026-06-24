create table if not exists public.keepy_uppy_scores (
  id uuid primary key default gen_random_uuid(),
  sweepstake_id uuid not null references public.sweepstakes(id) on delete cascade,
  player_name text not null check (char_length(trim(player_name)) between 1 and 40),
  score integer not null check (score between 1 and 999),
  created_at timestamptz not null default now()
);

create index if not exists keepy_uppy_scores_top_scores_idx
  on public.keepy_uppy_scores(sweepstake_id, score desc, created_at asc);

alter table public.keepy_uppy_scores enable row level security;

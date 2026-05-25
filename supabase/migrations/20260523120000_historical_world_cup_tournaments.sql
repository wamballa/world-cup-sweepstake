alter table public.teams drop constraint if exists teams_external_id_key;
alter table public.matches drop constraint if exists matches_external_id_key;

create unique index if not exists teams_tournament_external_id_idx
  on public.teams(tournament_code, external_id);

create unique index if not exists matches_tournament_external_id_idx
  on public.matches(tournament_code, external_id);

do $$
begin
  create type public.shared_view_mode as enum ('participant_board', 'countdown');
exception
  when duplicate_object then null;
end $$;

alter table public.sweepstakes
  add column if not exists shared_view_mode public.shared_view_mode not null default 'participant_board';

drop function if exists public.get_sweepstake_by_share_token(text);

create or replace function public.get_sweepstake_by_share_token(target_share_token text)
returns table (
  id uuid,
  name text,
  tournament_code text,
  status public.sweepstake_status,
  shared_view_mode public.shared_view_mode,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    s.name,
    s.tournament_code,
    s.status,
    s.shared_view_mode,
    s.created_at,
    s.updated_at
  from public.sweepstakes s
  where s.share_token = target_share_token
    and s.status = 'shared';
$$;

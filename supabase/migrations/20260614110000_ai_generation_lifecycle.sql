alter table public.ai_generations
  add column if not exists generation_status text not null default 'ready',
  add column if not exists generation_reason text not null default 'automatic',
  add column if not exists rewritten_by uuid references auth.users(id) on delete set null,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

alter table public.ai_generations
  drop constraint if exists ai_generations_generation_status_check;

alter table public.ai_generations
  add constraint ai_generations_generation_status_check
  check (generation_status in ('generating', 'ready', 'invalid'));

create or replace function public.claim_ai_generation(
  target_sweepstake_id uuid,
  target_feature_key text,
  target_input_hash text,
  target_source_updated_at timestamptz,
  target_model text,
  target_reason text,
  target_rewritten_by uuid default null,
  force_rewrite boolean default false
)
returns table (
  generation_id uuid,
  claimed boolean,
  previous_output_text text,
  created_at timestamptz,
  updated_at timestamptz,
  model text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_row public.ai_generations%rowtype;
begin
  if force_rewrite then
    update public.ai_generations
    set
      generation_status = 'generating',
      lease_expires_at = now() + interval '2 minutes',
      source_updated_at = target_source_updated_at,
      model = target_model,
      updated_at = now()
    where sweepstake_id = target_sweepstake_id
      and feature_key = target_feature_key
      and input_hash = target_input_hash
      and (
        generation_status = 'ready'
        or lease_expires_at is null
        or lease_expires_at < now()
      )
    returning * into claimed_row;

    if claimed_row.id is null then
      insert into public.ai_generations (
        sweepstake_id,
        feature_key,
        input_hash,
        source_updated_at,
        model,
        output_text,
        generation_status,
        generation_reason,
        rewritten_by,
        lease_expires_at,
        updated_at
      )
      values (
        target_sweepstake_id,
        target_feature_key,
        target_input_hash,
        target_source_updated_at,
        target_model,
        '',
        'generating',
        target_reason,
        target_rewritten_by,
        now() + interval '2 minutes',
        now()
      )
      on conflict (sweepstake_id, feature_key, input_hash) do nothing
      returning * into claimed_row;
    end if;
  else
    insert into public.ai_generations (
      sweepstake_id,
      feature_key,
      input_hash,
      source_updated_at,
      model,
      output_text,
      generation_status,
      generation_reason,
      lease_expires_at,
      updated_at
    )
    values (
      target_sweepstake_id,
      target_feature_key,
      target_input_hash,
      target_source_updated_at,
      target_model,
      '',
      'generating',
      target_reason,
      now() + interval '2 minutes',
      now()
    )
    on conflict (sweepstake_id, feature_key, input_hash) do nothing
    returning * into claimed_row;

    if claimed_row.id is null then
      update public.ai_generations
      set
        generation_status = 'generating',
        lease_expires_at = now() + interval '2 minutes',
        source_updated_at = target_source_updated_at,
        model = target_model,
        updated_at = now()
      where sweepstake_id = target_sweepstake_id
        and feature_key = target_feature_key
        and input_hash = target_input_hash
        and generation_status = 'generating'
        and lease_expires_at < now()
      returning * into claimed_row;
    end if;
  end if;

  if claimed_row.id is not null then
    return query
      select
        claimed_row.id,
        true,
        claimed_row.output_text,
        claimed_row.created_at,
        claimed_row.updated_at,
        claimed_row.model;
    return;
  end if;

  return query
    select
      generation.id,
      false,
      generation.output_text,
      generation.created_at,
      generation.updated_at,
      generation.model
    from public.ai_generations as generation
    where generation.sweepstake_id = target_sweepstake_id
      and generation.feature_key = target_feature_key
      and generation.input_hash = target_input_hash
    limit 1;
end;
$$;

revoke all on function public.claim_ai_generation(
  uuid,
  text,
  text,
  timestamptz,
  text,
  text,
  uuid,
  boolean
) from public, anon, authenticated;

grant execute on function public.claim_ai_generation(
  uuid,
  text,
  text,
  timestamptz,
  text,
  text,
  uuid,
  boolean
) to service_role;

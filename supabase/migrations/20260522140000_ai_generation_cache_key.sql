create unique index if not exists ai_generations_sweepstake_feature_hash_idx
  on public.ai_generations(sweepstake_id, feature_key, input_hash);

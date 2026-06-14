create unique index ai_generations_claim_unique_idx
  on public.ai_generations(sweepstake_id, feature_key, input_hash);

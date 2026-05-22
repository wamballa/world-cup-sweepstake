alter table public.sweepstakes
  alter column share_token set default rtrim(
    replace(replace(encode(gen_random_bytes(24), 'base64'), '+', '-'), '/', '_'),
    '='
  );

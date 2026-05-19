# AI Experience

## MVP AI Placement

AI is included in MVP. Start with cached sweepstake updates summarizing recent matches, leaderboard movement, and badge changes.

## Later AI Features

- Match summaries.
- Leaderboard banter.
- Daily briefing.
- Explain team points.
- Badge race summaries.
- Email update drafting.

## Allowed Data

AI may use:

- Cached fixtures.
- Cached scores and statuses.
- Cached team stats.
- Team allocations.
- Participant leaderboard.
- Badge holders.
- Stored scoring rules.
- Data freshness timestamps.

AI may not use unapproved external football knowledge.

## Hard Limits

- Do not invent football facts, scores, lineups, injuries, form, or statistics.
- Do not claim certainty about future outcomes.
- Do not provide gambling-style advice.
- Do not invent badge holders before calculations support them.
- Do not imply live data if the cache is delayed.
- Do not change or reinterpret official team points, allocations, badge holders, or leaderboard totals.

## Prompt Requirements

Every AI prompt should include:

- The exact cached data available.
- The scoring and badge rules if discussing points or badges.
- The data freshness timestamp.
- Tone instructions.
- A rule to say when data is unavailable.

## Caching

Cache AI outputs in `ai_generations` with feature type, input hash, source timestamps, generated text, model, and creation time.

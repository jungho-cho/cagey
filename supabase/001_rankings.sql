-- Cagey Rankings System
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Rankings table
create table if not exists rankings (
  id bigint generated always as identity primary key,
  player_id text not null,           -- anonymous UUID (web) or getUserKeyForGame hash (toss)
  player_name text not null default 'Player',
  platform text not null default 'web',  -- 'web' or 'toss'
  difficulty text not null,          -- 'easy', 'medium', 'hard', 'expert'
  is_daily boolean not null default false,
  puzzle_date text,                  -- 'YYYY-MM-DD' for daily puzzles
  solve_time_seconds integer not null,
  score integer not null,            -- max(0, 3600 - solve_time_seconds)
  created_at timestamptz not null default now()
);

-- 2. Indexes for fast leaderboard queries
create index if not exists idx_rankings_daily on rankings (is_daily, puzzle_date, difficulty, score desc)
  where is_daily = true;

create index if not exists idx_rankings_free on rankings (difficulty, score desc)
  where is_daily = false;

create index if not exists idx_rankings_player on rankings (player_id, created_at desc);

-- 3. Row Level Security
alter table rankings enable row level security;

-- Anyone can read rankings (public leaderboard)
create policy "Rankings are publicly readable"
  on rankings for select
  using (true);

-- Anyone can insert their own score (anon key)
create policy "Anyone can submit scores"
  on rankings for insert
  with check (true);

-- Players can only update their own name
create policy "Players can update own name"
  on rankings for update
  using (player_id = current_setting('request.jwt.claims', true)::json->>'sub')
  with check (player_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- 4. Function: Get daily leaderboard (top 50)
create or replace function get_daily_leaderboard(
  p_date text,
  p_difficulty text default 'medium',
  p_limit integer default 50
)
returns table (
  rank bigint,
  player_name text,
  score integer,
  solve_time_seconds integer,
  platform text
)
language sql stable
as $$
  select
    row_number() over (order by r.score desc, r.solve_time_seconds asc) as rank,
    r.player_name,
    r.score,
    r.solve_time_seconds,
    r.platform
  from rankings r
  where r.is_daily = true
    and r.puzzle_date = p_date
    and r.difficulty = p_difficulty
  order by r.score desc, r.solve_time_seconds asc
  limit p_limit;
$$;

-- 5. Function: Get all-time leaderboard by difficulty (top 50)
create or replace function get_alltime_leaderboard(
  p_difficulty text,
  p_limit integer default 50
)
returns table (
  rank bigint,
  player_name text,
  score integer,
  solve_time_seconds integer,
  platform text
)
language sql stable
as $$
  select
    row_number() over (order by r.score desc, r.solve_time_seconds asc) as rank,
    r.player_name,
    r.score,
    r.solve_time_seconds,
    r.platform
  from rankings r
  where r.difficulty = p_difficulty
  order by r.score desc, r.solve_time_seconds asc
  limit p_limit;
$$;

-- 6. Function: Get player's rank for a specific daily puzzle
create or replace function get_player_daily_rank(
  p_player_id text,
  p_date text,
  p_difficulty text default 'medium'
)
returns table (
  rank bigint,
  score integer,
  total_players bigint
)
language sql stable
as $$
  with ranked as (
    select
      r.player_id,
      r.score,
      row_number() over (order by r.score desc, r.solve_time_seconds asc) as rank
    from rankings r
    where r.is_daily = true
      and r.puzzle_date = p_date
      and r.difficulty = p_difficulty
  )
  select
    ranked.rank,
    ranked.score,
    (select count(*) from ranked) as total_players
  from ranked
  where ranked.player_id = p_player_id;
$$;

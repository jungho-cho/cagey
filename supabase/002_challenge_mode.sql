-- Challenge Mode: add game_mode column to rankings
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Add game_mode column (default 'classic' for existing data)
ALTER TABLE rankings ADD COLUMN IF NOT EXISTS
  game_mode text NOT NULL DEFAULT 'classic';

-- 2. Update indexes for mode-aware queries
CREATE INDEX IF NOT EXISTS idx_rankings_daily_mode
  ON rankings (is_daily, puzzle_date, difficulty, game_mode, score DESC)
  WHERE is_daily = true;

CREATE INDEX IF NOT EXISTS idx_rankings_free_mode
  ON rankings (difficulty, game_mode, score DESC)
  WHERE is_daily = false;

-- 3. Update submit_score to accept game_mode
CREATE OR REPLACE FUNCTION submit_score(
  p_player_id text,
  p_player_name text,
  p_platform text,
  p_difficulty text,
  p_is_daily boolean,
  p_puzzle_date text,
  p_solve_time_seconds integer,
  p_score integer,
  p_game_mode text DEFAULT 'classic'
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Upsert: update if better score, insert if new
  INSERT INTO rankings (player_id, player_name, platform, difficulty, is_daily, puzzle_date, solve_time_seconds, score, game_mode)
  VALUES (p_player_id, p_player_name, p_platform, p_difficulty, p_is_daily, p_puzzle_date, p_solve_time_seconds, p_score, p_game_mode)
  ON CONFLICT (player_id, difficulty, game_mode, puzzle_date) WHERE is_daily = true
  DO UPDATE SET
    score = GREATEST(rankings.score, EXCLUDED.score),
    solve_time_seconds = CASE WHEN EXCLUDED.score > rankings.score THEN EXCLUDED.solve_time_seconds ELSE rankings.solve_time_seconds END,
    player_name = EXCLUDED.player_name;
END;
$$;

-- 4. Update leaderboard functions to filter by game_mode
CREATE OR REPLACE FUNCTION get_daily_leaderboard(
  p_date text,
  p_difficulty text DEFAULT 'medium',
  p_limit integer DEFAULT 50,
  p_game_mode text DEFAULT 'classic'
)
RETURNS TABLE (
  rank bigint,
  player_id text,
  player_name text,
  score integer,
  solve_time_seconds integer,
  platform text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    row_number() OVER (ORDER BY r.score DESC, r.solve_time_seconds ASC) AS rank,
    r.player_id,
    r.player_name,
    r.score,
    r.solve_time_seconds,
    r.platform
  FROM rankings r
  WHERE r.is_daily = true
    AND r.puzzle_date = p_date
    AND r.difficulty = p_difficulty
    AND r.game_mode = p_game_mode
  ORDER BY r.score DESC, r.solve_time_seconds ASC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION get_difficulty_leaderboard(
  p_difficulty text,
  p_period text DEFAULT 'alltime',
  p_limit integer DEFAULT 30,
  p_game_mode text DEFAULT 'classic'
)
RETURNS TABLE (
  rank bigint,
  player_id text,
  player_name text,
  score integer,
  solve_time_seconds integer,
  platform text
)
LANGUAGE sql STABLE
AS $$
  SELECT
    row_number() OVER (ORDER BY r.score DESC, r.solve_time_seconds ASC) AS rank,
    r.player_id,
    r.player_name,
    r.score,
    r.solve_time_seconds,
    r.platform
  FROM rankings r
  WHERE r.difficulty = p_difficulty
    AND r.game_mode = p_game_mode
    AND (
      p_period = 'alltime'
      OR (p_period = 'daily' AND r.created_at >= CURRENT_DATE)
      OR (p_period = 'weekly' AND r.created_at >= date_trunc('week', CURRENT_DATE))
      OR (p_period = 'monthly' AND r.created_at >= date_trunc('month', CURRENT_DATE))
    )
  ORDER BY r.score DESC, r.solve_time_seconds ASC
  LIMIT p_limit;
$$;

CREATE OR REPLACE FUNCTION get_player_daily_rank(
  p_player_id text,
  p_date text,
  p_difficulty text DEFAULT 'medium',
  p_game_mode text DEFAULT 'classic'
)
RETURNS TABLE (
  rank bigint,
  score integer,
  total_players bigint
)
LANGUAGE sql STABLE
AS $$
  WITH ranked AS (
    SELECT
      r.player_id,
      r.score,
      row_number() OVER (ORDER BY r.score DESC, r.solve_time_seconds ASC) AS rank
    FROM rankings r
    WHERE r.is_daily = true
      AND r.puzzle_date = p_date
      AND r.difficulty = p_difficulty
      AND r.game_mode = p_game_mode
  )
  SELECT
    ranked.rank,
    ranked.score,
    (SELECT count(*) FROM ranked) AS total_players
  FROM ranked
  WHERE ranked.player_id = p_player_id;
$$;

CREATE OR REPLACE FUNCTION get_player_difficulty_rank(
  p_player_id text,
  p_difficulty text,
  p_period text DEFAULT 'alltime',
  p_game_mode text DEFAULT 'classic'
)
RETURNS TABLE (
  rank bigint,
  score integer,
  total_players bigint
)
LANGUAGE sql STABLE
AS $$
  WITH ranked AS (
    SELECT
      r.player_id,
      r.score,
      row_number() OVER (ORDER BY r.score DESC, r.solve_time_seconds ASC) AS rank
    FROM rankings r
    WHERE r.difficulty = p_difficulty
      AND r.game_mode = p_game_mode
      AND (
        p_period = 'alltime'
        OR (p_period = 'daily' AND r.created_at >= CURRENT_DATE)
        OR (p_period = 'weekly' AND r.created_at >= date_trunc('week', CURRENT_DATE))
        OR (p_period = 'monthly' AND r.created_at >= date_trunc('month', CURRENT_DATE))
      )
  )
  SELECT
    ranked.rank,
    ranked.score,
    (SELECT count(*) FROM ranked) AS total_players
  FROM ranked
  WHERE ranked.player_id = p_player_id;
$$;

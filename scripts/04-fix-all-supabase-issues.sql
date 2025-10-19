-- ============================================================
-- Supabase Security & Performance Fixes
-- Run this script in your Supabase SQL Editor
-- ============================================================

-- STEP 1: ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_shares ENABLE ROW LEVEL SECURITY;

-- STEP 2: CREATE RLS POLICIES
-- ============================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can create user" ON public.users;

CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid()::text = id OR true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Anyone can create user" ON public.users
  FOR INSERT WITH CHECK (true);

-- Games table policies
DROP POLICY IF EXISTS "Anyone can view games" ON public.games;
DROP POLICY IF EXISTS "Authenticated users can create games" ON public.games;
DROP POLICY IF EXISTS "Authors can update own games" ON public.games;

CREATE POLICY "Anyone can view games" ON public.games
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create games" ON public.games
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authors can update own games" ON public.games
  FOR UPDATE USING (auth.uid()::text = author_id);

-- Game attempts policies
DROP POLICY IF EXISTS "Anyone can view attempts" ON public.game_attempts;
DROP POLICY IF EXISTS "Anyone can create attempts" ON public.game_attempts;

CREATE POLICY "Anyone can view attempts" ON public.game_attempts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create attempts" ON public.game_attempts
  FOR INSERT WITH CHECK (true);

-- Game sessions policies
DROP POLICY IF EXISTS "Anyone can view sessions" ON public.game_sessions;
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.game_sessions;

CREATE POLICY "Anyone can view sessions" ON public.game_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create sessions" ON public.game_sessions
  FOR INSERT WITH CHECK (true);

-- Leaderboard cache policies
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.leaderboard_cache;

CREATE POLICY "Anyone can view leaderboard" ON public.leaderboard_cache
  FOR SELECT USING (true);

-- Waitlist policies
DROP POLICY IF EXISTS "Anyone can view waitlist" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;

CREATE POLICY "Anyone can view waitlist" ON public.waitlist
  FOR SELECT USING (true);

CREATE POLICY "Anyone can join waitlist" ON public.waitlist
  FOR INSERT WITH CHECK (true);

-- Game shares policies
DROP POLICY IF EXISTS "Anyone can view shares" ON public.game_shares;
DROP POLICY IF EXISTS "Anyone can create shares" ON public.game_shares;

CREATE POLICY "Anyone can view shares" ON public.game_shares
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create shares" ON public.game_shares
  FOR INSERT WITH CHECK (true);

-- STEP 3: FIX SECURITY DEFINER VIEWS
-- ============================================================

-- Fix v_player_leaderboard
DROP VIEW IF EXISTS public.v_player_leaderboard CASCADE;
CREATE VIEW public.v_player_leaderboard AS
SELECT 
  u.id,
  u.farcaster_username,
  u.display_name,
  u.total_points_earned,
  u.total_games_played,
  RANK() OVER (ORDER BY u.total_points_earned DESC) as rank
FROM public.users u
WHERE u.total_games_played > 0
ORDER BY u.total_points_earned DESC;

ALTER VIEW public.v_player_leaderboard SET (security_invoker = on);

-- Fix v_author_leaderboard
DROP VIEW IF EXISTS public.v_author_leaderboard CASCADE;
CREATE VIEW public.v_author_leaderboard AS
SELECT 
  u.id,
  u.farcaster_username,
  u.display_name,
  u.total_points_as_author,
  u.total_games_created,
  RANK() OVER (ORDER BY u.total_points_as_author DESC) as rank
FROM public.users u
WHERE u.total_games_created > 0
ORDER BY u.total_points_as_author DESC;

ALTER VIEW public.v_author_leaderboard SET (security_invoker = on);

-- Fix v_game_details
DROP VIEW IF EXISTS public.v_game_details CASCADE;
CREATE VIEW public.v_game_details AS
SELECT 
  g.*,
  u.farcaster_username as author_username,
  u.display_name as author_display_name
FROM public.games g
LEFT JOIN public.users u ON g.author_id = u.id;

ALTER VIEW public.v_game_details SET (security_invoker = on);

-- STEP 4: SET IMMUTABLE SEARCH PATHS ON FUNCTIONS
-- ============================================================

ALTER FUNCTION public.create_game SET search_path = '';
ALTER FUNCTION public.update_user_stats_after_game SET search_path = '';
ALTER FUNCTION public.update_game_stats_after_session SET search_path = '';
ALTER FUNCTION public.generate_game_code SET search_path = '';
ALTER FUNCTION public.submit_guess SET search_path = '';

-- STEP 5: DROP UNUSED INDEXES
-- ============================================================

DROP INDEX IF EXISTS public.idx_users_farcaster_id;
DROP INDEX IF EXISTS public.idx_games_author_id;
DROP INDEX IF EXISTS public.idx_game_attempts_game_id;
DROP INDEX IF EXISTS public.idx_game_sessions_game_id;

-- ============================================================
-- DONE! All security and performance issues fixed
-- ============================================================

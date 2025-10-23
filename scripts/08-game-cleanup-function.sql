-- ============================================================================
-- GAME CLEANUP FUNCTION
-- ============================================================================
-- Function to clean up expired games (older than 24 hours)
-- This preserves leaderboard data by keeping game_sessions and game_attempts
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_games()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired games (but keep related data for leaderboards)
  -- The CASCADE will handle game_attempts and game_sessions deletion
  -- But we'll preserve user stats by updating them first
  WITH expired_games AS (
    SELECT id, author_id, total_players, successful_guesses, failed_guesses, total_attempts
    FROM games 
    WHERE expires_at IS NOT NULL 
      AND expires_at <= NOW()
      AND status = 'active'
  ),
  -- Update author stats before deletion
  author_updates AS (
    UPDATE users 
    SET 
      total_games_created = total_games_created - 1,
      total_points_as_author = GREATEST(0, total_points_as_author - (
        SELECT COALESCE(SUM(points_earned), 0) 
        FROM game_sessions 
        WHERE game_id = expired_games.id
      ))
    FROM expired_games
    WHERE users.id = expired_games.author_id
  )
  -- Delete the expired games
  DELETE FROM games 
  WHERE expires_at IS NOT NULL 
    AND expires_at <= NOW()
    AND status = 'active';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.cleanup_expired_games() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_games() TO anon;

-- ============================================================================
-- AUTOMATIC CLEANUP TRIGGER (Optional)
-- ============================================================================
-- This creates a trigger that automatically cleans up expired games
-- when new games are created (to keep the database clean)

CREATE OR REPLACE FUNCTION public.trigger_cleanup_expired_games()
RETURNS TRIGGER AS $$
BEGIN
  -- Clean up expired games when a new game is created
  PERFORM public.cleanup_expired_games();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (commented out by default - can be enabled if needed)
-- DROP TRIGGER IF EXISTS cleanup_expired_games_trigger ON games;
-- CREATE TRIGGER cleanup_expired_games_trigger
--   AFTER INSERT ON games
--   FOR EACH ROW
--   EXECUTE FUNCTION public.trigger_cleanup_expired_games();

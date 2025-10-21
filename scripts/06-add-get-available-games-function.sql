-- ============================================================================
-- ADD GET_AVAILABLE_GAMES FUNCTION
-- ============================================================================
-- This function returns games available for a specific player to play
-- Excludes games created by the player and games they've already completed
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_available_games(p_player_id TEXT)
RETURNS TABLE (
  id UUID,
  game_code VARCHAR,
  author_id UUID,
  game_type VARCHAR,
  masterpiece_text TEXT,
  hidden_word VARCHAR,
  status VARCHAR,
  total_players INTEGER,
  successful_guesses INTEGER,
  failed_guesses INTEGER,
  total_attempts INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT g.*
  FROM games g
  LEFT JOIN users u ON u.farcaster_id = p_player_id
  WHERE g.status = 'active'
    AND (u.id IS NULL OR g.author_id != u.id) -- Exclude games created by player
    AND NOT EXISTS ( -- Exclude completed games
      SELECT 1 FROM game_sessions gs
      WHERE gs.game_id = g.id
        AND gs.player_id = u.id
        AND gs.status IN ('won', 'lost')
    )
  ORDER BY g.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_available_games(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_available_games(TEXT) TO anon;

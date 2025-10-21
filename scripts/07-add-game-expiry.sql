-- ============================================================================
-- ADD GAME EXPIRY COLUMN
-- ============================================================================
-- Add expires_at column to games table for 24-hour lifecycle
-- ============================================================================

-- Add expires_at column
ALTER TABLE games ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update existing games to expire 24hrs after creation
UPDATE games SET expires_at = created_at + INTERVAL '24 hours' WHERE expires_at IS NULL;

-- Update create_game function to set expiry
CREATE OR REPLACE FUNCTION public.create_game(
  p_author_id UUID,
  p_game_type VARCHAR,
  p_masterpiece_text TEXT,
  p_hidden_word VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
  v_game_code VARCHAR;
  v_code_length INTEGER := 6;
  v_max_attempts INTEGER := 100;
  v_attempt INTEGER := 0;
BEGIN
  -- Generate unique game code
  LOOP
    v_attempt := v_attempt + 1;
    
    -- Generate random code
    v_game_code := UPPER(
      SUBSTRING(
        MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 
        1, v_code_length
      )
    );
    
    -- Check if code already exists
    IF NOT EXISTS (SELECT 1 FROM games WHERE game_code = v_game_code) THEN
      EXIT; -- Code is unique, exit loop
    END IF;
    
    -- Prevent infinite loop
    IF v_attempt >= v_max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique game code after % attempts', v_max_attempts;
    END IF;
  END LOOP;
  
  -- Insert new game with expiry
  INSERT INTO games (
    game_code, 
    author_id, 
    game_type, 
    masterpiece_text, 
    hidden_word,
    expires_at
  ) VALUES (
    v_game_code, 
    p_author_id, 
    p_game_type, 
    p_masterpiece_text, 
    p_hidden_word,
    NOW() + INTERVAL '24 hours'  -- Add 24-hour expiry
  );
  
  RETURN v_game_code;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.create_game(UUID, VARCHAR, TEXT, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_game(UUID, VARCHAR, TEXT, VARCHAR) TO anon;

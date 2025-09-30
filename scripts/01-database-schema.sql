-- ============================================================================
-- WRITECAST DATABASE SCHEMA
-- ============================================================================
-- Comprehensive database structure for the Writecast Farcaster mini app
-- Supports both game modes: fill-in-blank and frame-the-word
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores user information including Farcaster ID and optional email
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farcaster_id VARCHAR(255) UNIQUE,
  farcaster_username VARCHAR(255),
  email VARCHAR(255),
  display_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Stats
  total_games_created INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  total_points_earned INTEGER DEFAULT 0,
  total_points_as_author INTEGER DEFAULT 0,
  
  -- Indexes
  CONSTRAINT email_or_farcaster_required CHECK (
    farcaster_id IS NOT NULL OR email IS NOT NULL
  )
);

CREATE INDEX idx_users_farcaster_id ON users(farcaster_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_total_points ON users(total_points_earned DESC);

-- ============================================================================
-- GAMES TABLE
-- ============================================================================
-- Stores all games (both fill-in-blank and frame-the-word)
CREATE TABLE IF NOT EXISTS games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_code VARCHAR(10) UNIQUE NOT NULL, -- Short shareable code like "ABC123"
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Game type: 'fill-blank' or 'frame-word'
  game_type VARCHAR(20) NOT NULL CHECK (game_type IN ('fill-blank', 'frame-word')),
  
  -- Game content
  masterpiece_text TEXT NOT NULL,
  hidden_word VARCHAR(255) NOT NULL, -- The word to guess
  
  -- Game status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  
  -- Stats
  total_players INTEGER DEFAULT 0,
  successful_guesses INTEGER DEFAULT 0,
  failed_guesses INTEGER DEFAULT 0,
  total_attempts INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  difficulty_rating DECIMAL(3,2), -- Calculated based on success rate
  average_attempts DECIMAL(4,2)
);

CREATE INDEX idx_games_game_code ON games(game_code);
CREATE INDEX idx_games_author_id ON games(author_id);
CREATE INDEX idx_games_game_type ON games(game_type);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_created_at ON games(created_at DESC);

-- ============================================================================
-- GAME_ATTEMPTS TABLE
-- ============================================================================
-- Tracks all player attempts at guessing words
CREATE TABLE IF NOT EXISTS game_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Attempt details
  guess VARCHAR(255) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempt_number INTEGER NOT NULL, -- 1, 2, or 3
  
  -- Points awarded (0 if incorrect)
  points_earned INTEGER DEFAULT 0,
  
  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure player can't have duplicate attempts for same game
  UNIQUE(game_id, player_id, attempt_number)
);

CREATE INDEX idx_game_attempts_game_id ON game_attempts(game_id);
CREATE INDEX idx_game_attempts_player_id ON game_attempts(player_id);
CREATE INDEX idx_game_attempts_is_correct ON game_attempts(is_correct);

-- ============================================================================
-- GAME_SESSIONS TABLE
-- ============================================================================
-- Tracks complete player sessions (all attempts for a game)
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session outcome
  status VARCHAR(20) NOT NULL CHECK (status IN ('in_progress', 'won', 'lost')),
  total_attempts INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure one session per player per game
  UNIQUE(game_id, player_id)
);

CREATE INDEX idx_game_sessions_game_id ON game_sessions(game_id);
CREATE INDEX idx_game_sessions_player_id ON game_sessions(player_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);

-- ============================================================================
-- LEADERBOARD_CACHE TABLE
-- ============================================================================
-- Cached leaderboard data for performance (updated periodically)
CREATE TABLE IF NOT EXISTS leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_type VARCHAR(20) NOT NULL CHECK (leaderboard_type IN ('player', 'author')),
  
  -- Rankings
  rank INTEGER NOT NULL,
  total_points INTEGER NOT NULL,
  
  -- Player-specific stats
  games_played INTEGER,
  games_won INTEGER,
  success_rate DECIMAL(5,2),
  average_attempts DECIMAL(4,2),
  
  -- Author-specific stats
  games_created INTEGER,
  total_players_attracted INTEGER,
  difficulty_rating DECIMAL(3,2),
  
  -- Cache metadata
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, leaderboard_type)
);

CREATE INDEX idx_leaderboard_cache_type_rank ON leaderboard_cache(leaderboard_type, rank);
CREATE INDEX idx_leaderboard_cache_user_id ON leaderboard_cache(user_id);

-- ============================================================================
-- WAITLIST TABLE
-- ============================================================================
-- Stores users who want to be notified when the app goes live
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact information (at least one required)
  email VARCHAR(255),
  farcaster_id VARCHAR(255),
  farcaster_username VARCHAR(255),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'notified', 'converted')),
  
  -- Timestamps
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  referral_source VARCHAR(100),
  
  CONSTRAINT waitlist_contact_required CHECK (
    email IS NOT NULL OR farcaster_id IS NOT NULL
  )
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_farcaster_id ON waitlist(farcaster_id);
CREATE INDEX idx_waitlist_status ON waitlist(status);
CREATE INDEX idx_waitlist_joined_at ON waitlist(joined_at DESC);

-- ============================================================================
-- GAME_SHARES TABLE
-- ============================================================================
-- Tracks when games are shared (for viral/social features)
CREATE TABLE IF NOT EXISTS game_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  shared_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Share details
  share_platform VARCHAR(50), -- 'farcaster', 'twitter', 'direct_link', etc.
  share_url TEXT,
  
  -- Tracking
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0, -- How many people played after clicking
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_game_shares_game_id ON game_shares(game_id);
CREATE INDEX idx_game_shares_shared_by ON game_shares(shared_by_user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update user stats after game completion
CREATE OR REPLACE FUNCTION update_user_stats_after_game()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update author stats
    UPDATE users
    SET 
      total_games_created = total_games_created + 1,
      total_points_as_author = total_points_as_author + (NEW.failed_guesses * 5),
      updated_at = NOW()
    WHERE id = NEW.author_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_stats_after_game
AFTER UPDATE ON games
FOR EACH ROW
EXECUTE FUNCTION update_user_stats_after_game();

-- Function to update game stats after session completion
CREATE OR REPLACE FUNCTION update_game_stats_after_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('won', 'lost') AND OLD.status = 'in_progress' THEN
    UPDATE games
    SET
      total_players = total_players + 1,
      successful_guesses = successful_guesses + CASE WHEN NEW.status = 'won' THEN 1 ELSE 0 END,
      failed_guesses = failed_guesses + CASE WHEN NEW.status = 'lost' THEN 1 ELSE 0 END,
      total_attempts = total_attempts + NEW.total_attempts,
      average_attempts = (total_attempts + NEW.total_attempts)::DECIMAL / (total_players + 1),
      difficulty_rating = CASE 
        WHEN (total_players + 1) > 0 
        THEN (failed_guesses + CASE WHEN NEW.status = 'lost' THEN 1 ELSE 0 END)::DECIMAL / (total_players + 1)
        ELSE 0
      END
    WHERE id = NEW.game_id;
    
    -- Update player stats
    UPDATE users
    SET
      total_games_played = total_games_played + 1,
      total_points_earned = total_points_earned + NEW.points_earned,
      updated_at = NOW()
    WHERE id = NEW.player_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_game_stats_after_session
AFTER UPDATE ON game_sessions
FOR EACH ROW
EXECUTE FUNCTION update_game_stats_after_session();

-- Function to generate unique game codes
CREATE OR REPLACE FUNCTION generate_game_code()
RETURNS VARCHAR(10) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result VARCHAR(10) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
  END LOOP;
  
  -- Check if code already exists, regenerate if so
  WHILE EXISTS (SELECT 1 FROM games WHERE game_code = result) LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
  END LOOP;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for player leaderboard
CREATE OR REPLACE VIEW v_player_leaderboard AS
SELECT 
  u.id,
  u.farcaster_username,
  u.display_name,
  u.total_points_earned,
  u.total_games_played,
  CASE 
    WHEN u.total_games_played > 0 
    THEN (SELECT COUNT(*) FROM game_sessions WHERE player_id = u.id AND status = 'won')::DECIMAL / u.total_games_played * 100
    ELSE 0
  END as success_rate,
  (SELECT AVG(total_attempts) FROM game_sessions WHERE player_id = u.id AND status = 'won') as avg_attempts,
  ROW_NUMBER() OVER (ORDER BY u.total_points_earned DESC) as rank
FROM users u
WHERE u.total_games_played > 0
ORDER BY u.total_points_earned DESC;

-- View for author leaderboard
CREATE OR REPLACE VIEW v_author_leaderboard AS
SELECT 
  u.id,
  u.farcaster_username,
  u.display_name,
  u.total_points_as_author,
  u.total_games_created,
  (SELECT SUM(total_players) FROM games WHERE author_id = u.id) as total_players_attracted,
  (SELECT AVG(difficulty_rating) FROM games WHERE author_id = u.id) as avg_difficulty,
  ROW_NUMBER() OVER (ORDER BY u.total_points_as_author DESC) as rank
FROM users u
WHERE u.total_games_created > 0
ORDER BY u.total_points_as_author DESC;

-- View for game details with author info
CREATE OR REPLACE VIEW v_game_details AS
SELECT 
  g.*,
  u.farcaster_username as author_username,
  u.display_name as author_display_name,
  (SELECT COUNT(*) FROM game_sessions WHERE game_id = g.id AND status = 'won') as winners_count,
  (SELECT COUNT(*) FROM game_sessions WHERE game_id = g.id AND status = 'lost') as losers_count
FROM games g
JOIN users u ON g.author_id = u.id;

-- ============================================================================
-- SAMPLE DATA INSERTION FUNCTIONS
-- ============================================================================

-- Function to create a new game
CREATE OR REPLACE FUNCTION create_game(
  p_author_id UUID,
  p_game_type VARCHAR(20),
  p_masterpiece_text TEXT,
  p_hidden_word VARCHAR(255)
)
RETURNS VARCHAR(10) AS $$
DECLARE
  v_game_code VARCHAR(10);
BEGIN
  v_game_code := generate_game_code();
  
  INSERT INTO games (game_code, author_id, game_type, masterpiece_text, hidden_word)
  VALUES (v_game_code, p_author_id, p_game_type, p_masterpiece_text, p_hidden_word);
  
  RETURN v_game_code;
END;
$$ LANGUAGE plpgsql;

-- Function to submit a guess
CREATE OR REPLACE FUNCTION submit_guess(
  p_game_id UUID,
  p_player_id UUID,
  p_guess VARCHAR(255)
)
RETURNS JSON AS $$
DECLARE
  v_session_id UUID;
  v_attempt_number INTEGER;
  v_is_correct BOOLEAN;
  v_hidden_word VARCHAR(255);
  v_points INTEGER := 0;
  v_session_status VARCHAR(20);
BEGIN
  -- Get or create session
  SELECT id, total_attempts INTO v_session_id, v_attempt_number
  FROM game_sessions
  WHERE game_id = p_game_id AND player_id = p_player_id;
  
  IF v_session_id IS NULL THEN
    INSERT INTO game_sessions (game_id, player_id, status)
    VALUES (p_game_id, p_player_id, 'in_progress')
    RETURNING id INTO v_session_id;
    v_attempt_number := 0;
  END IF;
  
  -- Check if already completed
  SELECT status INTO v_session_status FROM game_sessions WHERE id = v_session_id;
  IF v_session_status IN ('won', 'lost') THEN
    RETURN json_build_object('error', 'Game already completed');
  END IF;
  
  -- Increment attempt
  v_attempt_number := v_attempt_number + 1;
  
  -- Check if correct
  SELECT hidden_word INTO v_hidden_word FROM games WHERE id = p_game_id;
  v_is_correct := LOWER(p_guess) = LOWER(v_hidden_word);
  
  -- Calculate points
  IF v_is_correct THEN
    v_points := CASE v_attempt_number
      WHEN 1 THEN 15  -- First try bonus
      WHEN 2 THEN 10
      WHEN 3 THEN 5
      ELSE 0
    END;
    v_session_status := 'won';
  ELSIF v_attempt_number >= 3 THEN
    v_session_status := 'lost';
  ELSE
    v_session_status := 'in_progress';
  END IF;
  
  -- Record attempt
  INSERT INTO game_attempts (game_id, player_id, guess, is_correct, attempt_number, points_earned)
  VALUES (p_game_id, p_player_id, p_guess, v_is_correct, v_attempt_number, v_points);
  
  -- Update session
  UPDATE game_sessions
  SET 
    total_attempts = v_attempt_number,
    points_earned = points_earned + v_points,
    status = v_session_status,
    completed_at = CASE WHEN v_session_status IN ('won', 'lost') THEN NOW() ELSE NULL END
  WHERE id = v_session_id;
  
  RETURN json_build_object(
    'is_correct', v_is_correct,
    'attempt_number', v_attempt_number,
    'points_earned', v_points,
    'session_status', v_session_status
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_game_sessions_player_status ON game_sessions(player_id, status);
CREATE INDEX idx_game_attempts_game_player ON game_attempts(game_id, player_id);
CREATE INDEX idx_games_author_status ON games(author_id, status);

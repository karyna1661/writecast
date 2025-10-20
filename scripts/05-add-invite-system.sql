-- ============================================================================
-- INVITE SYSTEM DATABASE MIGRATION
-- ============================================================================
-- Adds invite-a-friend functionality with bonus attempts and referral rewards
-- ============================================================================

-- ============================================================================
-- GAME_INVITES TABLE
-- ============================================================================
-- Tracks when players invite friends for help during games
CREATE TABLE IF NOT EXISTS game_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  inviter_player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_player_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL until accepted
  invited_username VARCHAR(255) NOT NULL, -- Farcaster username
  
  -- Invite status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'expired')),
  
  -- Points earned by inviter
  inviter_earned_points INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  UNIQUE(game_id, inviter_player_id), -- One invite per game per player
  CONSTRAINT valid_invite_status CHECK (
    (status = 'pending' AND invited_player_id IS NULL AND accepted_at IS NULL) OR
    (status = 'accepted' AND invited_player_id IS NOT NULL AND accepted_at IS NOT NULL) OR
    (status = 'completed' AND invited_player_id IS NOT NULL AND completed_at IS NOT NULL) OR
    (status = 'expired' AND invited_player_id IS NULL)
  )
);

CREATE INDEX idx_game_invites_game_id ON game_invites(game_id);
CREATE INDEX idx_game_invites_inviter ON game_invites(inviter_player_id);
CREATE INDEX idx_game_invites_invited ON game_invites(invited_player_id);
CREATE INDEX idx_game_invites_status ON game_invites(status);

-- ============================================================================
-- UPDATE GAME_SESSIONS TABLE
-- ============================================================================
-- Add fields to track invite usage and referral chains
ALTER TABLE game_sessions 
ADD COLUMN IF NOT EXISTS invited_by_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS has_used_invite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bonus_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS invite_id UUID REFERENCES game_invites(id) ON DELETE SET NULL;

CREATE INDEX idx_game_sessions_invited_by ON game_sessions(invited_by_player_id);
CREATE INDEX idx_game_sessions_invite_id ON game_sessions(invite_id);

-- ============================================================================
-- FUNCTIONS FOR INVITE SYSTEM
-- ============================================================================

-- Function to use a game invite (grant bonus attempt)
CREATE OR REPLACE FUNCTION use_game_invite(
  p_game_id UUID,
  p_player_id UUID,
  p_invited_username VARCHAR(255)
)
RETURNS JSON AS $$
DECLARE
  v_invite_id UUID;
  v_session_id UUID;
  v_current_attempts INTEGER;
  v_max_attempts INTEGER := 3;
BEGIN
  -- Check if player already has an invite for this game
  SELECT id INTO v_invite_id
  FROM game_invites
  WHERE game_id = p_game_id AND inviter_player_id = p_player_id;
  
  IF v_invite_id IS NOT NULL THEN
    RETURN json_build_object('error', 'You have already invited someone for this game');
  END IF;
  
  -- Check if player has a session and hasn't used invite yet
  SELECT id, total_attempts INTO v_session_id, v_current_attempts
  FROM game_sessions
  WHERE game_id = p_game_id AND player_id = p_player_id;
  
  IF v_session_id IS NULL THEN
    RETURN json_build_object('error', 'No active game session found');
  END IF;
  
  -- Check if player has already used invite
  SELECT has_used_invite INTO v_current_attempts
  FROM game_sessions
  WHERE id = v_session_id;
  
  IF v_current_attempts THEN
    RETURN json_build_object('error', 'You have already used your invite for this game');
  END IF;
  
  -- Check if player is on their final attempt (3rd)
  SELECT total_attempts INTO v_current_attempts
  FROM game_sessions
  WHERE id = v_session_id;
  
  IF v_current_attempts < 2 THEN
    RETURN json_build_object('error', 'You can only invite a friend before your final attempt');
  END IF;
  
  -- Create invite record
  INSERT INTO game_invites (game_id, inviter_player_id, invited_username)
  VALUES (p_game_id, p_player_id, p_invited_username)
  RETURNING id INTO v_invite_id;
  
  -- Update session to mark invite as used and grant bonus attempt
  UPDATE game_sessions
  SET 
    has_used_invite = TRUE,
    bonus_attempts = 1,
    invite_id = v_invite_id
  WHERE id = v_session_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'invite_id', v_invite_id,
    'message', 'Invite sent! You now have 4 total attempts.'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to accept an invite (when invited friend starts playing)
CREATE OR REPLACE FUNCTION accept_game_invite(
  p_invite_id UUID,
  p_invited_player_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_invite game_invites%ROWTYPE;
BEGIN
  -- Get invite details
  SELECT * INTO v_invite
  FROM game_invites
  WHERE id = p_invite_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invite not found or already processed');
  END IF;
  
  -- Update invite to accepted
  UPDATE game_invites
  SET 
    invited_player_id = p_invited_player_id,
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = p_invite_id;
  
  -- Create session for invited player with referral tracking
  INSERT INTO game_sessions (game_id, player_id, invited_by_player_id, invite_id)
  VALUES (v_invite.game_id, p_invited_player_id, v_invite.inviter_player_id, p_invite_id)
  ON CONFLICT (game_id, player_id) DO NOTHING;
  
  RETURN json_build_object(
    'success', TRUE,
    'message', 'Invite accepted! You are playing as a referred friend.'
  );
END;
$$ LANGUAGE plpgsql;

-- Function to award referral points when invited friend wins
CREATE OR REPLACE FUNCTION award_referral_points(
  p_invite_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_invite game_invites%ROWTYPE;
  v_referral_points INTEGER := 2;
BEGIN
  -- Get invite details
  SELECT * INTO v_invite
  FROM game_invites
  WHERE id = p_invite_id AND status = 'accepted';
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invite not found or not accepted');
  END IF;
  
  -- Award points to inviter
  UPDATE users
  SET 
    total_points_earned = total_points_earned + v_referral_points,
    updated_at = NOW()
  WHERE id = v_invite.inviter_player_id;
  
  -- Update invite to completed
  UPDATE game_invites
  SET 
    status = 'completed',
    inviter_earned_points = v_referral_points,
    completed_at = NOW()
  WHERE id = p_invite_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'points_awarded', v_referral_points,
    'message', 'Referral points awarded to inviter'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATE SUBMIT_GUESS FUNCTION
-- ============================================================================
-- Modify to handle 4 attempts for players who used invites

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
  v_max_attempts INTEGER := 3;
  v_bonus_attempts INTEGER := 0;
  v_invite_id UUID;
BEGIN
  -- Get or create session
  SELECT id, total_attempts, bonus_attempts, invite_id INTO v_session_id, v_attempt_number, v_bonus_attempts, v_invite_id
  FROM game_sessions
  WHERE game_id = p_game_id AND player_id = p_player_id;
  
  IF v_session_id IS NULL THEN
    INSERT INTO game_sessions (game_id, player_id, status)
    VALUES (p_game_id, p_player_id, 'in_progress')
    RETURNING id INTO v_session_id;
    v_attempt_number := 0;
    v_bonus_attempts := 0;
  END IF;
  
  -- Check if already completed
  SELECT status INTO v_session_status FROM game_sessions WHERE id = v_session_id;
  IF v_session_status IN ('won', 'lost') THEN
    RETURN json_build_object('error', 'Game already completed');
  END IF;
  
  -- Increment attempt
  v_attempt_number := v_attempt_number + 1;
  
  -- Calculate max attempts (3 + bonus)
  v_max_attempts := 3 + COALESCE(v_bonus_attempts, 0);
  
  -- Check if correct
  SELECT hidden_word INTO v_hidden_word FROM games WHERE id = p_game_id;
  v_is_correct := LOWER(p_guess) = LOWER(v_hidden_word);
  
  -- Calculate points
  IF v_is_correct THEN
    v_points := CASE v_attempt_number
      WHEN 1 THEN 15  -- First try bonus
      WHEN 2 THEN 10
      WHEN 3 THEN 5
      WHEN 4 THEN 3   -- Bonus attempt (reduced points)
      ELSE 0
    END;
    v_session_status := 'won';
    
    -- Award referral points if this was an invited player
    IF v_invite_id IS NOT NULL THEN
      PERFORM award_referral_points(v_invite_id);
    END IF;
  ELSIF v_attempt_number >= v_max_attempts THEN
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
    'max_attempts', v_max_attempts,
    'points_earned', v_points,
    'session_status', v_session_status,
    'can_invite', CASE WHEN v_attempt_number = 3 AND v_bonus_attempts = 0 THEN TRUE ELSE FALSE END
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR INVITE SYSTEM
-- ============================================================================

-- View for available games (excludes completed and author-created games)
CREATE OR REPLACE VIEW v_available_games AS
SELECT 
  g.*,
  u.farcaster_username as author_username,
  u.display_name as author_display_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM game_sessions gs 
      WHERE gs.game_id = g.id 
      AND gs.player_id = $1  -- Parameter will be passed in queries
      AND gs.status IN ('won', 'lost')
    ) THEN 'completed'
    WHEN g.author_id = $1 THEN 'author_created'
    ELSE 'available'
  END as availability_status
FROM games g
JOIN users u ON g.author_id = u.id
WHERE g.status = 'active';

-- View for invite statistics
CREATE OR REPLACE VIEW v_invite_stats AS
SELECT 
  gi.id,
  gi.game_id,
  gi.inviter_player_id,
  gi.invited_player_id,
  gi.invited_username,
  gi.status,
  gi.inviter_earned_points,
  gi.created_at,
  gi.accepted_at,
  gi.completed_at,
  g.game_code,
  u1.farcaster_username as inviter_username,
  u2.farcaster_username as invited_player_username,
  CASE 
    WHEN gi.status = 'completed' AND gs.status = 'won' THEN 'success'
    WHEN gi.status = 'completed' AND gs.status = 'lost' THEN 'failed'
    WHEN gi.status = 'accepted' THEN 'in_progress'
    ELSE 'pending'
  END as outcome
FROM game_invites gi
JOIN games g ON gi.game_id = g.id
LEFT JOIN users u1 ON gi.inviter_player_id = u1.id
LEFT JOIN users u2 ON gi.invited_player_id = u2.id
LEFT JOIN game_sessions gs ON gi.id = gs.invite_id;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional indexes for invite system queries
CREATE INDEX idx_game_invites_game_inviter ON game_invites(game_id, inviter_player_id);
CREATE INDEX idx_game_invites_invited_status ON game_invites(invited_player_id, status);
CREATE INDEX idx_game_sessions_invite_status ON game_sessions(invite_id, status);

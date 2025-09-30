-- ============================================================================
-- SEED DEMO GAMES FOR WRITECAST
-- ============================================================================
-- This script populates the database with demo games for testing
-- Run this after 01-database-schema.sql
-- ============================================================================

-- Create a demo author user
INSERT INTO users (
  id,
  farcaster_id,
  farcaster_username,
  display_name,
  total_games_created,
  total_points_as_author
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo_author',
  'writecast_demo',
  'Writecast Demo',
  12,
  450
) ON CONFLICT (farcaster_id) DO NOTHING;

-- Insert fill-in-blank demo games
INSERT INTO games (game_code, author_id, game_type, masterpiece_text, hidden_word, status, total_players, successful_guesses, failed_guesses) VALUES
('ABC123', '00000000-0000-0000-0000-000000000001', 'fill-blank', 
 'The future of technology lies in innovation and creativity. We must embrace change and push boundaries to create something truly remarkable. Innovation drives progress and transforms industries.',
 'innovation', 'active', 47, 32, 15),

('XYZ789', '00000000-0000-0000-0000-000000000001', 'fill-blank',
 'Life is full of unexpected moments. Sometimes the best discoveries come from serendipity, those happy accidents that lead us to places we never imagined. Embrace the unknown.',
 'serendipity', 'active', 38, 22, 16),

('TECH42', '00000000-0000-0000-0000-000000000001', 'fill-blank',
 'Decentralized systems powered by blockchain technology are revolutionizing how we think about trust and transparency. The blockchain enables peer-to-peer transactions without intermediaries, creating new possibilities for digital ownership.',
 'blockchain', 'active', 52, 41, 11),

('WORD99', '00000000-0000-0000-0000-000000000001', 'fill-blank',
 'Change is the only constant in life. Through metamorphosis, we shed our old selves and emerge transformed. This metamorphosis is not just physical but spiritual, a complete transformation of being.',
 'metamorphosis', 'active', 29, 15, 14),

('POET88', '00000000-0000-0000-0000-000000000001', 'fill-blank',
 'Beauty is often ephemeral, fleeting like cherry blossoms in spring. We chase these ephemeral moments, knowing they cannot last, yet finding meaning in their transience. The ephemeral nature of life makes each moment precious.',
 'ephemeral', 'active', 34, 19, 15),

('SAGE77', '00000000-0000-0000-0000-000000000001', 'fill-blank',
 'True wisdom comes not from books but from lived experience. With wisdom, we navigate life''s complexities with grace and understanding. Ancient wisdom teaches us that knowledge without wisdom is merely information.',
 'wisdom', 'active', 45, 33, 12);

-- Insert frame-the-word demo games
INSERT INTO games (game_code, author_id, game_type, masterpiece_text, hidden_word, status, total_players, successful_guesses, failed_guesses) VALUES
('FRAME1', '00000000-0000-0000-0000-000000000001', 'frame-word',
 'When storms come and winds blow fierce, we bend but never break. Through every challenge and setback, we find strength within ourselves. The journey shapes us, molds us, makes us stronger than we ever imagined possible.',
 'resilience', 'active', 41, 28, 13),

('FRAME2', '00000000-0000-0000-0000-000000000001', 'frame-word',
 'Fear whispers in our ears, but we step forward anyway. In the face of uncertainty, we choose action over paralysis. Not because we are fearless, but because something matters more than our fear.',
 'courage', 'active', 36, 24, 12),

('FRAME3', '00000000-0000-0000-0000-000000000001', 'frame-word',
 'In the quiet spaces between noise, we find ourselves. Away from the crowd''s demands and expectations, we can finally hear our own voice. These moments alone are not lonely but liberating, a sanctuary for the soul.',
 'solitude', 'active', 31, 18, 13),

('FRAME4', '00000000-0000-0000-0000-000000000001', 'frame-word',
 'Old photographs fade, but memories remain vivid. We return to places that no longer exist except in our minds. The past calls to us with a bittersweet song, reminding us of who we were and how far we''ve come.',
 'nostalgia', 'active', 44, 31, 13),

('FRAME5', '00000000-0000-0000-0000-000000000001', 'frame-word',
 'Dreams fuel our journey forward, pushing us beyond comfortable limits. We reach for stars that seem impossibly distant, driven by an inner fire that refuses to be extinguished. Success is not the destination but the relentless pursuit itself.',
 'ambition', 'active', 39, 27, 12),

('FRAME6', '00000000-0000-0000-0000-000000000001', 'frame-word',
 'Gray skies mirror the weight in our hearts. There''s a strange beauty in sadness, a depth that joy cannot reach. We sit with this feeling, not rushing to escape it, finding poetry in the ache.',
 'melancholy', 'active', 28, 16, 12);

-- Update demo author stats
UPDATE users 
SET 
  total_games_created = 12,
  total_points_as_author = 450,
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

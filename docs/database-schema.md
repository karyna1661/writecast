# Writecast Database Schema Documentation

## Overview

This document describes the comprehensive database structure for the Writecast Farcaster mini app. The schema supports both game modes (fill-in-blank and frame-the-word), user management, game sessions, leaderboards, and a waitlist system.

## Database Tables

### 1. Users Table
Stores all user information including Farcaster IDs and optional email addresses.

**Key Features:**
- Supports both Farcaster ID and email authentication
- Tracks user statistics (games created, games played, points earned)
- Constraint ensures at least one contact method (email or Farcaster ID)

**Indexes:**
- `farcaster_id` - Fast user lookup by Farcaster ID
- `email` - Fast user lookup by email
- `total_points_earned` - Optimized for leaderboard queries

### 2. Games Table
Stores all games created by authors.

**Key Features:**
- Unique shareable game codes (e.g., "ABC123")
- Supports two game types: `fill-in-blank` and `frame-the-word`
- Tracks game statistics (players, success rate, difficulty)
- Auto-calculates difficulty rating based on player performance

**Game Lifecycle:**
- `active` - Game is playable
- `completed` - Game has ended
- `archived` - Game is no longer visible

### 3. Game Attempts Table
Records every guess made by players.

**Key Features:**
- Tracks individual attempts (up to 3 per player per game)
- Records whether guess was correct
- Stores points earned for each attempt
- Prevents duplicate attempts via unique constraint

### 4. Game Sessions Table
Tracks complete player sessions for each game.

**Key Features:**
- One session per player per game
- Tracks session status: `in_progress`, `won`, `lost`
- Aggregates total attempts and points earned
- Records start and completion timestamps

### 5. Leaderboard Cache Table
Cached leaderboard data for performance optimization.

**Key Features:**
- Separate rankings for players and authors
- Pre-calculated statistics for fast queries
- Updated periodically via background jobs
- Includes rank, points, and relevant stats

### 6. Waitlist Table
Stores users interested in being notified at launch.

**Key Features:**
- Accepts email or Farcaster ID (or both)
- Tracks notification status
- Records referral source for analytics
- Timestamps for join and notification dates

### 7. Game Shares Table
Tracks social sharing and viral growth.

**Key Features:**
- Records share platform (Farcaster, Twitter, etc.)
- Tracks clicks and conversions
- Links shares to games and users
- Useful for analytics and growth metrics

## Database Functions

### `generate_game_code()`
Generates unique 6-character alphanumeric game codes.
- Ensures uniqueness by checking existing codes
- Regenerates if collision detected

### `create_game()`
Creates a new game with all required fields.
- Automatically generates game code
- Returns the shareable game code

### `submit_guess()`
Handles player guess submission with full game logic.
- Creates or updates game session
- Records attempt in game_attempts table
- Calculates points based on attempt number
- Updates session status (won/lost/in_progress)
- Returns JSON with result details

## Triggers

### `trigger_update_user_stats_after_game`
Automatically updates author statistics when a game is completed.
- Increments `total_games_created`
- Adds author points (5 points per failed guess)

### `trigger_update_game_stats_after_session`
Updates game statistics when a player completes a session.
- Increments player count
- Updates success/failure counts
- Recalculates average attempts
- Updates difficulty rating
- Updates player's total points and games played

## Views

### `v_player_leaderboard`
Pre-joined view for player leaderboard queries.
- Includes rank, points, games played
- Calculates success rate and average attempts
- Ordered by total points earned

### `v_author_leaderboard`
Pre-joined view for author leaderboard queries.
- Includes rank, points, games created
- Shows total players attracted
- Displays average difficulty rating

### `v_game_details`
Comprehensive game information with author details.
- Joins games with user information
- Includes winner/loser counts
- Useful for game detail pages

## Points System

### Player Points
- **First attempt correct:** 15 points + 5 bonus = 20 points
- **Second attempt correct:** 10 points
- **Third attempt correct:** 5 points
- **Failed (3 wrong attempts):** 0 points

### Author Points
- **Per failed player:** 5 points
- Authors earn points when players fail to guess their word
- Incentivizes creating challenging but fair games

## Usage Examples

### Creating a Game
\`\`\`sql
SELECT create_game(
  'user-uuid-here',
  'fill-in-blank',
  'The quick brown fox jumps over the lazy dog.',
  'fox'
);
-- Returns: 'ABC123'
\`\`\`

### Submitting a Guess
\`\`\`sql
SELECT submit_guess(
  'game-uuid-here',
  'player-uuid-here',
  'fox'
);
-- Returns: {"is_correct": true, "attempt_number": 1, "points_earned": 15, "session_status": "won"}
\`\`\`

### Getting Player Leaderboard
\`\`\`sql
SELECT * FROM v_player_leaderboard LIMIT 10;
\`\`\`

### Getting Author Leaderboard
\`\`\`sql
SELECT * FROM v_author_leaderboard LIMIT 10;
\`\`\`

## Integration with Frontend

The database schema aligns with the CLI-based frontend:

1. **User Creation:** When users join waitlist or play first game
2. **Game Creation:** Via `create` and `write` commands
3. **Game Playing:** Via `play` and `guess` commands
4. **Leaderboards:** Via `leaderboard` command
5. **Game Results:** Via `reveal` command

## Performance Considerations

- **Indexes:** Strategic indexes on frequently queried columns
- **Views:** Pre-joined views for complex queries
- **Triggers:** Automatic stat updates reduce application logic
- **Cache Table:** Leaderboard cache for fast queries
- **Constraints:** Database-level validation ensures data integrity

## Future Enhancements

Potential additions to the schema:
- **Achievements table:** Track player milestones
- **Daily challenges:** Special featured games
- **User relationships:** Friends/followers system
- **Game collections:** Curated game sets
- **Comments/reactions:** Social engagement features

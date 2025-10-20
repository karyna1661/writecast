"use server"

import { createClient } from "@/lib/supabase/server"
import type { GameMode } from "@/lib/game-state"

// ============================================================================
// TYPES
// ============================================================================

export interface Game {
  id: string
  game_code: string
  author_id: string
  game_type: GameMode
  masterpiece_text: string
  hidden_word: string
  status: string
  total_players: number
  successful_guesses: number
  failed_guesses: number
  created_at: string
}

export interface GameSession {
  id: string
  game_id: string
  player_id: string
  status: "in_progress" | "won" | "lost"
  total_attempts: number
  points_earned: number
  started_at: string
  completed_at: string | null
}

export interface GuessResult {
  is_correct: boolean
  attempt_number: number
  points_earned: number
  session_status: "in_progress" | "won" | "lost"
  error?: string
}

export interface LeaderboardEntry {
  id: string
  farcaster_username: string | null
  display_name: string | null
  total_points_earned?: number
  total_points_as_author?: number
  total_games_played?: number
  total_games_created?: number
  rank: number
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function getOrCreateUser(userInfo: string | { userId: string; username?: string; displayName?: string } = "demo_player") {
  const supabase = await createClient()

  // Parse userInfo to extract Farcaster data
  let farcasterUsername = "demo_player"
  let farcasterId = "demo_player"
  let displayName = "Demo Player"

  if (typeof userInfo === "object" && userInfo.userId) {
    // New format with user info object
    if (userInfo.userId.startsWith("farcaster_")) {
      const fid = userInfo.userId.replace("farcaster_", "")
      farcasterId = fid
      farcasterUsername = userInfo.username || `user_${fid}`
      displayName = userInfo.displayName || `User ${fid}`
    } else if (userInfo.userId === "anonymous_user") {
      farcasterUsername = "anonymous"
      displayName = "Anonymous"
      farcasterId = `anon_${Date.now()}`
    }
  } else if (typeof userInfo === "string") {
    // Legacy string format
    if (userInfo.startsWith("farcaster_")) {
      const fid = userInfo.replace("farcaster_", "")
      farcasterId = fid
      farcasterUsername = `user_${fid}`
      displayName = `User ${fid}`
    } else if (userInfo === "demo_player") {
      farcasterUsername = "demo_player"
      displayName = "Demo Player"
      farcasterId = `demo_${Date.now()}`
    } else {
      farcasterUsername = "anonymous"
      displayName = "Anonymous"
      farcasterId = `anon_${Date.now()}`
    }
  }

  // Try to find existing user by farcaster_id
  const { data: existingUser } = await supabase.from("users").select("*").eq("farcaster_id", farcasterId).single()

  if (existingUser) {
    return { data: existingUser, error: null }
  }

  // Create new user
  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      farcaster_username: farcasterUsername,
      display_name: displayName,
      farcaster_id: farcasterId,
    })
    .select()
    .single()

  return { data: newUser, error }
}

// ============================================================================
// GAME OPERATIONS
// ============================================================================

export async function getGameByCode(code: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("game_code", code.toUpperCase())
    .eq("status", "active")
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Game, error: null }
}

export async function getAllGames() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Game[], error: null }
}

export async function createGame(authorId: string, gameType: GameMode, masterpieceText: string, hiddenWord: string) {
  const supabase = await createClient()

  // Call the database function to generate a unique code
  const { data, error } = await supabase.rpc("create_game", {
    p_author_id: authorId,
    p_game_type: gameType,
    p_masterpiece_text: masterpieceText,
    p_hidden_word: hiddenWord,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  // Return the generated game code
  return { data: data as string, error: null }
}

// ============================================================================
// PLAYER OPERATIONS
// ============================================================================

export async function getGameSession(gameId: string, playerId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "not found" which is okay
    return { data: null, error: error.message }
  }

  return { data: data as GameSession | null, error: null }
}

export async function submitGuess(gameId: string, playerId: string, guess: string) {
  const supabase = await createClient()

  // Call the database function to handle the guess logic
  const { data, error } = await supabase.rpc("submit_guess", {
    p_game_id: gameId,
    p_player_id: playerId,
    p_guess: guess,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as GuessResult, error: null }
}

export async function getGameAttempts(gameId: string, playerId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("game_attempts")
    .select("*")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .order("attempt_number", { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

// ============================================================================
// LEADERBOARD OPERATIONS
// ============================================================================

export async function getPlayerLeaderboard(limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, farcaster_username, display_name, total_points_earned, total_games_played")
    .gt("total_games_played", 0)
    .order("total_points_earned", { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error: error.message }
  }

  // Add rank
  const rankedData = data.map((user, index) => ({
    ...user,
    rank: index + 1,
  }))

  return { data: rankedData as LeaderboardEntry[], error: null }
}

export async function getAuthorLeaderboard(limit = 10) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, farcaster_username, display_name, total_points_as_author, total_games_created")
    .gt("total_games_created", 0)
    .order("total_points_as_author", { ascending: false })
    .limit(limit)

  if (error) {
    return { data: null, error: error.message }
  }

  // Add rank
  const rankedData = data.map((user, index) => ({
    ...user,
    rank: index + 1,
  }))

  return { data: rankedData as LeaderboardEntry[], error: null }
}

// ============================================================================
// REVEAL OPERATIONS
// ============================================================================

export async function revealGame(gameCode: string) {
  const supabase = await createClient()

  // Get game with full details including hidden word
  const { data, error } = await supabase.from("games").select("*").eq("game_code", gameCode.toUpperCase()).single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Game, error: null }
}

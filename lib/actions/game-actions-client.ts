"use client"

import { createClient } from "@/lib/supabase/client"
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
  total_attempts: number
  created_at: string
  expires_at?: string
}

export interface GameSession {
  id: string
  game_id: string
  player_id: string
  status: "playing" | "won" | "lost"
  total_attempts: number
  points_earned: number
  created_at: string
  updated_at: string
}

export interface GameAttempt {
  id: string
  game_id: string
  player_id: string
  guess: string
  is_correct: boolean
  attempt_number: number
  created_at: string
}

export interface User {
  id: string
  farcaster_username: string
  display_name: string
  farcaster_id: string
  total_points_earned: number
  total_games_played: number
  total_games_won: number
  total_games_created: number
  total_points_as_author: number
  created_at: string
}

export interface LeaderboardEntry {
  farcaster_username: string
  display_name: string
  total_points_earned: number
  total_games_played?: number
  total_games_created?: number
  rank: number
}

// ============================================================================
// USER OPERATIONS
// ============================================================================

export async function getOrCreateUser(userInfo: string | { userId: string; username?: string; displayName?: string } = "demo_player") {
  const supabase = createClient()

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
  const supabase = createClient()

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

export async function getAllGames(playerId?: string) {
  const supabase = createClient()

  if (!playerId) {
    // Return all games if no player specified (for admin/debug purposes)
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

  // Get available games for specific player (excludes completed and author-created)
  const { data, error } = await supabase
    .rpc("get_available_games", { p_player_id: playerId })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as Game[], error: null }
}

export async function getAvailableGames(playerId: string) {
  // This function is not implemented yet
  return { data: null, error: "Function not implemented" }
}

export async function canPlayGame(gameId: string, playerId: string) {
  const supabase = createClient()

  // Check if game exists and is active
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, author_id")
    .eq("id", gameId)
    .eq("status", "active")
    .single()

  if (gameError || !game) {
    return { canPlay: false, reason: "Game not found or inactive" }
  }

  // Check if player is the author
  if (game.author_id === playerId) {
    return { canPlay: false, reason: "You created this game" }
  }

  // Check if player has completed this game
  const { data: session } = await supabase
    .from("game_sessions")
    .select("status")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .single()

  if (session && session.status === "won") {
    return { canPlay: false, reason: "You already completed this game" }
  }

  if (session && session.status === "lost") {
    return { canPlay: false, reason: "You already completed this game" }
  }

  return { canPlay: true, reason: null }
}

export async function createGame(authorId: string, gameType: GameMode, masterpieceText: string, hiddenWord: string) {
  const supabase = createClient()

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
  const supabase = createClient()

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
  const supabase = createClient()

  const { data, error } = await supabase.rpc("submit_guess", {
    p_game_id: gameId,
    p_player_id: playerId,
    p_guess: guess,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data, error: null }
}

export async function getGameAttempts(gameId: string, playerId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("game_attempts")
    .select("*")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .order("attempt_number", { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as GameAttempt[], error: null }
}

// ============================================================================
// INVITE OPERATIONS
// ============================================================================

export async function useGameInvite(gameId: string, playerId: string, invitedUsername: string) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("use_game_invite", {
    p_game_id: gameId,
    p_player_id: playerId,
    p_invited_username: invitedUsername,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data, error: null }
}

export async function acceptGameInvite(inviteId: string, invitedPlayerId: string) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("accept_game_invite", {
    p_invite_id: inviteId,
    p_invited_player_id: invitedPlayerId,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data, error: null }
}

export async function getGameInviteStatus(gameId: string, playerId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("game_invites")
    .select("*")
    .eq("game_id", gameId)
    .eq("inviter_player_id", playerId)
    .single()

  if (error && error.code !== "PGRST116") {
    return { data: null, error: error.message }
  }

  return { data: data, error: null }
}

export async function getPlayerGameSession(gameId: string, playerId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("game_sessions")
    .select("*")
    .eq("game_id", gameId)
    .eq("player_id", playerId)
    .single()

  if (error && error.code !== "PGRST116") {
    return { data: null, error: error.message }
  }

  return { data: data, error: null }
}

export async function getPlayerStats(username: string) {
  const supabase = createClient()

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("farcaster_username", username)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: user, error: null }
}

// ============================================================================
// LEADERBOARD OPERATIONS
// ============================================================================

export async function getPlayerLeaderboard(limit: number = 10) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_player_leaderboard", {
    p_limit: limit,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as LeaderboardEntry[], error: null }
}

export async function getAuthorLeaderboard(limit: number = 10) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("get_author_leaderboard", {
    p_limit: limit,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as LeaderboardEntry[], error: null }
}

// ============================================================================
// GAME REVEAL OPERATIONS
// ============================================================================

export async function revealGame(gameCode: string) {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("reveal_game", {
    p_game_code: gameCode,
  })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data, error: null }
}

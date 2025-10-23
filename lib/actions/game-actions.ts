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
  total_attempts: number
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
  max_attempts?: number
  can_invite?: boolean
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
      farcasterId = "anonymous_user"  // ← FIXED: Use stable ID
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
      farcasterId = "demo_player"  // ← FIXED: Use stable ID
    } else {
      farcasterUsername = "anonymous"
      displayName = "Anonymous"
      farcasterId = "anonymous_user"  // ← FIXED: Use stable ID
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

export async function getAllGames(playerId?: string) {
  const supabase = await createClient()

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
  return getAllGames(playerId)
}

export async function canPlayGame(gameId: string, playerId: string) {
  const supabase = await createClient()

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

  return { data: data, error: null }
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

// ============================================================================
// INVITE SYSTEM FUNCTIONS
// ============================================================================

export async function useGameInvite(gameId: string, playerId: string, invitedUsername: string) {
  const supabase = await createClient()

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
  const supabase = await createClient()

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
  const supabase = await createClient()

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
  const supabase = await createClient()

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
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('farcaster_username', username)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: user, error: null }
}

// ============================================================================
// SHARE & INVITE TRACKING FUNCTIONS
// ============================================================================

export async function recordGameShare(gameId: string, userId?: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("game_shares")
    .insert({
      game_id: gameId,
      shared_by_user_id: userId || null,
      share_platform: "farcaster",
      share_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://writecast-1.vercel.app"}/api/game/embed/${gameId}`
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createGameInvite(gameId: string, inviterUserId: string, friendHandle: string) {
  const supabase = await createClient()

  // Check if inviter already has an invite for this game
  const { data: existingInvite } = await supabase
    .from("game_invites")
    .select("*")
    .eq("game_id", gameId)
    .eq("inviter_player_id", inviterUserId)
    .single()

  if (existingInvite) {
    return { data: null, error: "You have already invited someone for this game" }
  }

  // Create invite record
  const { data: invite, error } = await supabase
    .from("game_invites")
    .insert({
      game_id: gameId,
      inviter_player_id: inviterUserId,
      invited_username: friendHandle.replace('@', ''),
      status: 'pending'
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // Grant +1 attempt to inviter immediately
  const { error: sessionError } = await supabase
    .from("game_sessions")
    .upsert({
      game_id: gameId,
      player_id: inviterUserId,
      status: 'in_progress',
      has_used_invite: true,
      bonus_attempts: 1,
      invite_id: invite.id
    }, {
      onConflict: 'game_id,player_id'
    })

  if (sessionError) {
    console.error("Failed to grant bonus attempt:", sessionError)
    // Don't fail the request if this fails
  }

  return { data: invite, error: null }
}

export async function awardInviteBonus(inviteId: string) {
  const supabase = await createClient()

  // Get invite details
  const { data: invite, error: inviteError } = await supabase
    .from("game_invites")
    .select("*")
    .eq("id", inviteId)
    .eq("status", "accepted")
    .single()

  if (inviteError || !invite) {
    return { data: null, error: "Invite not found or not accepted" }
  }

  // Award bonus points to inviter
  const { error: pointsError } = await supabase
    .from("users")
    .update({
      total_points_earned: supabase.sql`total_points_earned + 2`,
      updated_at: new Date().toISOString()
    })
    .eq("id", invite.inviter_player_id)

  if (pointsError) {
    return { data: null, error: pointsError.message }
  }

  // Update invite to completed
  const { error: updateError } = await supabase
    .from("game_invites")
    .update({
      status: 'completed',
      inviter_earned_points: 2,
      completed_at: new Date().toISOString()
    })
    .eq("id", inviteId)

  if (updateError) {
    return { data: null, error: updateError.message }
  }

  return { data: { pointsAwarded: 2 }, error: null }
}
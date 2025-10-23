"use client"

import { createClient } from "@/lib/supabase/client"

export interface GameSessionData {
  attemptsRemaining: number
  bonusAttempts: number
  hasUsedInvite: boolean
  totalAttempts: number
  sessionStatus: "in_progress" | "won" | "lost"
}

/**
 * Syncs game session data from the server to get accurate attempt counts
 * including bonus attempts and invite status
 */
export async function syncGameSession(
  gameId: string, 
  userId: string
): Promise<GameSessionData | null> {
  try {
    const supabase = createClient()
    
    // Get the game first
    const { data: game, error: gameError } = await supabase
      .from("games")
      .select("id")
      .eq("game_code", gameId.toUpperCase())
      .single()
    
    if (gameError || !game) {
      console.error("Game not found:", gameError)
      return null
    }
    
    // Get the user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("farcaster_id", userId.replace("farcaster_", ""))
      .single()
    
    if (userError || !user) {
      console.error("User not found:", userError)
      return null
    }
    
    // Get the game session with bonus attempts
    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .select("total_attempts, bonus_attempts, has_used_invite, status")
      .eq("game_id", game.id)
      .eq("player_id", user.id)
      .single()
    
    if (sessionError) {
      console.error("Session not found:", sessionError)
      return null
    }
    
    // Calculate attempts remaining
    const baseAttempts = 3
    const totalAllowedAttempts = baseAttempts + (session.bonus_attempts || 0)
    const attemptsRemaining = Math.max(0, totalAllowedAttempts - session.total_attempts)
    
    return {
      attemptsRemaining,
      bonusAttempts: session.bonus_attempts || 0,
      hasUsedInvite: session.has_used_invite || false,
      totalAttempts: session.total_attempts,
      sessionStatus: session.status as "in_progress" | "won" | "lost"
    }
  } catch (error) {
    console.error("Failed to sync game session:", error)
    return null
  }
}

/**
 * Debounced version of syncGameSession to prevent excessive API calls
 */
export function createDebouncedSync(delay: number = 1000) {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (gameId: string, userId: string, callback: (data: GameSessionData | null) => void) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(async () => {
      const data = await syncGameSession(gameId, userId)
      callback(data)
    }, delay)
  }
}

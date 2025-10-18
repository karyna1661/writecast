import { farcasterSDK, isFarcasterAvailable } from "./sdk-client"
import type { FarcasterUser } from "./types"

export async function signInWithFarcaster(): Promise<FarcasterUser | null> {
  try {
    if (!isFarcasterAvailable()) {
      throw new Error("Farcaster SDK not available")
    }

    await farcasterSDK.actions.signIn()
    
    // Get token after sign in
    const tokenResult = await farcasterSDK.quickAuth.getToken()
    const token = tokenResult?.token || null
    
    if (!token) {
      return null
    }

    // TODO: Decode JWT token to get actual user info
    // For now, return mock user data
    const user: FarcasterUser = {
      fid: 12345,
      username: "writecast_user",
      displayName: "Writecast User",
    }

    return user
  } catch (error) {
    console.error("Sign in failed:", error)
    throw error
  }
}

export async function getFarcasterToken(): Promise<string | null> {
  try {
    if (!isFarcasterAvailable()) return null
    
    const tokenResult = await farcasterSDK.quickAuth.getToken()
    return tokenResult?.token || null
  } catch (error) {
    console.error("Failed to get token:", error)
    return null
  }
}

export function createFarcasterUser(fid: number, username: string, displayName: string): FarcasterUser {
  return {
    fid,
    username,
    displayName,
  }
}

export function formatFarcasterUsername(username: string): string {
  // Remove @ if present
  return username.startsWith("@") ? username.slice(1) : username
}

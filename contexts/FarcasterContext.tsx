"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { farcasterSDK, isFarcasterAvailable, waitForFarcasterSDKReady } from "@/lib/farcaster/sdk-client"
import { sdk } from "@farcaster/miniapp-sdk"
import type { AuthState, FarcasterUser } from "@/lib/farcaster/types"

interface FarcasterContextType {
  auth: AuthState
  login: () => Promise<void>
  logout: () => void
  getToken: () => Promise<string | null>
  shareGame: (gameCode: string, template: "created" | "won" | "invite") => Promise<void>
  inviteUser: (username: string) => Promise<void>
  viewProfile: (username: string) => Promise<void>
  signalReady: () => Promise<void>
  hapticFeedback: {
    success: () => Promise<void>
    error: () => Promise<void>
    warning: () => Promise<void>
    light: () => Promise<void>
    medium: () => Promise<void>
    heavy: () => Promise<void>
  }
  isAvailable: boolean
}

const FarcasterContext = createContext<FarcasterContextType | null>(null)

// Heuristic detection to infer Farcaster environment early (pre-bridge)
function detectMiniAppEnv(): boolean {
  try {
    if (typeof window === "undefined") return false
    const ua = navigator.userAgent.toLowerCase()
    const inIframe = window.self !== window.top
    const hasBridge = typeof (window as any).MiniApp !== "undefined" || typeof (window as any).farcaster !== "undefined"
    const referrer = (document?.referrer || "").toLowerCase()
    // If bridge is present OR UA/referrer points to Farcaster OR running in an iframe with Farcaster referrer
    return (
      hasBridge ||
      ua.includes("farcaster") ||
      (inIframe && referrer.includes("farcaster"))
    )
  } catch {
    return false
  }
}

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  })

  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    console.log("FarcasterContext: Starting initialization")
    console.log("FarcasterContext: User agent:", navigator.userAgent)
    console.log("FarcasterContext: SDK object:", typeof sdk !== "undefined" ? "exists" : "undefined")

    // Set availability early based on heuristics to avoid guest UI in Farcaster
    const presumedEnv = detectMiniAppEnv()
    if (presumedEnv) {
      console.log("FarcasterContext: Heuristically detected Farcaster environment")
      setIsAvailable(true)
    }

    const initSDK = async () => {
      try {
        // wait for bridge with timeout but do not block UI forever
        const available = await waitForFarcasterSDKReady({ timeoutMs: 12000, pollMs: 150, allowTimeoutResolve: true })
        console.log("FarcasterContext: SDK available?", available)
        // Keep availability true if we already presumed Farcaster
        setIsAvailable(available || presumedEnv)

        if (!available) {
          console.log("FarcasterContext: SDK not available initially - waiting for context before fallback")
          // Keep loading and poll for context up to 10s so we don't flash guest
          setAuth(prev => ({ ...prev, isLoading: true }))

          let resolved = false
          await new Promise<void>((resolve) => {
            const intervalId = setInterval(async () => {
              try {
                if ((sdk as any)?.context) {
                  const context = await Promise.race([
                    (sdk as any).context,
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Context fetch timeout')), 3000))
                  ])
                  if (context?.user) {
                    resolved = true
                    const user: FarcasterUser = {
                      fid: context.user.fid,
                      username: context.user.username || `user-${context.user.fid}`,
                      displayName: context.user.displayName || context.user.username || `user-${context.user.fid}`,
                    }
                    setAuth({ isAuthenticated: true, user, token: null, isLoading: false })
                    clearInterval(intervalId)
                    clearTimeout(timeoutId)
                    resolve()
                  }
                }
              } catch {}
            }, 200)
            const timeoutId = setTimeout(() => {
              if (!resolved) {
                clearInterval(intervalId)
                resolve()
              }
            }, 10000)
          })

          if (!resolved) {
            // End loading without forcing guest; UI should avoid guest copy when in Farcaster
            setAuth(prev => ({ ...prev, isLoading: false }))
          }
          return
        }

        console.log("FarcasterContext: SDK detected - initializing and fetching context")

        setTimeout(async () => {
          try {
            console.log("FarcasterContext: Background SDK initialization...")
            console.log("FarcasterContext: Attempting to fetch SDK context...")
            const context = await Promise.race([
              (sdk as any).context,
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Context fetch timeout')), 5000)
              )
            ])
            console.log("FarcasterContext: SDK context fetched successfully:", context)

            if (context?.user) {
              const user: FarcasterUser = {
                fid: context.user.fid,
                username: context.user.username || `user-${context.user.fid}`,
                displayName: context.user.displayName || context.user.username || `user-${context.user.fid}`,
              }

              setAuth(prev => ({
                ...prev,
                isAuthenticated: true,
                user,
                token: null,
                isLoading: false,
              }))
              console.log("FarcasterContext: Background authentication successful:", user.username)
            }
          } catch (error) {
            console.log("FarcasterContext: Background SDK initialization failed - continuing as guest")
            console.log("FarcasterContext: Error details:", error)
            setAuth(prev => ({ ...prev, isLoading: false }))
          }
        }, 100)

      } catch (error) {
        console.error("FarcasterContext: SDK initialization failed:", error)
        setAuth(prev => ({ ...prev, isLoading: false }))
      }
    }

    initSDK()

    const safetyTimeout = setTimeout(() => {
      setAuth(prev => {
        if (prev.isLoading) {
          console.warn("FarcasterContext: Safety timeout - ending loading without guest")
          return { ...prev, isLoading: false }
        }
        return prev
      })
    }, 10000)

    return () => clearTimeout(safetyTimeout)
  }, [])

  const login = async () => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true }))

      if (!isFarcasterAvailable()) {
        throw new Error("Farcaster SDK not available")
      }

      await farcasterSDK.actions.signIn()

      const tokenResult = await farcasterSDK.quickAuth.getToken()
      const token = tokenResult?.token || null

      if (token) {
        const mockUser: FarcasterUser = {
          fid: 12345,
          username: "writecast_user",
          displayName: "Writecast User",
        }

        setAuth({
          isAuthenticated: true,
          user: mockUser,
          token,
          isLoading: false,
        })
      } else {
        setAuth(prev => ({ ...prev, isLoading: false }))
      }
    } catch (error) {
      console.error("Login failed:", error)
      setAuth(prev => ({ ...prev, isLoading: false }))
    }
  }

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    })
  }

  const getToken = async (): Promise<string | null> => {
    try {
      if (!isFarcasterAvailable()) return null

      const result = await farcasterSDK.quickAuth.getToken()
      return result?.token || null
    } catch (error) {
      console.error("Failed to get token:", error)
      return null
    }
  }

  const shareGame = async (gameCode: string, template: "created" | "won" | "invite", options?: any) => {
    try {
      if (!isFarcasterAvailable()) {
        throw new Error("Farcaster SDK not available")
      }

      if (typeof window !== 'undefined') {
        const stateToStore = {
          gameCode,
          template,
          timestamp: Date.now()
        }
        sessionStorage.setItem('farcaster_composer_state', JSON.stringify(stateToStore))
      }

      let text = ""
      let embedUrl = ""

      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://writecast-1.vercel.app"
        const userId = auth.user ? `farcaster_${auth.user.fid}` : undefined

        const response = await fetch(`${baseUrl}/api/game/share`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gameId: gameCode,
            userId: userId
          })
        })

        if (response.ok) {
          const shareData = await response.json()
          embedUrl = shareData.shareUrl

          const gameMetadata = shareData

          switch (template) {
            case "created":
              const gameMode = gameMetadata.gameMode === "fill-blank" ? "Fill-in-Blank" : "Frame-the-Word"
              text = `🎮 I just created a ${gameMode} word game on Writecast!

Game Code: ${gameCode}
Can you guess my hidden word?

Click "Play Now" to start! 🤔`
              break
            case "won":
              text = `🎉 I just won a word game on Writecast!\n\nGame: ${gameCode}\nPlay it yourself and see if you can beat my score! 🏆`
              break
            case "invite":
              text = options?.text || `🎮 Join me in this word game!\n\nGame: ${gameCode}\nLet's see who can solve it first!`
              break
          }
        } else {
          throw new Error("Failed to get share URL from backend")
        }
      } catch (error) {
        console.warn("Could not fetch share URL from backend:", error)
        const miniAppUrl = "https://farcaster.xyz/miniapps/lgcZHUGhSVly/writecast"
        embedUrl = `${miniAppUrl}?code=${gameCode}`

        switch (template) {
          case "created":
            text = `🎮 I just created a word game on Writecast!

Game Code: ${gameCode}
Can you guess my hidden word?

Click "Play Now" to start! 🤔`
            break
          case "won":
            text = `🎉 I just won a word game on Writecast!\n\nGame: ${gameCode}\nPlay it yourself and see if you can beat my score! 🏆`
            break
          case "invite":
            text = options?.text || `🎮 Join me in this word game!\n\nGame: ${gameCode}\nLet's see who can solve it first!`
            break
        }
      }

      console.log("composeCast called with:", { text, embedUrl, options })

      await farcasterSDK.actions.composeCast(text, {
        embeds: options?.embeds || [embedUrl],
        ...options
      })

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('farcaster_composer_state')
      }
    } catch (error) {
      console.error("Failed to share game:", error)
      throw error
    }
  }

  const inviteUser = async (username: string) => {
    try {
      if (!isFarcasterAvailable()) {
        throw new Error("Farcaster SDK not available")
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://writecast-1.vercel.app"

      await farcasterSDK.actions.openMiniApp(appUrl)
    } catch (error) {
      console.error("Failed to invite user:", error)
      throw error
    }
  }

  const viewProfile = async (username: string) => {
    try {
      if (!isFarcasterAvailable()) {
        throw new Error("Farcaster SDK not available")
      }

      await farcasterSDK.actions.viewProfile(username)
    } catch (error) {
      console.error("Failed to view profile:", error)
      throw error
    }
  }

  const signalReady = async () => {
    try {
      const available = await waitForFarcasterSDKReady({ timeoutMs: 12000, pollMs: 150, allowTimeoutResolve: false })
      if (!available) {
        console.warn("signalReady: SDK not available after waiting; skipping ready signal")
        return
      }

      console.log("Signaling SDK ready...")
      console.log("SDK object:", sdk)
      console.log("SDK actions:", (sdk as any).actions)

      await (sdk as any).actions.ready()
      console.log("SDK ready signal completed successfully")
    } catch (error) {
      console.error("Failed to signal SDK ready:", error)
    }
  }


  const hapticFeedback = {
    success: async () => {
      try {
        if (!isFarcasterAvailable()) return
        await farcasterSDK.haptics.notificationOccurred("success")
      } catch (error) {
        console.error("Haptic feedback failed:", error)
      }
    },
    error: async () => {
      try {
        if (!isFarcasterAvailable()) return
        await farcasterSDK.haptics.notificationOccurred("error")
      } catch (error) {
        console.error("Haptic feedback failed:", error)
      }
    },
    warning: async () => {
      try {
        if (!isFarcasterAvailable()) return
        await farcasterSDK.haptics.notificationOccurred("warning")
      } catch (error) {
        console.error("Haptic feedback failed:", error)
      }
    },
    light: async () => {
      try {
        if (!isFarcasterAvailable()) return
        await farcasterSDK.haptics.impactOccurred("light")
      } catch (error) {
        console.error("Haptic feedback failed:", error)
      }
    },
    medium: async () => {
      try {
        if (!isFarcasterAvailable()) return
        await farcasterSDK.haptics.impactOccurred("medium")
      } catch (error) {
        console.error("Haptic feedback failed:", error)
      }
    },
    heavy: async () => {
      try {
        if (!isFarcasterAvailable()) return
        await farcasterSDK.haptics.impactOccurred("heavy")
      } catch (error) {
        console.error("Haptic feedback failed:", error)
      }
    },
  }

  const value: FarcasterContextType = {
    auth,
    login,
    logout,
    getToken,
    shareGame,
    inviteUser,
    viewProfile,
    signalReady,
    hapticFeedback,
    isAvailable,
  }

  return <FarcasterContext.Provider value={value}>{children}</FarcasterContext.Provider>
}

export function useFarcaster() {
  const context = useContext(FarcasterContext)
  if (!context) {
    throw new Error("useFarcaster must be used within a FarcasterProvider")
  }
  return context
}

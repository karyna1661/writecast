"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { farcasterSDK, isFarcasterAvailable } from "@/lib/farcaster/sdk-client"
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

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  })

  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    const initSDK = async () => {
      try {
        const available = isFarcasterAvailable()
        setIsAvailable(available)
        
        if (available) {
          try {
            // CRITICAL: Signal to Farcaster that the Mini App is ready
            await farcasterSDK.actions.ready()
            console.log("Farcaster Mini App ready!")
            
            // AUTOMATICALLY get user context from Farcaster
            try {
              // Try to get user context from SDK first (most efficient)
              const context = await sdk.context
              console.log("SDK context:", context)
              
              if (context?.user) {
                const user: FarcasterUser = {
                  fid: context.user.fid,
                  username: context.user.username || `user-${context.user.fid}`,
                  displayName: context.user.displayName || context.user.username || `user-${context.user.fid}`,
                }
                
                setAuth({
                  isAuthenticated: true,
                  user,
                  token: null, // Token can be fetched later if needed
                  isLoading: false,
                })
                console.log("Auto-authenticated user:", user.username)
              } else {
                console.log("No user context found, staying as guest")
                setAuth(prev => ({ ...prev, isLoading: false }))
              }
            } catch (contextError) {
              console.warn("Could not get user context:", contextError)
              setAuth(prev => ({ ...prev, isLoading: false }))
            }
          } catch (readyError) {
            console.warn("Failed to signal ready to Farcaster:", readyError)
            setAuth(prev => ({ ...prev, isLoading: false }))
          }
        } else {
          console.log("Farcaster SDK not available - running in standalone mode")
          setAuth(prev => ({ ...prev, isLoading: false }))
        }
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error)
        setAuth(prev => ({ ...prev, isLoading: false }))
      }
    }

    // Add a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.warn("SDK initialization timeout - proceeding without Farcaster")
      setAuth(prev => ({ ...prev, isLoading: false }))
    }, 3000) // Reduced timeout to 3 seconds

    initSDK().finally(() => {
      clearTimeout(timeout)
    })
  }, [])

  const login = async () => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true }))
      
      if (!isFarcasterAvailable()) {
        throw new Error("Farcaster SDK not available")
      }

      await farcasterSDK.actions.signIn()
      
      // Get token after sign in
      const tokenResult = await farcasterSDK.quickAuth.getToken()
      const token = tokenResult?.token || null
      
      if (token) {
        // TODO: Decode token to get user info
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

  const shareGame = async (gameCode: string, template: "created" | "won" | "invite") => {
    try {
      if (!isFarcasterAvailable()) {
        throw new Error("Farcaster SDK not available")
      }

      let text = ""
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://writecast-1.vercel.app"
      const playUrl = `${baseUrl}/?code=${gameCode}`
      
      switch (template) {
        case "created":
          text = `I just created a word game on Writecast! 🎮\n\nGame Code: ${gameCode}\nCan you guess my hidden word?\n\nClick Play Now to start! 🤔`
          break
        case "won":
          text = `I just won a word game on Writecast! 🎉\n\nGame: ${gameCode}\nPlay it yourself and see if you can beat my score! 🏆`
          break
        case "invite":
          text = `Join me in this word game on Writecast! 🎮\n\nGame: ${gameCode}\nLet's see who's smarter! 🧠`
          break
      }

      // Compose cast with text and embed URL for Frame
      await farcasterSDK.actions.composeCast(text, {
        embeds: [playUrl]
      })
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
      
      // Use the correct SDK method to open mini app
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

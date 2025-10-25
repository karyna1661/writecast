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
        
        if (!available) {
          console.log("Farcaster SDK not available - running in standalone mode")
          setAuth(prev => ({ ...prev, isLoading: false }))
          return
        }

        // **FAST INITIALIZATION: Skip complex SDK calls during startup**
        console.log("Farcaster SDK detected - initializing in background")
        
        // Set loading to false immediately to show UI
        setAuth(prev => ({ ...prev, isLoading: false }))
        
        // Do SDK initialization in background (non-blocking)
        setTimeout(async () => {
          try {
            console.log("Background SDK initialization...")
            
            // Try to get user context without blocking
            const context = await Promise.race([
              sdk.context,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Context fetch timeout')), 1000)
              )
            ])
            
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
              }))
              console.log("Background authentication successful:", user.username)
            }
          } catch (error) {
            console.log("Background SDK initialization failed - continuing as guest")
          }
        }, 100) // Small delay to let UI render first
        
      } catch (error) {
        console.error("SDK initialization failed:", error)
        setAuth(prev => ({ ...prev, isLoading: false }))
      }
    }

    initSDK()
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

  const shareGame = async (gameCode: string, template: "created" | "won" | "invite", options?: any) => {
    try {
      if (!isFarcasterAvailable()) {
        throw new Error("Farcaster SDK not available")
      }

      // Store current state before opening composer for faster restoration
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
      
      // Get share URL from backend API
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
          
          // Try to get game metadata for better sharing
          const gameMetadata = shareData
          
          switch (template) {
            case "created":
              const gameMode = gameMetadata.gameMode === "fill-blank" ? "Fill-in-Blank" : "Frame-the-Word"
              text = `🎮 I just created a ${gameMode} word game on Writecast!\n\nGame Code: ${gameCode}\nCan you guess my hidden word?\n\nClick "Play Now" to start! 🤔`
              break
            case "won":
              text = `🎉 I just won a word game on Writecast!\n\nGame: ${gameCode}\nPlay it yourself and see if you can beat my score! 🏆`
              break
            case "invite":
              // Use custom text/embeds from options if provided
              text = options?.text || `🎮 Join me in this word game!\n\nGame: ${gameCode}\nLet's see who can solve it first!`
              break
          }
        } else {
          throw new Error("Failed to get share URL from backend")
        }
      } catch (error) {
        console.warn("Could not fetch share URL from backend:", error)
        // Fallback to direct Mini App URL
        const miniAppUrl = "https://farcaster.xyz/miniapps/lgcZHUGhSVly/writecast"
        embedUrl = `${miniAppUrl}?code=${gameCode}`
        
        switch (template) {
          case "created":
            text = `🎮 I just created a word game on Writecast!\n\nGame Code: ${gameCode}\nCan you guess my hidden word?\n\nClick "Play Now" to start! 🤔`
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
      
      // Compose cast with text and proper embed URL
      await farcasterSDK.actions.composeCast(text, {
        embeds: options?.embeds || [embedUrl],
        ...options
      })
      
      // Clear stored state after successful compose
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

  const signalReady = async () => {
    try {
      if (!isFarcasterAvailable()) {
        console.log("Farcaster SDK not available - skipping ready signal")
        return
      }

      console.log("Signaling SDK ready...")
      console.log("SDK object:", sdk)
      console.log("SDK actions:", sdk.actions)
      
      await sdk.actions.ready()
      console.log("SDK ready signal completed successfully")
    } catch (error) {
      console.error("Failed to signal SDK ready:", error)
      console.error("Error details:", error)
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

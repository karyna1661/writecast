"use client"

import { useState, useEffect, useRef } from "react"
import { TerminalWindow } from "@/components/terminal-window"
import { TerminalHeader } from "@/components/terminal-header"
import { CliTerminal, type CliMessage } from "@/components/cli-terminal"
import { handleCommand } from "@/lib/command-handler"
import { initialGameState, type GameState } from "@/lib/game-state"
import { useFarcaster } from "@/contexts/FarcasterContext"
import { syncGameSession, createDebouncedSync } from "@/lib/actions/game-session-sync"

export default function Home() {
  const [messages, setMessages] = useState<CliMessage[]>([])
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const farcaster = useFarcaster()
  
  // Create debounced sync function
  const debouncedSync = createDebouncedSync(500)

  // Sync game session when app regains visibility (e.g., after composer closes)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && gameState.currentGameId && farcaster.auth.user) {
        console.log("App regained visibility, syncing game session...")
        
        const userId = `farcaster_${farcaster.auth.user.fid}`
        debouncedSync(gameState.currentGameId, userId, (sessionData) => {
          if (sessionData) {
            console.log("Synced session data:", sessionData)
            setGameState(prev => ({
              ...prev,
              attempts: sessionData.attemptsRemaining,
              bonusAttempts: sessionData.bonusAttempts,
              invitedFriend: sessionData.hasUsedInvite
            }))
            
            // Show sync message if state changed
            if (sessionData.bonusAttempts > 0 && !gameState.invitedFriend) {
              setMessages(prev => [...prev, {
                type: "success",
                content: `✓ Game state restored! You have ${sessionData.attemptsRemaining} attempts remaining.`,
                timestamp: Date.now()
              }])
            }
          }
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [gameState.currentGameId, farcaster.auth.user, debouncedSync, gameState.invitedFriend])

  useEffect(() => {
    // Only show welcome message after SDK is ready
    if (!farcaster.auth.isLoading) {
      const timer = setTimeout(() => {
        setMessages([
          {
            type: "output",
            content: `Welcome to WRITECAST - A CLI Word Game

${farcaster.auth.isAuthenticated 
  ? `Signed in as @${farcaster.auth.user?.username}` 
  : (farcaster.isAvailable ? 'Connecting to Farcaster…' : 'Playing as guest - Sign in to create games and share!')}

Two game modes available:
  1. FILL-IN-BLANK: Hide a word in your text, players guess it
  2. FRAME-THE-WORD: Write a piece, set a word that frames it

Type 'help' to see all commands, or try:
  • create <word> - Start a fill-in-blank game ${!farcaster.auth.isAuthenticated ? '(requires sign in)' : ''}
  • frame - Start a frame-the-word game ${!farcaster.auth.isAuthenticated ? '(requires sign in)' : ''}
  • play <gameId> - Play a game (try: ABC123, XYZ789, FRAME1)`,
            timestamp: Date.now(),
          },
        ])
      }, 500) // Small delay for dramatic effect

      return () => clearTimeout(timer)
    }
  }, [farcaster.auth.isLoading])

  // Track if auto-play has been executed to prevent double execution
  const autoPlayExecuted = useRef(false)
  const lastProcessedCode = useRef<string | null>(null)
  
  // Helper function to check and execute auto-play
  const checkAndAutoPlay = () => {
    // Don't proceed if already executed, auth is loading, or window is undefined
    if (autoPlayExecuted.current || farcaster.auth.isLoading || typeof window === 'undefined') {
      console.log("Auto-play: Skipping - executed:", autoPlayExecuted.current, "authLoading:", farcaster.auth.isLoading)
      return
    }

    // Log current URL for debugging
    const currentUrl = window.location.href
    const searchParams = window.location.search
    console.log("Auto-play: Checking URL - href:", currentUrl, "search:", searchParams)

    const params = new URLSearchParams(searchParams)
    const code = params.get('gameid') || params.get('code') // Support both gameid and code for backward compatibility
    
    // Also try parsing from hash if Farcaster uses hash-based routing
    let hashCode = null
    if (window.location.hash) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
        hashCode = hashParams.get('gameid') || hashParams.get('code')
        if (hashCode) {
          console.log("Auto-play: Found code in hash:", hashCode)
        }
      } catch (e) {
        // Hash might not be query params format
      }
    }
    
    const finalCode = code || hashCode
    
    // Only proceed if we have a code and haven't processed it yet
    if (!finalCode || finalCode === lastProcessedCode.current) {
      if (!finalCode) {
        console.log("Auto-play: No code parameter found in URL")
      } else {
        console.log("Auto-play: Code already processed:", finalCode)
      }
      return
    }
    
    console.log("Auto-play: Detected code parameter:", finalCode)
    
    // Mark as executed and track the code to prevent double execution
    autoPlayExecuted.current = true
    lastProcessedCode.current = finalCode
    
    // Get invite parameters for logging and potential bonus processing
    const invitedBy = params.get('invitedBy') || (window.location.hash ? new URLSearchParams(window.location.hash.replace('#', '')).get('invitedBy') : null)
    const invitee = params.get('invitee') || (window.location.hash ? new URLSearchParams(window.location.hash.replace('#', '')).get('invitee') : null)
    const sharer = params.get('sharer') || (window.location.hash ? new URLSearchParams(window.location.hash.replace('#', '')).get('sharer') : null)
    
    if (invitedBy && invitee) {
      console.log("Auto-play: Invite detected - invitedBy:", invitedBy, "invitee:", invitee)
    }
    if (sharer) {
      console.log("Auto-play: Share detected - sharer:", sharer)
    }
    
    // Auto-execute play command after a delay to ensure UI is ready
    setTimeout(async () => {
      console.log("Auto-play: Executing play command for:", finalCode)
      await handleCommand(`play ${finalCode}`, gameState, setGameState, addMessage, farcaster)
      
      // Note: Invite bonus is handled by game session sync when the game loads
      if (invitedBy && invitee && farcaster.auth.user) {
        console.log("Auto-play: Invite context will be processed by game session sync")
      }
    }, 1500) // Delay to ensure UI is ready
  }
  
  // Deep-link support: Auto-play game if code parameter exists
  // This runs when auth loading finishes
  useEffect(() => {
    checkAndAutoPlay()
  }, [farcaster.auth.isLoading])
  
  // Also check immediately on mount if auth is already loaded
  useEffect(() => {
    // Small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      checkAndAutoPlay()
    }, 100)
    
    return () => clearTimeout(timer)
  }, []) // Only run on mount

  // Listen for URL changes (in case Farcaster updates URL after launch)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleLocationChange = () => {
      console.log("Auto-play: URL changed, re-checking for code parameter")
      // Reset execution flag if URL changed (might be different game)
      const newParams = new URLSearchParams(window.location.search)
      const newCode = newParams.get('gameid') || newParams.get('code')
      if (newCode && newCode !== lastProcessedCode.current) {
        autoPlayExecuted.current = false
      }
      checkAndAutoPlay()
    }

    // Listen for popstate (back/forward navigation)
    window.addEventListener('popstate', handleLocationChange)
    
    // Also periodically check for URL changes (some frameworks update URL without events)
    const intervalId = setInterval(() => {
      const currentUrl = window.location.href + window.location.search
      if (currentUrl !== (window as any).__lastCheckedUrl) {
        (window as any).__lastCheckedUrl = currentUrl
        handleLocationChange()
      }
    }, 500) // Check every 500ms for first 5 seconds after mount
    
    // Clear interval after 5 seconds (should be enough time for Farcaster to set URL)
    setTimeout(() => {
      clearInterval(intervalId)
    }, 5000)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      clearInterval(intervalId)
    }
  }, [farcaster.auth.isLoading])

  const addMessage = (msg: CliMessage) => {
    setMessages((prev) => [...prev, msg])
  }

  const onCommand = async (input: string) => {
    if (input.toLowerCase() === "clear") {
      setMessages([])
      return
    }

    await handleCommand(input, gameState, setGameState, addMessage, farcaster)
  }

  // Add maximum loading timeout - prevent infinite splash screen
  useEffect(() => {
    const maxLoadingTimeout = setTimeout(() => {
      if (farcaster.auth.isLoading) {
        console.warn("Main page loading timeout - SDK initialization took too long")
        // The FarcasterContext safety timeout should handle this, but this is extra insurance
      }
    }, 6000) // 6 seconds max (1 second more than FarcasterContext timeout)
    
    return () => clearTimeout(maxLoadingTimeout)
  }, [farcaster.auth.isLoading])

  // Show loading state while SDK initializes (max 5 seconds)
  console.log("Main page: farcaster.auth.isLoading =", farcaster.auth.isLoading)
  console.log("Main page: farcaster.auth.user =", farcaster.auth.user)
  console.log("Main page: farcaster.isAvailable =", farcaster.isAvailable)
  if (farcaster.auth.isLoading) {
    console.log("Main page: Showing loading screen")
    return (
      <TerminalWindow>
        <TerminalHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-green-400">Initializing Writecast...</p>
            <p className="text-gray-500 text-sm mt-2">
              {!farcaster.isAvailable ? "Running in standalone mode" : "Connecting to Farcaster..."}
            </p>
            <p className="text-gray-600 text-xs mt-4">
              This should only take a moment...
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Debug: isLoading={farcaster.auth.isLoading.toString()}, available={farcaster.isAvailable.toString()}
            </p>
            <p className="text-gray-600 text-xs">
              User: {farcaster.auth.user?.username || 'none'}
            </p>
          </div>
        </div>
      </TerminalWindow>
    )
  }

  console.log("Main page: Rendering terminal (not loading)")
  return (
    <TerminalWindow>
      <TerminalHeader />
      <CliTerminal onCommand={onCommand} messages={messages} />
    </TerminalWindow>
  )
}


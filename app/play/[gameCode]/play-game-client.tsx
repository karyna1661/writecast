"use client"

import { useState, useEffect } from "react"
import { TerminalWindow } from "@/components/terminal-window"
import { TerminalHeader } from "@/components/terminal-header"
import { CliTerminal, type CliMessage } from "@/components/cli-terminal"
import { handleCommand } from "@/lib/command-handler"
import { initialGameState, type GameState } from "@/lib/game-state"
import { useFarcaster } from "@/contexts/FarcasterContext"
import { getGameByCode, type Game } from "@/lib/actions/game-actions-client"
import { terminalHaptics } from "@/lib/farcaster/haptics"
import { syncGameSession, createDebouncedSync } from "@/lib/actions/game-session-sync"

interface PlayGameClientProps {
  gameCode: string
  initialGame?: Game | null
}

export default function PlayGameClient({ gameCode, initialGame }: PlayGameClientProps) {
  const [messages, setMessages] = useState<CliMessage[]>([])
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const [isLoading, setIsLoading] = useState(!initialGame) // Skip loading if we have initial data
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
    const loadGame = async () => {
      if (!gameCode) return

      try {
        // If we have initial game data, use it immediately
        if (initialGame) {
          // Trigger haptic feedback for deep link
          await terminalHaptics.deepLinkOpened()

          // Auto-start the game with initial data
          setGameState(prev => ({
            ...prev,
            currentGame: {
              hiddenWord: initialGame.hidden_word,
              masterpiece: initialGame.masterpiece_text,
              mode: initialGame.game_type,
            },
            currentGameId: gameCode.toUpperCase(),
            step: "playing",
            attempts: 3, // Start with 3 attempts remaining
            bonusAttempts: 0,
            invitedFriend: false,
          }))

          setMessages([
            {
              type: "output",
              content: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GAME LOADED: ${gameCode.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${initialGame.game_type === "fill-blank" ? "FILL-IN-BLANK" : "FRAME-THE-WORD"} GAME

${initialGame.masterpiece_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type 'guess <word>' to make your first attempt!
You have 3 attempts to guess the hidden word.

Example: guess innovation`,
              timestamp: Date.now(),
            },
          ])
          return
        }

        // Fallback: fetch game data client-side if no initial data
        setIsLoading(true)
        
        // Trigger haptic feedback for deep link
        await terminalHaptics.deepLinkOpened()

        const { data: game, error } = await getGameByCode(gameCode.toUpperCase())

        if (error || !game) {
          setMessages([
            {
              type: "error",
              content: `Game not found: ${gameCode}

This game may have been deleted or the code is incorrect.
Type 'games' to see available games, or 'help' for commands.`,
              timestamp: Date.now(),
            },
          ])
          return
        }

        // Auto-start the game
        setGameState(prev => ({
          ...prev,
          currentGame: {
            hiddenWord: game.hidden_word,
            masterpiece: game.masterpiece_text,
            mode: game.game_type,
          },
          currentGameId: gameCode.toUpperCase(),
          step: "playing",
          attempts: 3, // Start with 3 attempts remaining
          bonusAttempts: 0,
          invitedFriend: false,
        }))

        setMessages([
          {
            type: "output",
            content: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GAME LOADED: ${gameCode.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${game.game_type === "fill-blank" ? "FILL-IN-BLANK" : "FRAME-THE-WORD"} GAME

${game.masterpiece_text}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Type 'guess <word>' to make your first attempt!
You have 3 attempts to guess the hidden word.

Example: guess innovation`,
            timestamp: Date.now(),
          },
        ])
      } catch (error) {
        setMessages([
          {
            type: "error",
            content: `Failed to load game: ${error instanceof Error ? error.message : "Unknown error"}`,
            timestamp: Date.now(),
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    loadGame()
  }, [gameCode, initialGame])

  const addMessage = (msg: CliMessage) => {
    setMessages((prev) => [...prev, msg])
  }

  const onCommand = (input: string) => {
    if (input.toLowerCase() === "clear") {
      setMessages([])
      return
    }

    handleCommand(input, gameState, setGameState, addMessage, farcaster)
  }

  if (isLoading) {
    return (
      <TerminalWindow>
        <TerminalHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-green-400 font-mono">
            Loading game {gameCode}...
          </div>
        </div>
      </TerminalWindow>
    )
  }

  return (
    <TerminalWindow>
      <TerminalHeader />
      <CliTerminal onCommand={onCommand} messages={messages} />
    </TerminalWindow>
  )
}

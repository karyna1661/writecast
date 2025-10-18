"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { TerminalWindow } from "@/components/terminal-window"
import { TerminalHeader } from "@/components/terminal-header"
import { CliTerminal, type CliMessage } from "@/components/cli-terminal"
import { handleCommand } from "@/lib/command-handler"
import { initialGameState, type GameState } from "@/lib/game-state"
import { useFarcaster } from "@/contexts/FarcasterContext"
import { getGameByCode } from "@/lib/actions/game-actions"
import { terminalHaptics } from "@/lib/farcaster/haptics"

export default function PlayGamePage() {
  const params = useParams()
  const gameCode = params.gameCode as string
  const [messages, setMessages] = useState<CliMessage[]>([])
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const [isLoading, setIsLoading] = useState(true)
  const farcaster = useFarcaster()

  useEffect(() => {
    const loadGame = async () => {
      if (!gameCode) return

      try {
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
          currentGame: game,
          currentGameId: gameCode.toUpperCase(),
          step: "playing",
          attempts: 0,
        }))

        setMessages([
          {
            type: "output",
            content: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GAME LOADED: ${gameCode.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${game.mode === "fill-blank" ? "FILL-IN-BLANK" : "FRAME-THE-WORD"} GAME

${game.masterpiece}

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
  }, [gameCode])

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

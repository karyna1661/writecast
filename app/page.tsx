"use client"

import { useState, useEffect } from "react"
import { TerminalWindow } from "@/components/terminal-window"
import { TerminalHeader } from "@/components/terminal-header"
import { CliTerminal, type CliMessage } from "@/components/cli-terminal"
import { handleCommand } from "@/lib/command-handler"
import { initialGameState, type GameState } from "@/lib/game-state"
import { useFarcaster } from "@/contexts/FarcasterContext"

export default function Home() {
  const [messages, setMessages] = useState<CliMessage[]>([])
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const farcaster = useFarcaster()

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
  : 'Playing as guest - Sign in to create games and share!'}

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

  // Show loading state while SDK initializes
  if (farcaster.auth.isLoading) {
    return (
      <TerminalWindow>
        <TerminalHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-green-400">Initializing Farcaster Mini App...</p>
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

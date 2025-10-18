"use client"

import { useState, useEffect } from "react"
import { TerminalWindow } from "@/components/terminal-window"
import { TerminalHeader } from "@/components/terminal-header"
import { CliTerminal, type CliMessage } from "@/components/cli-terminal"
import { handleCommand } from "@/lib/command-handler"
import { initialGameState, type GameState } from "@/lib/game-state"
import { useFarcaster } from "@/contexts/FarcasterContext"

export const metadata = {
  title: "Writecast - CLI Word Game",
  description: "A terminal-style word game on Farcaster. Create and play word games through CLI commands.",
  openGraph: {
    title: "Writecast - CLI Word Game",
    description: "A terminal-style word game on Farcaster. Create and play word games through CLI commands.",
    images: ["https://writecast.vercel.app/og-image.png"],
    url: "https://writecast.vercel.app",
  },
  other: {
    "fc:miniapp": "vNext",
    "fc:miniapp:version": "1.0",
    "fc:miniapp:name": "Writecast",
    "fc:miniapp:image": "https://writecast.vercel.app/og-image.png",
    "fc:miniapp:button:1": "Play Now",
    "fc:miniapp:button:1:action": "link",
    "fc:miniapp:button:1:target": "https://writecast.vercel.app",
  },
}

export default function Home() {
  const [messages, setMessages] = useState<CliMessage[]>([])
  const [gameState, setGameState] = useState<GameState>(initialGameState)
  const farcaster = useFarcaster()

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([
        {
          type: "output",
          content: `Welcome to WRITECAST - A CLI Word Game

Two game modes available:
  1. FILL-IN-BLANK: Hide a word in your text, players guess it
  2. FRAME-THE-WORD: Write a piece, set a word that frames it

Type 'help' to see all commands, or try:
  • login - Sign in with Farcaster
  • create <word> - Start a fill-in-blank game
  • frame - Start a frame-the-word game
  • play <gameId> - Play a game (try: ABC123, XYZ789, FRAME1)`,
          timestamp: Date.now(),
        },
      ])
    }, 500) // Small delay for dramatic effect

    return () => clearTimeout(timer)
  }, [])

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

  return (
    <TerminalWindow>
      <TerminalHeader />
      <CliTerminal onCommand={onCommand} messages={messages} />
    </TerminalWindow>
  )
}

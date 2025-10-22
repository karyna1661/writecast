"use client"

import { useState, useTransition } from "react"
import { TerminalPrompt } from "@/components/terminal-prompt"
import { TerminalButton } from "@/components/terminal-button"
import { TerminalInput } from "@/components/terminal-input"
import { revealGame } from "@/lib/actions/game-actions-client"
import type { Game } from "@/lib/actions/game-actions-client"

interface RevealFlowProps {
  onBack: () => void
}

export function RevealFlow({ onBack }: RevealFlowProps) {
  const [gameId, setGameId] = useState("")
  const [gameData, setGameData] = useState<Game | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleLoadStats = () => {
    startTransition(() => {
      (async () => {
      setError(null)

      const { data: game, error: gameError } = await revealGame(gameId)

      if (gameError || !game) {
        setError("Game not found! Check your game ID and try again.")
        return
      }

      setGameData(game)
    })()
    })
  }

  const handleReset = () => {
    setGameId("")
    setGameData(null)
    setError(null)
  }

  if (gameData) {
    const successRate =
      gameData.total_players > 0 ? ((gameData.successful_guesses / gameData.total_players) * 100).toFixed(1) : "0.0"

    return (
      <div className="space-y-4">
        <TerminalPrompt>
          <span className="text-terminal-cyan">Game Statistics</span>
        </TerminalPrompt>

        <div className="pl-8 space-y-4">
          {/* Game Info */}
          <div className="border-2 border-terminal-cyan p-4 bg-terminal-cyan/10">
            <p className="text-terminal-cyan text-sm mb-2">
              {">"} GAME ID: {gameData.game_code}
            </p>
            <p className="text-terminal-yellow text-lg font-bold mb-2">Hidden Word: {gameData.hidden_word}</p>
            <p className="text-terminal-muted text-xs">
              {">"} {gameData.masterpiece_text}
            </p>
          </div>

          {/* Overall Stats */}
          <div className="border-2 border-terminal-green p-4 bg-terminal-green/10">
            <p className="text-terminal-green text-sm mb-3 font-bold">{">"} OVERALL STATISTICS</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-terminal-muted">Total Players:</p>
                <p className="text-terminal-text font-bold">{gameData.total_players}</p>
              </div>
              <div>
                <p className="text-terminal-muted">Correct Guesses:</p>
                <p className="text-terminal-green font-bold">{gameData.successful_guesses}</p>
              </div>
              <div>
                <p className="text-terminal-muted">Success Rate:</p>
                <p className="text-terminal-yellow font-bold">{successRate}%</p>
              </div>
              <div>
                <p className="text-terminal-muted">Failed Attempts:</p>
                <p className="text-terminal-red font-bold">{gameData.failed_guesses}</p>
              </div>
            </div>
          </div>

          {/* Author Earnings */}
          <div className="border-2 border-terminal-border p-4 bg-terminal-bg">
            <p className="text-terminal-green text-sm mb-2">{">"} AUTHOR EARNINGS</p>
            <p className="text-terminal-text text-xs mb-2">
              {">"} You earn 5 points for each player who fails to guess your word
            </p>
            <p className="text-terminal-yellow text-lg font-bold">+{gameData.failed_guesses * 5} points</p>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <TerminalButton onClick={handleReset}>CHECK ANOTHER GAME</TerminalButton>
            <TerminalButton variant="secondary" onClick={onBack}>
              BACK TO MENU
            </TerminalButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TerminalPrompt>
        <span>View game results</span>
      </TerminalPrompt>

      <div className="pl-8 space-y-4">
        <div className="text-terminal-muted text-sm space-y-1">
          <p>{">"} Enter your game ID to see statistics</p>
          <p>{">"} View player performance and your earnings</p>
          <p>{">"} Track who guessed your hidden word</p>
        </div>

        <div className="border-2 border-terminal-yellow p-4 bg-terminal-yellow/10">
          <p className="text-terminal-yellow text-xs mb-2">{">"} TRY THESE DEMO GAMES:</p>
          <p className="text-terminal-text text-sm">ABC123 | XYZ789 | TECH42 | FRAME1</p>
        </div>

        {error && (
          <div className="border-2 border-terminal-red p-3 bg-terminal-red/10">
            <p className="text-terminal-red text-sm">
              {">"} {error}
            </p>
          </div>
        )}

        <div className="space-y-4 pt-4">
          <TerminalInput
            label="Game ID"
            placeholder="Enter 6-character game ID..."
            value={gameId}
            onChange={(e) => setGameId(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isPending) handleLoadStats()
            }}
            maxLength={6}
            disabled={isPending}
          />
        </div>

        <div className="pt-4 flex flex-wrap gap-3">
          <TerminalButton onClick={handleLoadStats} disabled={gameId.length < 6 || isPending}>
            {isPending ? "LOADING..." : "VIEW RESULTS"}
          </TerminalButton>
          <TerminalButton variant="danger" onClick={onBack} disabled={isPending}>
            CANCEL
          </TerminalButton>
        </div>
      </div>
    </div>
  )
}

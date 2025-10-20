"use client"

import { useState, useTransition } from "react"
import { TerminalPrompt } from "@/components/terminal-prompt"
import { TerminalButton } from "@/components/terminal-button"
import { TerminalInput } from "@/components/terminal-input"
import { getGameByCode, submitGuess, getOrCreateUser, getGameSession } from "@/lib/actions/game-actions"
import type { Game } from "@/lib/actions/game-actions"

interface PlayerFlowProps {
  onBack: () => void
  onGameComplete: (result: GameResult) => void
}

interface GameResult {
  correct: boolean
  hiddenWord: string
  attempts: number
  points: number
}

type Step = "enter-id" | "playing" | "result"

export function PlayerFlow({ onBack, onGameComplete }: PlayerFlowProps) {
  const [step, setStep] = useState<Step>("enter-id")
  const [gameId, setGameId] = useState("")
  const [guess, setGuess] = useState("")
  const [attempts, setAttempts] = useState(0)
  const [gameData, setGameData] = useState<Game | null>(null)
  const [result, setResult] = useState<GameResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)

  const handleLoadGame = () => {
    startTransition(() => {
      (async () => {
      setError(null)

      // Get or create player
      const { data: user, error: userError } = await getOrCreateUser("demo_player")
      if (userError || !user) {
        setError("Failed to initialize player")
        return
      }
      setPlayerId(user.id)

      // Fetch game
      const { data: game, error: gameError } = await getGameByCode(gameId)
      if (gameError || !game) {
        setError("Game not found! Check your game ID and try again.")
        return
      }

      // Check if player already has a session
      const { data: session } = await getGameSession(game.id, user.id)
      if (session) {
        setAttempts(session.total_attempts)
        if (session.status === "won" || session.status === "lost") {
          // Game already completed
          const gameResult: GameResult = {
            correct: session.status === "won",
            hiddenWord: game.hidden_word,
            attempts: session.total_attempts,
            points: session.points_earned,
          }
          setResult(gameResult)
          setGameData(game)
          setStep("result")
          return
        }
      }

      setGameData(game)
      setStep("playing")
    })()
    })
  }

  const handleGuess = () => {
    if (!guess.trim() || !gameData || !playerId) return

    startTransition(() => {
      (async () => {
      setError(null)

      const { data: guessResult, error: guessError } = await submitGuess(gameData.id, playerId, guess)

      if (guessError || !guessResult) {
        setError("Failed to submit guess. Please try again.")
        return
      }

      if (guessResult.error) {
        setError(guessResult.error)
        return
      }

      setAttempts(guessResult.attempt_number)

      if (guessResult.is_correct) {
        // Correct guess!
        const gameResult: GameResult = {
          correct: true,
          hiddenWord: gameData.hidden_word,
          attempts: guessResult.attempt_number,
          points: guessResult.points_earned,
        }
        setResult(gameResult)
        setStep("result")
        onGameComplete(gameResult)
      } else {
        if (guessResult.session_status === "lost") {
          // Out of attempts
          const gameResult: GameResult = {
            correct: false,
            hiddenWord: gameData.hidden_word,
            attempts: guessResult.attempt_number,
            points: 0,
          }
          setResult(gameResult)
          setStep("result")
          onGameComplete(gameResult)
        } else {
          // Still have attempts
          setError(`Incorrect! You have ${3 - guessResult.attempt_number} attempts remaining.`)
          setGuess("")
        }
      }
    })()
    })
  }

  const handleReset = () => {
    setGameId("")
    setGuess("")
    setAttempts(0)
    setGameData(null)
    setResult(null)
    setError(null)
    setStep("enter-id")
  }

  if (step === "result" && result) {
    return (
      <div className="space-y-4">
        <TerminalPrompt>
          <span className={result.correct ? "text-terminal-green" : "text-terminal-red"}>
            {result.correct ? "Correct! You win!" : "Game Over"}
          </span>
        </TerminalPrompt>

        <div className="pl-8 space-y-4">
          <div
            className={`border-2 p-4 ${result.correct ? "border-terminal-green bg-terminal-green/10" : "border-terminal-red bg-terminal-red/10"}`}
          >
            <p className="text-terminal-cyan text-sm mb-2">{">"} THE HIDDEN WORD WAS:</p>
            <p className="text-terminal-yellow text-2xl font-bold">{result.hiddenWord}</p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-terminal-text">
              {">"} Attempts: {result.attempts}/3
            </p>
            <p className="text-terminal-text">
              {">"} Points earned: <span className="text-terminal-green font-bold">{result.points}</span>
            </p>
            {result.correct && result.attempts === 1 && (
              <p className="text-terminal-yellow">{">"} Perfect! First try bonus!</p>
            )}
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <TerminalButton onClick={handleReset}>PLAY AGAIN</TerminalButton>
            <TerminalButton variant="secondary" onClick={onBack}>
              BACK TO MENU
            </TerminalButton>
          </div>
        </div>
      </div>
    )
  }

  if (step === "playing" && gameData) {
    // Replace hidden word with blanks
    const regex = new RegExp(`\\b${gameData.hidden_word}\\b`, "gi")
    const displayText = gameData.masterpiece_text.replace(regex, "___")

    return (
      <div className="space-y-4">
        <TerminalPrompt>
          <span>Guess the hidden word</span>
        </TerminalPrompt>

        <div className="pl-8 space-y-4">
          <div className="border-2 border-terminal-cyan p-4 bg-terminal-cyan/10">
            <p className="text-terminal-cyan text-sm mb-2">
              {">"} GAME ID: {gameId.toUpperCase()}
            </p>
            <p className="text-terminal-muted text-xs">
              {">"} Attempts remaining: {3 - attempts}/3
            </p>
          </div>

          <div className="border-2 border-terminal-border p-4 bg-terminal-bg">
            <p className="text-terminal-green text-sm mb-3">{">"} READ THE TEXT:</p>
            <p className="text-terminal-text leading-relaxed">
              {displayText.split("___").map((part, i, arr) =>
                i < arr.length - 1 ? (
                  <span key={i}>
                    {part}
                    <span className="bg-terminal-yellow text-terminal-bg px-2 py-1 mx-1 font-bold">___</span>
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </p>
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
              label="Your Guess"
              placeholder="Type the hidden word..."
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isPending) handleGuess()
              }}
              disabled={isPending}
            />

            <div className="text-terminal-muted text-xs">
              <p>{">"} Hint: The word appears where you see ___</p>
              <p>{">"} Press Enter or click SUBMIT to guess</p>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <TerminalButton onClick={handleGuess} disabled={!guess.trim() || isPending}>
              {isPending ? "SUBMITTING..." : "SUBMIT GUESS"}
            </TerminalButton>
            <TerminalButton variant="danger" onClick={onBack} disabled={isPending}>
              QUIT GAME
            </TerminalButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TerminalPrompt>
        <span>Enter game ID to play</span>
      </TerminalPrompt>

      <div className="pl-8 space-y-4">
        <div className="text-terminal-muted text-sm space-y-1">
          <p>{">"} Get a game ID from an author</p>
          <p>{">"} You have 3 attempts to guess the hidden word</p>
          <p>{">"} Fewer attempts = more points!</p>
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
              if (e.key === "Enter" && !isPending) handleLoadGame()
            }}
            maxLength={6}
            disabled={isPending}
          />
        </div>

        <div className="pt-4 flex flex-wrap gap-3">
          <TerminalButton onClick={handleLoadGame} disabled={gameId.length < 6 || isPending}>
            {isPending ? "LOADING..." : "LOAD GAME"}
          </TerminalButton>
          <TerminalButton variant="danger" onClick={onBack} disabled={isPending}>
            CANCEL
          </TerminalButton>
        </div>
      </div>
    </div>
  )
}

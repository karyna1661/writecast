"use client"

import { useState, useTransition } from "react"
import { TerminalPrompt } from "@/components/terminal-prompt"
import { TerminalButton } from "@/components/terminal-button"
import { TerminalInput } from "@/components/terminal-input"
import { TerminalTextarea } from "@/components/terminal-textarea"
import { createGame, getOrCreateUser } from "@/lib/actions/game-actions-client"
import type { GameMode } from "@/lib/game-state"

interface AuthorFlowProps {
  onBack: () => void
  onGameCreated: (gameId: string) => void
  mode: GameMode
}

type Step = "input" | "preview" | "created"

export function AuthorFlow({ onBack, onGameCreated, mode }: AuthorFlowProps) {
  const [step, setStep] = useState<Step>("input")
  const [hiddenWord, setHiddenWord] = useState("")
  const [masterpiece, setMasterpiece] = useState("")
  const [gameId, setGameId] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleCreateGame = () => {
    startTransition(() => {
      (async () => {
        setError(null)

      // Validate inputs
      if (!hiddenWord.trim() || !masterpiece.trim()) {
        setError("Please fill in all fields")
        return
      }

      // Check if hidden word appears in masterpiece
      const wordLower = hiddenWord.toLowerCase()
      const masterpieceLower = masterpiece.toLowerCase()

      if (!masterpieceLower.includes(wordLower)) {
        setError("Error: Your hidden word must appear in your masterpiece!")
        return
      }

      // Get or create author
      const { data: user, error: userError } = await getOrCreateUser("demo_author")
      if (userError || !user) {
        setError("Failed to initialize author")
        return
      }

      // Create game in database
      const { data: newGameCode, error: gameError } = await createGame(user.id, mode, masterpiece, hiddenWord)

      if (gameError || !newGameCode) {
        setError("Failed to create game. Please try again.")
        return
      }

      setGameId(newGameCode)
      setStep("created")
      onGameCreated(newGameCode)
    })()
    })
  }

  const handleReset = () => {
    setHiddenWord("")
    setMasterpiece("")
    setGameId("")
    setError(null)
    setStep("input")
  }

  if (step === "created") {
    return (
      <div className="space-y-4">
        <TerminalPrompt>
          <span className="text-terminal-green">Game created successfully!</span>
        </TerminalPrompt>

        <div className="pl-8 space-y-3">
          <div className="border-2 border-terminal-green p-4 bg-terminal-green/10">
            <p className="text-terminal-green text-sm mb-2">{">"} GAME ID:</p>
            <p className="text-terminal-cyan text-xl font-bold">{gameId}</p>
          </div>

          <div className="space-y-2 text-sm">
            <p className="text-terminal-text">{">"} Share this game ID with players</p>
            <p className="text-terminal-text">{">"} Players will try to guess your hidden word</p>
            <p className="text-terminal-muted">{">"} You'll earn points for stumping players!</p>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            <TerminalButton onClick={handleReset}>CREATE ANOTHER</TerminalButton>
            <TerminalButton variant="secondary" onClick={onBack}>
              BACK TO MENU
            </TerminalButton>
          </div>
        </div>
      </div>
    )
  }

  if (step === "preview") {
    // Highlight the hidden word in the masterpiece
    const regex = new RegExp(`(${hiddenWord})`, "gi")
    const parts = masterpiece.split(regex)

    return (
      <div className="space-y-4">
        <TerminalPrompt>
          <span>Preview your game</span>
        </TerminalPrompt>

        <div className="pl-8 space-y-4">
          <div className="border-2 border-terminal-cyan p-4 bg-terminal-cyan/10">
            <p className="text-terminal-cyan text-sm mb-2">{">"} HIDDEN WORD:</p>
            <p className="text-terminal-yellow text-lg font-bold">{hiddenWord}</p>
          </div>

          <div className="border-2 border-terminal-border p-4 bg-terminal-bg">
            <p className="text-terminal-green text-sm mb-3">{">"} YOUR MASTERPIECE:</p>
            <p className="text-terminal-text leading-relaxed">
              {parts.map((part, i) =>
                part.toLowerCase() === hiddenWord.toLowerCase() ? (
                  <span key={i} className="bg-terminal-yellow text-terminal-bg px-1">
                    {part}
                  </span>
                ) : (
                  <span key={i}>{part}</span>
                ),
              )}
            </p>
          </div>

          <div className="text-terminal-muted text-xs">
            <p>{">"} The highlighted word will be hidden from players</p>
            <p>{">"} Players will see your text with blanks: ___</p>
          </div>

          {error && (
            <div className="border-2 border-terminal-red p-3 bg-terminal-red/10">
              <p className="text-terminal-red text-sm">
                {">"} {error}
              </p>
            </div>
          )}

          <div className="pt-4 flex flex-wrap gap-3">
            <TerminalButton onClick={handleCreateGame} disabled={isPending}>
              {isPending ? "CREATING..." : "CONFIRM & CREATE"}
            </TerminalButton>
            <TerminalButton variant="secondary" onClick={() => setStep("input")} disabled={isPending}>
              EDIT
            </TerminalButton>
            <TerminalButton variant="danger" onClick={onBack} disabled={isPending}>
              CANCEL
            </TerminalButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <TerminalPrompt>
        <span>Create a new game</span>
      </TerminalPrompt>

      <div className="pl-8 space-y-4">
        <div className="text-terminal-muted text-sm space-y-1">
          <p>{">"} Step 1: Choose a word to hide</p>
          <p>{">"} Step 2: Write a masterpiece that includes your word</p>
          <p>{">"} Step 3: Players will try to guess your hidden word</p>
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
            label="Hidden Word"
            placeholder="Enter a word to hide..."
            value={hiddenWord}
            onChange={(e) => setHiddenWord(e.target.value)}
            maxLength={20}
          />

          <TerminalTextarea
            label="Your Masterpiece"
            placeholder="Write your text here. Make sure to include your hidden word naturally..."
            value={masterpiece}
            onChange={(e) => setMasterpiece(e.target.value)}
            rows={8}
            maxLength={500}
          />

          <div className="text-terminal-muted text-xs">
            <p>
              {">"} Characters: {masterpiece.length}/500
            </p>
          </div>
        </div>

        <div className="pt-4 flex flex-wrap gap-3">
          <TerminalButton onClick={() => setStep("preview")} disabled={!hiddenWord || !masterpiece}>
            PREVIEW GAME
          </TerminalButton>
          <TerminalButton variant="danger" onClick={onBack}>
            CANCEL
          </TerminalButton>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { TerminalPrompt } from "@/components/terminal-prompt"
import { TerminalButton } from "@/components/terminal-button"

interface LeaderboardProps {
  onBack: () => void
}

type LeaderboardType = "players" | "authors"

interface Player {
  rank: number
  username: string
  totalPoints: number
  gamesPlayed: number
  successRate: number
}

interface Author {
  rank: number
  username: string
  totalPoints: number
  gamesCreated: number
  avgDifficulty: number
}

// Mock leaderboard data
const MOCK_PLAYERS: Player[] = [
  { rank: 1, username: "alice.eth", totalPoints: 2450, gamesPlayed: 28, successRate: 89.3 },
  { rank: 2, username: "bob.eth", totalPoints: 2180, gamesPlayed: 25, successRate: 92.0 },
  { rank: 3, username: "charlie.eth", totalPoints: 1920, gamesPlayed: 22, successRate: 86.4 },
  { rank: 4, username: "dave.eth", totalPoints: 1750, gamesPlayed: 20, successRate: 85.0 },
  { rank: 5, username: "eve.eth", totalPoints: 1680, gamesPlayed: 19, successRate: 84.2 },
  { rank: 6, username: "frank.eth", totalPoints: 1540, gamesPlayed: 18, successRate: 83.3 },
  { rank: 7, username: "grace.eth", totalPoints: 1420, gamesPlayed: 16, successRate: 87.5 },
  { rank: 8, username: "henry.eth", totalPoints: 1350, gamesPlayed: 15, successRate: 86.7 },
  { rank: 9, username: "iris.eth", totalPoints: 1280, gamesPlayed: 14, successRate: 85.7 },
  { rank: 10, username: "jack.eth", totalPoints: 1190, gamesPlayed: 13, successRate: 84.6 },
]

const MOCK_AUTHORS: Author[] = [
  { rank: 1, username: "wordsmith.eth", totalPoints: 3200, gamesCreated: 42, avgDifficulty: 7.8 },
  { rank: 2, username: "poet.eth", totalPoints: 2890, gamesCreated: 38, avgDifficulty: 7.5 },
  { rank: 3, username: "writer.eth", totalPoints: 2650, gamesCreated: 35, avgDifficulty: 7.2 },
  { rank: 4, username: "scribe.eth", totalPoints: 2420, gamesCreated: 32, avgDifficulty: 7.0 },
  { rank: 5, username: "author.eth", totalPoints: 2180, gamesCreated: 29, avgDifficulty: 6.9 },
  { rank: 6, username: "novelist.eth", totalPoints: 1950, gamesCreated: 26, avgDifficulty: 6.7 },
  { rank: 7, username: "bard.eth", totalPoints: 1820, gamesCreated: 24, avgDifficulty: 6.5 },
  { rank: 8, username: "storyteller.eth", totalPoints: 1690, gamesCreated: 22, avgDifficulty: 6.4 },
  { rank: 9, username: "composer.eth", totalPoints: 1540, gamesCreated: 20, avgDifficulty: 6.2 },
  { rank: 10, username: "creator.eth", totalPoints: 1420, gamesCreated: 18, avgDifficulty: 6.0 },
]

export function Leaderboard({ onBack }: LeaderboardProps) {
  const [type, setType] = useState<LeaderboardType>("players")

  const getRankColor = (rank: number) => {
    if (rank === 1) return "text-terminal-yellow"
    if (rank === 2) return "text-terminal-cyan"
    if (rank === 3) return "text-terminal-green"
    return "text-terminal-muted"
  }

  const getRankSymbol = (rank: number) => {
    if (rank === 1) return "👑"
    if (rank === 2) return "🥈"
    if (rank === 3) return "🥉"
    return "▪"
  }

  return (
    <div className="space-y-4">
      <TerminalPrompt>
        <span className="text-terminal-cyan">Global Leaderboard</span>
      </TerminalPrompt>

      <div className="pl-8 space-y-4">
        {/* Toggle between players and authors */}
        <div className="flex gap-3">
          <TerminalButton
            variant={type === "players" ? "primary" : "secondary"}
            onClick={() => setType("players")}
            className="text-xs"
          >
            TOP PLAYERS
          </TerminalButton>
          <TerminalButton
            variant={type === "authors" ? "primary" : "secondary"}
            onClick={() => setType("authors")}
            className="text-xs"
          >
            TOP AUTHORS
          </TerminalButton>
        </div>

        {/* Players Leaderboard */}
        {type === "players" && (
          <div className="border-2 border-terminal-green p-4 bg-terminal-green/10">
            <p className="text-terminal-green text-sm mb-4 font-bold">{">"} TOP PLAYERS - BEST GUESSERS</p>
            <div className="space-y-3">
              {MOCK_PLAYERS.map((player) => (
                <div
                  key={player.rank}
                  className="flex items-center justify-between text-sm border-b border-terminal-border pb-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`font-bold w-8 ${getRankColor(player.rank)}`}>#{player.rank}</span>
                    <span className="text-terminal-text font-mono">{player.username}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <p className="text-terminal-muted">Points</p>
                      <p className="text-terminal-yellow font-bold">{player.totalPoints}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-terminal-muted">Games</p>
                      <p className="text-terminal-cyan font-bold">{player.gamesPlayed}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-terminal-muted">Success</p>
                      <p className="text-terminal-green font-bold">{player.successRate}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Authors Leaderboard */}
        {type === "authors" && (
          <div className="border-2 border-terminal-cyan p-4 bg-terminal-cyan/10">
            <p className="text-terminal-cyan text-sm mb-4 font-bold">{">"} TOP AUTHORS - MASTER WORDSMITHS</p>
            <div className="space-y-3">
              {MOCK_AUTHORS.map((author) => (
                <div
                  key={author.rank}
                  className="flex items-center justify-between text-sm border-b border-terminal-border pb-3 last:border-b-0"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`font-bold w-8 ${getRankColor(author.rank)}`}>#{author.rank}</span>
                    <span className="text-terminal-text font-mono">{author.username}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <p className="text-terminal-muted">Points</p>
                      <p className="text-terminal-yellow font-bold">{author.totalPoints}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-terminal-muted">Games</p>
                      <p className="text-terminal-cyan font-bold">{author.gamesCreated}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-terminal-muted">Difficulty</p>
                      <p className="text-terminal-green font-bold">{author.avgDifficulty}/10</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="border-2 border-terminal-yellow p-4 bg-terminal-yellow/10">
          <p className="text-terminal-yellow text-xs mb-2 font-bold">{">"} HOW RANKINGS WORK</p>
          <div className="text-terminal-text text-xs space-y-1">
            {type === "players" ? (
              <>
                <p>{">"} Earn points by guessing words correctly</p>
                <p>{">"} Fewer attempts = more points per game</p>
                <p>{">"} Success rate affects your ranking</p>
              </>
            ) : (
              <>
                <p>{">"} Earn points when players fail to guess</p>
                <p>{">"} More challenging words = higher difficulty rating</p>
                <p>{">"} Create engaging games to climb the ranks</p>
              </>
            )}
          </div>
        </div>

        <div className="pt-4 flex flex-wrap gap-3">
          <TerminalButton variant="secondary" onClick={onBack}>
            BACK TO MENU
          </TerminalButton>
        </div>
      </div>
    </div>
  )
}

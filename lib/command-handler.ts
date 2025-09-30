import type { CliMessage } from "@/components/cli-terminal"
import { parseCommand, HELP_TEXT } from "@/lib/command-parser"
import type { GameState } from "@/lib/game-state"
import {
  getAllGames,
  getGameByCode,
  submitGuess,
  createGame,
  getOrCreateUser,
  revealGame,
  getPlayerLeaderboard,
  getAuthorLeaderboard,
} from "@/lib/actions/game-actions"
import { joinWaitlist, getWaitlistCount } from "@/lib/actions/waitlist-actions"

export function handleCommand(
  input: string,
  gameState: GameState,
  setGameState: (state: GameState) => void,
  addMessage: (msg: CliMessage) => void,
): void {
  const { command, args, rawArgs } = parseCommand(input)

  // Add command to history
  addMessage({ type: "command", content: input, timestamp: Date.now() })

  switch (command) {
    case "help":
      addMessage({ type: "output", content: HELP_TEXT, timestamp: Date.now() })
      break

    case "games":
      handleGames(addMessage)
      break

    case "clear":
      // This will be handled in the parent component
      break

    case "menu":
      setGameState({
        ...gameState,
        mode: null,
        step: "idle",
        hiddenWord: "",
        masterpiece: "",
        currentGameId: "",
        currentGame: null,
        attempts: 0,
      })
      addMessage({
        type: "success",
        content: "Returned to main menu. Type 'help' for commands.",
        timestamp: Date.now(),
      })
      break

    case "create":
      handleCreate(args, rawArgs, gameState, setGameState, addMessage)
      break

    case "frame":
      handleFrame(gameState, setGameState, addMessage)
      break

    case "write":
      handleWrite(rawArgs, gameState, setGameState, addMessage)
      break

    case "keyword":
      handleKeyword(rawArgs, gameState, setGameState, addMessage)
      break

    case "preview":
      handlePreview(gameState, addMessage)
      break

    case "confirm":
      handleConfirm(gameState, setGameState, addMessage)
      break

    case "play":
      handlePlay(args, gameState, setGameState, addMessage)
      break

    case "guess":
      handleGuess(rawArgs, gameState, setGameState, addMessage)
      break

    case "reveal":
      handleReveal(args, addMessage)
      break

    case "leaderboard":
      handleLeaderboard(addMessage)
      break

    case "notify":
      handleNotify(rawArgs, addMessage)
      break

    default:
      addMessage({
        type: "error",
        content: `Unknown command: '${command}'. Type 'help' for available commands.`,
        timestamp: Date.now(),
      })
  }
}

async function handleGames(addMessage: (msg: CliMessage) => void) {
  addMessage({ type: "output", content: "Loading games...", timestamp: Date.now() })

  console.log("[v0] Fetching all games from database...")
  const { data: games, error } = await getAllGames()

  console.log("[v0] Games result:", { games, error })

  if (error || !games) {
    addMessage({
      type: "error",
      content: `Failed to load games: ${error || "Unknown error"}`,
      timestamp: Date.now(),
    })
    return
  }

  if (games.length === 0) {
    addMessage({
      type: "error",
      content: `No games found in database. The database may need to be initialized.\n\nPlease run the SQL scripts in the 'scripts' folder to set up the database.`,
      timestamp: Date.now(),
    })
    return
  }

  const fillBlankGames = games
    .filter((game) => game.game_type === "fill-blank")
    .map((game) => `  ${game.game_code}`)
    .join("\n")

  const frameWordGames = games
    .filter((game) => game.game_type === "frame-word")
    .map((game) => `  ${game.game_code}`)
    .join("\n")

  const gamesText = `
${"━".repeat(60)}
AVAILABLE DEMO GAMES (${games.length} total)
${"━".repeat(60)}

FILL-IN-BLANK GAMES:
${fillBlankGames || "  None available"}

FRAME-THE-WORD GAMES:
${frameWordGames || "  None available"}

${"━".repeat(60)}
Use 'play <gameId>' to start playing!
Example: play ABC123
`

  addMessage({ type: "output", content: gamesText, timestamp: Date.now() })
}

function handleCreate(
  args: string[],
  rawArgs: string,
  gameState: GameState,
  setGameState: (state: GameState) => void,
  addMessage: (msg: CliMessage) => void,
) {
  if (!rawArgs) {
    addMessage({
      type: "error",
      content: "Usage: create <word>\nExample: create innovation",
      timestamp: Date.now(),
    })
    return
  }

  setGameState({
    ...gameState,
    mode: "fill-blank",
    step: "writing",
    hiddenWord: rawArgs,
    masterpiece: "",
  })

  addMessage({
    type: "success",
    content: `Hidden word set to: "${rawArgs}"\nNow write your masterpiece using: write <your text here>`,
    timestamp: Date.now(),
  })
}

function handleFrame(
  gameState: GameState,
  setGameState: (state: GameState) => void,
  addMessage: (msg: CliMessage) => void,
) {
  setGameState({
    ...gameState,
    mode: "frame-word",
    step: "writing",
    hiddenWord: "",
    masterpiece: "",
  })

  addMessage({
    type: "success",
    content:
      "Frame-the-word mode activated!\nWrite your masterpiece first: write <your text here>\nThen set your framing keyword: keyword <word>",
    timestamp: Date.now(),
  })
}

function handleWrite(
  rawArgs: string,
  gameState: GameState,
  setGameState: (state: GameState) => void,
  addMessage: (msg: CliMessage) => void,
) {
  if (!gameState.mode) {
    addMessage({
      type: "error",
      content: "Start a game first! Use 'create <word>' or 'frame'",
      timestamp: Date.now(),
    })
    return
  }

  if (!rawArgs) {
    addMessage({
      type: "error",
      content: "Usage: write <your text here>\nExample: write The future depends on innovation",
      timestamp: Date.now(),
    })
    return
  }

  setGameState({
    ...gameState,
    masterpiece: rawArgs,
  })

  if (gameState.mode === "fill-blank") {
    const wordRegex = new RegExp(`\\b${gameState.hiddenWord}\\b`, "g")
    const textContainsWord = wordRegex.test(rawArgs)

    if (!textContainsWord) {
      addMessage({
        type: "error",
        content: `Your text must include the hidden word: "${gameState.hiddenWord}" (case-sensitive)`,
        timestamp: Date.now(),
      })
      return
    }

    addMessage({
      type: "success",
      content: `Masterpiece saved! (${rawArgs.length} characters)\nType 'preview' to see how it looks, or 'confirm' to publish.`,
      timestamp: Date.now(),
    })
  } else {
    addMessage({
      type: "success",
      content: `Masterpiece saved! (${rawArgs.length} characters)\nNow set your framing keyword: keyword <word>`,
      timestamp: Date.now(),
    })
  }
}

function handleKeyword(
  rawArgs: string,
  gameState: GameState,
  setGameState: (state: GameState) => void,
  addMessage: (msg: CliMessage) => void,
) {
  if (gameState.mode !== "frame-word") {
    addMessage({
      type: "error",
      content: "This command is only for frame-word mode. Use 'frame' to start.",
      timestamp: Date.now(),
    })
    return
  }

  if (!gameState.masterpiece) {
    addMessage({
      type: "error",
      content: "Write your masterpiece first: write <your text>",
      timestamp: Date.now(),
    })
    return
  }

  if (!rawArgs) {
    addMessage({
      type: "error",
      content: "Usage: keyword <word>\nExample: keyword resilience",
      timestamp: Date.now(),
    })
    return
  }

  setGameState({
    ...gameState,
    hiddenWord: rawArgs,
  })

  addMessage({
    type: "success",
    content: `Framing keyword set to: "${rawArgs}"\nType 'preview' to see how it looks, or 'confirm' to publish.`,
    timestamp: Date.now(),
  })
}

function handlePreview(gameState: GameState, addMessage: (msg: CliMessage) => void) {
  if (!gameState.mode || !gameState.hiddenWord || !gameState.masterpiece) {
    addMessage({
      type: "error",
      content: "Complete your game first! You need a hidden word and masterpiece text.",
      timestamp: Date.now(),
    })
    return
  }

  const modeText = gameState.mode === "fill-blank" ? "FILL-IN-BLANK" : "FRAME-THE-WORD"

  let preview = `
${"━".repeat(60)}
GAME PREVIEW (${modeText})
${"━".repeat(60)}

Hidden Word: ${gameState.hiddenWord}

Your Text:
${gameState.masterpiece}

Players will see:
`

  if (gameState.mode === "fill-blank") {
    const regex = new RegExp(`\\b${gameState.hiddenWord}\\b`, "g")
    const playerView = gameState.masterpiece.replace(regex, "___")
    preview += playerView
  } else {
    preview += `${gameState.masterpiece}

(Players must guess the word that frames/defines this piece)`
  }

  preview += `

${"━".repeat(60)}
Type 'confirm' to publish, or 'write' to edit your text.`

  addMessage({ type: "output", content: preview, timestamp: Date.now() })
}

async function handleConfirm(
  gameState: GameState,
  setGameState: (state: GameState) => void,
  addMessage: (msg: CliMessage) => void,
) {
  if (!gameState.mode || !gameState.hiddenWord || !gameState.masterpiece) {
    addMessage({
      type: "error",
      content: "Complete your game first! You need a hidden word and masterpiece text.",
      timestamp: Date.now(),
    })
    return
  }

  addMessage({ type: "output", content: "Creating game...", timestamp: Date.now() })

  console.log("[v0] Getting or creating author...")
  const { data: user, error: userError } = await getOrCreateUser("demo_author")
  console.log("[v0] User result:", { user, error: userError })

  if (userError || !user) {
    addMessage({
      type: "error",
      content: `Failed to initialize author: ${userError || "Unknown error"}`,
      timestamp: Date.now(),
    })
    return
  }

  console.log("[v0] Creating game with:", {
    userId: user.id,
    mode: gameState.mode,
    masterpieceLength: gameState.masterpiece.length,
    hiddenWord: gameState.hiddenWord,
  })

  const { data: gameCode, error: gameError } = await createGame(
    user.id,
    gameState.mode,
    gameState.masterpiece,
    gameState.hiddenWord,
  )

  console.log("[v0] Game creation result:", { gameCode, error: gameError })

  if (gameError || !gameCode) {
    addMessage({
      type: "error",
      content: `Failed to create game: ${gameError || "Unknown error"}`,
      timestamp: Date.now(),
    })
    return
  }

  setGameState({
    ...gameState,
    gameId: gameCode,
    step: "idle",
  })

  const modeText = gameState.mode === "fill-blank" ? "Fill-in-Blank" : "Frame-the-Word"

  addMessage({
    type: "success",
    content: `
${"━".repeat(60)}
GAME PUBLISHED! (${modeText})
${"━".repeat(60)}

Game ID: ${gameCode}

Share this ID with players!
Players can start with: play ${gameCode}

You'll earn points when players fail to guess your word.
${"━".repeat(60)}`,
    timestamp: Date.now(),
  })
}

async function handlePlay(
  args: string[],
  gameState: GameState,
  setGameState: (state: GameState) => void,
  addMessage: (msg: CliMessage) => void,
) {
  if (!args[0]) {
    addMessage({
      type: "error",
      content: "Usage: play <gameId>\nExample: play ABC123\n\nType 'games' to see all available demo games!",
      timestamp: Date.now(),
    })
    return
  }

  const gameId = args[0].toUpperCase()

  addMessage({ type: "output", content: "Loading game...", timestamp: Date.now() })

  const { data: game, error } = await getGameByCode(gameId)

  if (error || !game) {
    addMessage({
      type: "error",
      content: `Game not found: ${gameId}\n\nType 'games' to see all available demo games!`,
      timestamp: Date.now(),
    })
    return
  }

  // Get or create player
  const { data: user, error: userError } = await getOrCreateUser("demo_player")
  if (userError || !user) {
    addMessage({
      type: "error",
      content: "Failed to initialize player. Please try again.",
      timestamp: Date.now(),
    })
    return
  }

  setGameState({
    ...gameState,
    step: "playing",
    currentGameId: gameId,
    currentGame: {
      hiddenWord: game.hidden_word,
      masterpiece: game.masterpiece_text,
      mode: game.game_type,
    },
    attempts: 0,
  })

  const modeText = game.game_type === "fill-blank" ? "Fill-in-Blank" : "Frame-the-Word"

  let gameText = `
${"━".repeat(60)}
GAME LOADED: ${gameId} (${modeText})
${"━".repeat(60)}

`

  if (game.game_type === "fill-blank") {
    const regex = new RegExp(`\\b${game.hidden_word}\\b`, "g")
    const displayText = game.masterpiece_text.replace(regex, "___")
    gameText += `${displayText}

Guess the word that fills the blanks!`
  } else {
    gameText += `${game.masterpiece_text}

What word frames this masterpiece?`
  }

  gameText += `

${"━".repeat(60)}
Attempts remaining: 3/3
Type: guess <word>`

  addMessage({ type: "output", content: gameText, timestamp: Date.now() })
}

async function handleGuess(
  rawArgs: string,
  gameState: GameState,
  setGameState: (state: GameState) => void,
  addMessage: (msg: CliMessage) => void,
) {
  if (!gameState.currentGame) {
    addMessage({
      type: "error",
      content: "No active game! Use 'play <gameId>' to start a game.",
      timestamp: Date.now(),
    })
    return
  }

  if (!rawArgs) {
    addMessage({
      type: "error",
      content: "Usage: guess <word>\nExample: guess innovation",
      timestamp: Date.now(),
    })
    return
  }

  addMessage({ type: "output", content: "Submitting guess...", timestamp: Date.now() })

  // Get player and game
  const { data: user, error: userError } = await getOrCreateUser("demo_player")
  if (userError || !user) {
    addMessage({
      type: "error",
      content: "Failed to get player info. Please try again.",
      timestamp: Date.now(),
    })
    return
  }

  const { data: game, error: gameError } = await getGameByCode(gameState.currentGameId)
  if (gameError || !game) {
    addMessage({
      type: "error",
      content: "Failed to load game. Please try again.",
      timestamp: Date.now(),
    })
    return
  }

  // Submit guess
  const { data: result, error: guessError } = await submitGuess(game.id, user.id, rawArgs)

  if (guessError || !result) {
    addMessage({
      type: "error",
      content: `Failed to submit guess: ${guessError || "Unknown error"}`,
      timestamp: Date.now(),
    })
    return
  }

  if (result.error) {
    addMessage({
      type: "error",
      content: result.error,
      timestamp: Date.now(),
    })
    return
  }

  if (result.is_correct) {
    const bonus = result.attempt_number === 1 ? " + FIRST TRY BONUS!" : ""

    addMessage({
      type: "success",
      content: `
${"━".repeat(60)}
CORRECT! YOU WIN!
${"━".repeat(60)}

The word was: ${gameState.currentGame.hiddenWord}
Attempts: ${result.attempt_number}/3
Points earned: ${result.points_earned}${bonus}

${result.attempt_number === 1 ? "Perfect! First try!" : "Well done!"}
${"━".repeat(60)}`,
      timestamp: Date.now(),
    })

    setGameState({
      ...gameState,
      step: "idle",
      currentGame: null,
      currentGameId: "",
      attempts: 0,
    })
  } else {
    if (result.session_status === "lost") {
      addMessage({
        type: "error",
        content: `
${"━".repeat(60)}
GAME OVER
${"━".repeat(60)}

Out of attempts!
The word was: ${gameState.currentGame.hiddenWord}
Points earned: 0

Better luck next time!
${"━".repeat(60)}`,
        timestamp: Date.now(),
      })

      setGameState({
        ...gameState,
        step: "idle",
        currentGame: null,
        currentGameId: "",
        attempts: 0,
      })
    } else {
      setGameState({
        ...gameState,
        attempts: result.attempt_number,
      })

      addMessage({
        type: "error",
        content: `Incorrect! Attempts remaining: ${3 - result.attempt_number}/3\nTry again: guess <word>`,
        timestamp: Date.now(),
      })
    }
  }
}

async function handleReveal(args: string[], addMessage: (msg: CliMessage) => void) {
  if (!args[0]) {
    addMessage({
      type: "error",
      content: "Usage: reveal <gameId>\nExample: reveal ABC123",
      timestamp: Date.now(),
    })
    return
  }

  const gameId = args[0].toUpperCase()

  addMessage({ type: "output", content: "Loading game stats...", timestamp: Date.now() })

  const { data: game, error } = await revealGame(gameId)

  if (error || !game) {
    addMessage({
      type: "error",
      content: `Game not found: ${gameId}`,
      timestamp: Date.now(),
    })
    return
  }

  const successRate = game.total_players > 0 ? ((game.successful_guesses / game.total_players) * 100).toFixed(1) : "0.0"

  const stats = `
${"━".repeat(60)}
GAME RESULTS: ${gameId}
${"━".repeat(60)}

Hidden Word: ${game.hidden_word}
Game Mode: ${game.game_type === "fill-blank" ? "Fill-in-Blank" : "Frame-the-Word"}

STATISTICS:
  Total Players: ${game.total_players}
  Successful Guesses: ${game.successful_guesses} (${successRate}%)
  Failed Attempts: ${game.failed_guesses} (${(100 - Number.parseFloat(successRate)).toFixed(1)}%)
  Total Attempts: ${game.total_attempts}

AUTHOR EARNINGS: ${game.failed_guesses * 5} pts
(5 points per failed guess)
${"━".repeat(60)}`

  addMessage({ type: "output", content: stats, timestamp: Date.now() })
}

async function handleLeaderboard(addMessage: (msg: CliMessage) => void) {
  addMessage({ type: "output", content: "Loading leaderboard...", timestamp: Date.now() })

  const { data: players, error: playersError } = await getPlayerLeaderboard(5)
  const { data: authors, error: authorsError } = await getAuthorLeaderboard(5)

  if (playersError || authorsError) {
    addMessage({
      type: "error",
      content: "Failed to load leaderboard. Please try again.",
      timestamp: Date.now(),
    })
    return
  }

  const medals = ["🥇", "🥈", "🥉"]

  const playersList =
    players && players.length > 0
      ? players
          .map((p, i) => {
            const medal = i < 3 ? medals[i] : `${i + 1}.`
            return `  ${medal} ${p.farcaster_username || p.display_name || "Anonymous"} - ${p.total_points_earned} pts (${p.total_games_played} games)`
          })
          .join("\n")
      : "  No players yet!"

  const authorsList =
    authors && authors.length > 0
      ? authors
          .map((a, i) => {
            const medal = i < 3 ? medals[i] : `${i + 1}.`
            return `  ${medal} ${a.farcaster_username || a.display_name || "Anonymous"} - ${a.total_points_as_author} pts (${a.total_games_created} games)`
          })
          .join("\n")
      : "  No authors yet!"

  const leaderboard = `
${"━".repeat(60)}
GLOBAL LEADERBOARD
${"━".repeat(60)}

TOP PLAYERS:
${playersList}

TOP AUTHORS:
${authorsList}

${"━".repeat(60)}`

  addMessage({ type: "output", content: leaderboard, timestamp: Date.now() })
}

async function handleNotify(rawArgs: string, addMessage: (msg: CliMessage) => void) {
  if (!rawArgs) {
    addMessage({
      type: "error",
      content: `Usage: notify <email or @username>

Examples:
  notify user@example.com
  notify @farcasteruser

Join the waitlist to be notified when the Farcaster mini app launches!`,
      timestamp: Date.now(),
    })
    return
  }

  addMessage({ type: "output", content: "Adding you to the waitlist...", timestamp: Date.now() })

  // Determine if input is email or Farcaster username
  const input = rawArgs.trim()
  let email: string | undefined
  let farcasterUsername: string | undefined

  if (input.startsWith("@")) {
    // Farcaster username
    farcasterUsername = input.substring(1) // Remove @ symbol
  } else if (input.includes("@")) {
    // Email
    email = input
  } else {
    // Assume Farcaster username without @
    farcasterUsername = input
  }

  const { data, error } = await joinWaitlist(email, farcasterUsername)

  if (error) {
    addMessage({
      type: "error",
      content: error,
      timestamp: Date.now(),
    })
    return
  }

  // Get current waitlist count
  const { data: count } = await getWaitlistCount()

  const contactInfo = email ? email : `@${farcasterUsername}`

  addMessage({
    type: "success",
    content: `
${"━".repeat(60)}
WELCOME TO THE WAITLIST!
${"━".repeat(60)}

Contact: ${contactInfo}
${count ? `Waitlist Position: #${count}` : ""}

You'll be notified when the Farcaster mini app launches with:
  ✓ Full authentication
  ✓ Real player profiles
  ✓ Social features
  ✓ And much more!

Thank you for your interest in Writecast!
${"━".repeat(60)}`,
    timestamp: Date.now(),
  })
}

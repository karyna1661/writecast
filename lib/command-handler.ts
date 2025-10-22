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
  canPlayGame,
  useGameInvite,
  getGameInviteStatus,
  getPlayerGameSession,
  getPlayerStats,
} from "@/lib/actions/game-actions"
import { joinWaitlist, getWaitlistCount } from "@/lib/actions/waitlist-actions"
import { useFarcaster } from "@/contexts/FarcasterContext"
import { terminalHaptics } from "@/lib/farcaster/haptics"

// Helper function to check if authentication is required
function requiresAuth(
  farcasterContext: any,
  addMessage: (msg: CliMessage) => void,
  action: string = "this action"
): boolean {
  if (!farcasterContext?.auth?.isAuthenticated) {
    addMessage({
      type: "error",
      content: `🔒 Authentication Required

You need to sign in with Farcaster to ${action}.

Run 'login' to authenticate and unlock:
  ✓ Game creation & authorship
  ✓ Social sharing on Farcaster
  ✓ Leaderboard rankings
  ✓ Profile features

Guests can still play all games!

💡 Type 'login' to get started`,
      timestamp: Date.now(),
    })
    return false
  }
  return true
}

// Helper function to get current user ID (authenticated or anonymous)
function getCurrentUserId(farcasterContext?: any): string {
  if (farcasterContext?.auth?.isAuthenticated && farcasterContext.auth.user) {
    return `farcaster_${farcasterContext.auth.user.fid}`
  }
  return "anonymous_user"
}

// Helper function to get current user info for database storage
function getCurrentUserInfo(farcasterContext?: any): { userId: string; username?: string; displayName?: string } {
  if (farcasterContext?.auth?.isAuthenticated && farcasterContext.auth.user) {
    return {
      userId: `farcaster_${farcasterContext.auth.user.fid}`,
      username: farcasterContext.auth.user.username,
      displayName: farcasterContext.auth.user.displayName || farcasterContext.auth.user.username
    }
  }
  return { userId: "anonymous_user" }
}

export async function handleCommand(
  input: string,
  gameState: GameState,
  setGameState: (state: GameState) => void,
  addMessage: (msg: CliMessage) => void,
  farcasterContext?: any,
): Promise<void> {
  const { command, args, rawArgs } = parseCommand(input)

  // Add command to history
  addMessage({ type: "command", content: input, timestamp: Date.now() })

  switch (command) {
    case "help":
      addMessage({ type: "output", content: HELP_TEXT, timestamp: Date.now() })
      break

    case "games":
      await handleGames(addMessage, farcasterContext)
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
      handleCreate(args, rawArgs, gameState, setGameState, addMessage, farcasterContext)
      break

    case "frame":
      handleFrame(gameState, setGameState, addMessage, farcasterContext)
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
      await handleConfirm(gameState, setGameState, addMessage, farcasterContext)
      break

    case "play":
      await handlePlay(args, gameState, setGameState, addMessage, farcasterContext)
      break

    case "guess":
      await handleGuess(rawArgs, gameState, setGameState, addMessage, farcasterContext)
      break

    case "invite":
      await handleInvite(rawArgs, gameState, setGameState, addMessage, farcasterContext)
      break

    case "reveal":
      await handleReveal(args, addMessage, farcasterContext)
      break

    case "leaderboard":
      await handleLeaderboard(addMessage)
      break

    case "notify":
      await handleNotify(rawArgs, addMessage)
      break

    // Farcaster Authentication Commands
    case "login":
      await handleLogin(addMessage, farcasterContext)
      break

    case "auth":
      await handleAuth(addMessage, farcasterContext)
      break

    case "whoami":
      handleWhoami(addMessage, farcasterContext)
      break

    case "logout":
      handleLogout(addMessage, farcasterContext)
      break

    // Farcaster Social Commands
    case "share":
      await handleShare(args, addMessage, farcasterContext)
      break

    case "invite":
      await handleInvite(rawArgs, gameState, setGameState, addMessage, farcasterContext)
      break

    case "profile":
      await handleProfile(rawArgs, addMessage, farcasterContext)
      break

    // Farcaster Navigation Commands
    case "open":
      await handleOpen(rawArgs, addMessage, farcasterContext)
      break

    case "home":
      await handleHome(addMessage, farcasterContext)
      break

    case "install":
      await handleInstall(addMessage, farcasterContext)
      break

    default:
      // Check if user is in an active game and typed a word (likely meant to guess)
      if (gameState.currentGame && gameState.step === "playing" && command && !command.startsWith('/')) {
      addMessage({
        type: "error",
          content: `💡 Hint: Did you mean 'guess ${command}'?\n\nUse 'guess <word>' to submit your answer.`,
          timestamp: Date.now(),
        })
      } else {
        addMessage({
          type: "error",
          content: `Unknown command: '${command}'.\n\nType 'help' for available commands.`,
        timestamp: Date.now(),
      })
      }
  }
}

async function handleGames(addMessage: (msg: CliMessage) => void, farcasterContext?: any) {
  console.log("[v0] Fetching available games from database...")
  
  // Get current user ID for filtering
  const userId = getCurrentUserId(farcasterContext)
  const { data: games, error } = await getAllGames(userId)

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
      content: `No games available for you to play.\n\nThis could mean:\n  • You've completed all available games\n  • You created all available games\n  • No games exist in the database\n\nTry creating a new game or ask someone to share a game code!`,
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
AVAILABLE GAMES FOR YOU (${games.length} total)
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
  farcasterContext?: any,
) {
  // Check authentication
  if (!requiresAuth(farcasterContext, addMessage, "create games")) {
    return
  }

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
  farcasterContext?: any,
) {
  // Check authentication
  if (!requiresAuth(farcasterContext, addMessage, "create games")) {
    return
  }

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
  farcasterContext?: any,
) {
  // Check authentication
  if (!requiresAuth(farcasterContext, addMessage, "publish games")) {
    return
  }

  if (!gameState.mode || !gameState.hiddenWord || !gameState.masterpiece) {
    addMessage({
      type: "error",
      content: "Complete your game first! You need a hidden word and masterpiece text.",
      timestamp: Date.now(),
    })
    return
  }

  addMessage({ type: "output", content: "Creating game...", timestamp: Date.now() })

  // Use hybrid authentication - authenticated users get Farcaster ID, anonymous get generic ID
  const userInfo = getCurrentUserInfo(farcasterContext)
  console.log("[v0] Getting or creating author...", { userInfo })
  const { data: user, error: userError } = await getOrCreateUser(userInfo)
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
    const errorMsg = gameError?.includes("Failed to fetch") || gameError?.includes("NetworkError")
      ? "Database connection failed. Please ensure Supabase environment variables are configured in Vercel."
      : `Failed to create game: ${gameError || "Unknown error"}`
    
    addMessage({
      type: "error",
      content: errorMsg,
      timestamp: Date.now(),
    })
    return
  }

  setGameState({
    ...gameState,
    gameId: gameCode,
    step: "idle",
  })

  // Trigger success haptic feedback for game creation
  await terminalHaptics.gameCreated()

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
  farcasterContext?: any,
) {
  if (!args[0]) {
    addMessage({
      type: "error",
      content: "Usage: play <gameId>\nExample: play ABC123\n\nType 'games' to see all available games!",
      timestamp: Date.now(),
    })
    return
  }

  const gameId = args[0].toUpperCase()

  const { data: game, error } = await getGameByCode(gameId)

  if (error || !game) {
    addMessage({
      type: "error",
      content: `Game not found: ${gameId}\n\nType 'games' to see all available games!`,
      timestamp: Date.now(),
    })
    return
  }

  // Get or create player
  const userInfo = getCurrentUserInfo(farcasterContext)
  const { data: user, error: userError } = await getOrCreateUser(userInfo)
  if (userError || !user) {
    addMessage({
      type: "error",
      content: "Failed to initialize player. Please try again.",
      timestamp: Date.now(),
    })
    return
  }

  // Check if player is the author
  if (game.author_id === user.id) {
    addMessage({
      type: "error",
      content: "You created this game\n\nType 'games' to see available games you can play!",
      timestamp: Date.now(),
    })
    return
  }

  // Check if player has already completed this game  
  const { data: existingSession } = await getPlayerGameSession(game.id, user.id)
  if (existingSession && (existingSession.status === "won" || existingSession.status === "lost")) {
    addMessage({
      type: "error",
      content: "You already completed this game\n\nType 'games' to see available games you can play!",
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
${"-".repeat(60)}
GAME LOADED: ${gameId} (${modeText})
${"-".repeat(60)}

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
  farcasterContext?: any,
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

  // Use hybrid authentication - authenticated users get Farcaster ID, anonymous get generic ID
  const userInfo = getCurrentUserInfo(farcasterContext)
  const { data: user, error: userError } = await getOrCreateUser(userInfo)
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

  console.log("[DEBUG] submitGuess result:", result)

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
    // Trigger success haptic feedback
    await terminalHaptics.correctGuess()

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
      // Trigger error haptic feedback for game lost
      await terminalHaptics.gameLost()

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
        // Trigger error haptic feedback for wrong guess
        await terminalHaptics.wrongGuess()

        setGameState({
          ...gameState,
          attempts: result.attempt_number,
        })

        const remainingAttempts = (result.max_attempts || 3) - result.attempt_number
        console.log("[DEBUG] Attempts calculation:", {
          attempt_number: result.attempt_number,
          max_attempts: result.max_attempts,
          remainingAttempts,
          gameStateAttempts: gameState.attempts
        })
        let message = `Incorrect! Attempts: ${result.attempt_number}/${result.max_attempts || 3}\nAttempts remaining: ${remainingAttempts}\nTry again: guess <word>`
        
        // Show invite prompt if on 3rd wrong attempt and haven't used invite
        if (result.attempt_number === 3 && result.can_invite && farcasterContext?.auth?.isAuthenticated) {
          message += `\n\n💡 Out of attempts! Use 'invite @friend' to get 1 bonus attempt and keep playing!`
        }

        addMessage({
          type: "error",
          content: message,
          timestamp: Date.now(),
        })
      }
  }
}

async function handleInvite(
  rawArgs: string,
  gameState: GameState,
  setGameState: (state: GameState) => void,
  addMessage: (msg: CliMessage) => void,
  farcasterContext?: any,
) {
  // Check authentication first
  if (!requiresAuth(farcasterContext, addMessage, "invite friends and share on Farcaster")) {
    return
  }

  if (!gameState.currentGame) {
    addMessage({
      type: "error",
      content: "No active game! Use 'play <gameId>' to start a game first.",
      timestamp: Date.now(),
    })
    return
  }

  if (!rawArgs) {
    addMessage({
      type: "error",
      content: "Usage: invite @username\nExample: invite @friend\n\nThis gives you 1 bonus attempt if your friend helps!",
      timestamp: Date.now(),
    })
    return
  }

  const invitedUsername = rawArgs.trim()
  
  // Validate username format
  if (!invitedUsername.startsWith("@")) {
    addMessage({
      type: "error",
      content: "Username must start with @\nExample: invite @friend",
      timestamp: Date.now(),
    })
    return
  }

  addMessage({ type: "output", content: "Sending invite for help...", timestamp: Date.now() })

  // Get current user info
  const userInfo = getCurrentUserInfo(farcasterContext)
  const { data: user, error: userError } = await getOrCreateUser(userInfo)
  if (userError || !user) {
    addMessage({
      type: "error",
      content: "Failed to get player info. Please try again.",
      timestamp: Date.now(),
    })
    return
  }

  // Get game ID
  const { data: game, error: gameError } = await getGameByCode(gameState.currentGameId)
  if (gameError || !game) {
    addMessage({
      type: "error",
      content: "Failed to load game. Please try again.",
      timestamp: Date.now(),
    })
    return
  }

  // Use invite
  const { data: inviteResult, error: inviteError } = await useGameInvite(
    game.id,
    user.id,
    invitedUsername
  )

  if (inviteError || !inviteResult) {
    addMessage({
      type: "error",
      content: `Failed to send invite: ${inviteError || "Unknown error"}`,
      timestamp: Date.now(),
    })
    return
  }

  if (inviteResult.error) {
    addMessage({
      type: "error",
      content: inviteResult.error,
      timestamp: Date.now(),
    })
    return
  }

  // Compose cast with embedded game
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://writecast-1.vercel.app"
  const gameUrl = `${baseUrl}/?code=${gameState.currentGameId}`
  
  const castText = `${invitedUsername} I need your help! 🆘

Can you solve this word puzzle I'm stuck on?
Game: ${gameState.currentGameId}

If you win, we both earn points! 🎯`

  try {
    await farcasterContext.shareGame(gameState.currentGameId, "invite", {
      text: castText,
      embeds: [gameUrl],
      mentionedUsers: [invitedUsername]
    })

  // Trigger success haptic feedback
  await terminalHaptics.success()

  addMessage({
    type: "success",
    content: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HELP REQUESTED! 📞
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invited: ${invitedUsername}
Game: ${gameState.currentGameId}

You now have 4 total attempts!
If ${invitedUsername} wins, you both earn bonus points!

Cast composed - share it now! 🚀
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      timestamp: Date.now(),
    })
  } catch (error) {
    addMessage({
      type: "error",
      content: `Failed to compose cast: ${error instanceof Error ? error.message : "Unknown error"}`,
    timestamp: Date.now(),
  })
  }
}

async function handleReveal(args: string[], addMessage: (msg: CliMessage) => void, farcasterContext?: any) {
  if (!args[0]) {
    addMessage({
      type: "error",
      content: "Usage: reveal <gameId>\nExample: reveal ABC123",
      timestamp: Date.now(),
    })
    return
  }

  const gameId = args[0].toUpperCase()

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
  
  // Calculate game age
  const now = new Date()
  const created = new Date(game.created_at)
  const ageHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  const isExpired = ageHours >= 24
  const remainingHours = Math.max(0, 24 - ageHours)
  let reaction = ""
  if (Number.parseFloat(successRate) < 30) reaction = "🔥 BRUTAL! "
  else if (Number.parseFloat(successRate) < 50) reaction = "💪 TOUGH! "
  else if (Number.parseFloat(successRate) > 80) reaction = "✨ POPULAR! "
  else reaction = "🎯 BALANCED! "

  // Check if current user is author or player
  const userId = getCurrentUserId(farcasterContext)
  const userInfo = getCurrentUserInfo(farcasterContext)
  const isAuthor = farcasterContext?.auth?.isAuthenticated && 
    game.author_id === userInfo.userId
  
  // Get user's session if they played this game
  let yourSession = null
  if (farcasterContext?.auth?.isAuthenticated) {
    const { data: session } = await getPlayerGameSession(game.id, userId)
    yourSession = session
  }

  let authorSection = ""
  let playerSection = ""
  let suggestionSection = ""
  let answerSection = ""

  if (isAuthor) {
    authorSection = `
🎨 YOU CREATED THIS GAME!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Your masterpiece stumped ${game.failed_guesses} players!
Earnings: ${game.failed_guesses * 5} points

${game.failed_guesses > 5 ? "🏆 Excellent difficulty!" : game.failed_guesses > 2 ? "👍 Good challenge!" : "💡 Consider making it harder!"}`
    
    if (game.total_players > 0) {
      suggestionSection = `
💡 Share this success: share ${gameId}`
    }
  } else if (yourSession) {
    if (yourSession.status === "won") {
      playerSection = `
🎉 YOU SOLVED IT!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You guessed it in ${yourSession.total_attempts} attempts!
Points earned: ${yourSession.points_earned}

${yourSession.total_attempts === 1 ? "🏆 Perfect! First try!" : "🎯 Well done!"}`
    } else {
      playerSection = `
😅 YOU GAVE IT YOUR BEST!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You tried ${yourSession.total_attempts} times
Points earned: ${yourSession.points_earned}

Better luck next time!`
    }
  } else {
    suggestionSection = `
💡 Want to play? Type: play ${gameId}`
  }

  // Show answer only if game is expired
  if (isExpired) {
    answerSection = `
🔓 ANSWER REVEALED:
Hidden Word: ${game.hidden_word}

Game completed after 24 hours`
  } else {
    answerSection = `
✨ Answer will be revealed in ${remainingHours.toFixed(1)} hours`
  }

  const statusText = isExpired ? "Completed" : `Active (ends in ${remainingHours.toFixed(1)}h)`

  const stats = `
${"━".repeat(60)}
${reaction}GAME STATS: ${gameId}
${"━".repeat(60)}

Game Mode: ${game.game_type === "fill-blank" ? "Fill-in-Blank" : "Frame-the-Word"}
Status: ${statusText}

STATISTICS:
  Total Players: ${game.total_players}
  Winners: ${game.successful_guesses} (${successRate}%)
  Failed: ${game.failed_guesses} (${(100 - Number.parseFloat(successRate)).toFixed(1)}%)
  Total Attempts: ${game.total_attempts}

AUTHOR EARNINGS: ${game.failed_guesses * 5} pts
(5 points per failed guess)${authorSection}${playerSection}${suggestionSection}${answerSection}
${"━".repeat(60)}`

  addMessage({ type: "output", content: stats, timestamp: Date.now() })
}

async function handleLeaderboard(addMessage: (msg: CliMessage) => void) {
  const { data: players, error: playersError } = await getPlayerLeaderboard(5)
  const { data: authors, error: authorsError } = await getAuthorLeaderboard(5)

  if (playersError || authorsError) {
    const errorMsg = playersError?.includes("Failed to fetch") || authorsError?.includes("Failed to fetch")
      ? "Database connection failed. Please ensure Supabase environment variables are configured in Vercel."
      : "Failed to load leaderboard. Please try again."
    
    addMessage({
      type: "error",
      content: errorMsg,
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

// ============================================================================
// FARCASTER COMMAND HANDLERS
// ============================================================================

async function handleLogin(addMessage: (msg: CliMessage) => void, farcasterContext?: any) {
  if (!farcasterContext) {
    addMessage({
      type: "error",
      content: "Farcaster SDK not available. Please ensure you're running in a Farcaster environment.",
      timestamp: Date.now(),
    })
    return
  }

  // If already authenticated, show benefits
  if (farcasterContext.auth.isAuthenticated) {
    addMessage({
      type: "success",
      content: `Already signed in as @${farcasterContext.auth.user?.username}!\n\nBenefits:\n  ✓ Create and publish games\n  ✓ Share games on Farcaster\n  ✓ Appear on leaderboards\n  ✓ Track your game stats`,
      timestamp: Date.now(),
    })
    return
  }

  // If not authenticated, explain benefits
  addMessage({
    type: "output",
    content: "Sign in with Farcaster to unlock:\n  • Game creation\n  • Social sharing\n  • Leaderboard rankings\n  • Game authorship\n\nGuests can still play all games!",
    timestamp: Date.now(),
  })

  try {
    addMessage({
      type: "output",
      content: "[Farcaster SDK] Initializing authentication...",
      timestamp: Date.now(),
    })

    await farcasterContext.login()

    // Trigger success haptic feedback for login
    await terminalHaptics.loginSuccess()

    addMessage({
      type: "success",
      content: `✓ Logged in as @${farcasterContext.auth.user?.username || "user"}`,
      timestamp: Date.now(),
    })
  } catch (error) {
    addMessage({
      type: "error",
      content: `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: Date.now(),
    })
  }
}

async function handleAuth(addMessage: (msg: CliMessage) => void, farcasterContext?: any) {
  if (!farcasterContext) {
    addMessage({
      type: "error",
      content: "Farcaster SDK not available.",
      timestamp: Date.now(),
    })
    return
  }

  try {
    const token = await farcasterContext.getToken()
    
    if (token) {
      addMessage({
        type: "success",
        content: `Authentication token retrieved:
${token.substring(0, 50)}...`,
        timestamp: Date.now(),
      })
    } else {
      addMessage({
        type: "error",
        content: "No authentication token found. Please run 'login' first.",
        timestamp: Date.now(),
      })
    }
  } catch (error) {
    addMessage({
      type: "error",
      content: `Failed to get token: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: Date.now(),
    })
  }
}

function handleWhoami(addMessage: (msg: CliMessage) => void, farcasterContext?: any) {
  if (!farcasterContext) {
    addMessage({
      type: "error",
      content: "Farcaster SDK not available.",
      timestamp: Date.now(),
    })
    return
  }

  if (farcasterContext.auth.isAuthenticated && farcasterContext.auth.user) {
    const user = farcasterContext.auth.user
    addMessage({
      type: "output",
      content: `Current user:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Username: @${user.username}
Display Name: ${user.displayName}
FID: ${user.fid}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      timestamp: Date.now(),
    })
  } else {
    addMessage({
      type: "error",
      content: "Not logged in. Run 'login' to authenticate.",
      timestamp: Date.now(),
    })
  }
}

function handleLogout(addMessage: (msg: CliMessage) => void, farcasterContext?: any) {
  if (!farcasterContext) {
    addMessage({
      type: "error",
      content: "Farcaster SDK not available.",
      timestamp: Date.now(),
    })
    return
  }

  farcasterContext.logout()
  addMessage({
    type: "success",
    content: "✓ Logged out successfully",
    timestamp: Date.now(),
  })
}

async function handleShare(args: string[], addMessage: (msg: CliMessage) => void, farcasterContext?: any) {
  // Check authentication
  if (!requiresAuth(farcasterContext, addMessage, "share games")) {
    return
  }

  if (!args[0]) {
    addMessage({
      type: "error",
      content: "Usage: share <gameId>\nExample: share ABC123",
      timestamp: Date.now(),
    })
    return
  }

  if (!farcasterContext) {
    addMessage({
      type: "error",
      content: "Farcaster SDK not available.",
      timestamp: Date.now(),
    })
    return
  }

  const gameId = args[0].toUpperCase()

  try {
    addMessage({
      type: "output",
      content: "[Preparing cast...]",
      timestamp: Date.now(),
    })

    await farcasterContext.shareGame(gameId, "created")

    // Trigger success haptic feedback for share
    await terminalHaptics.shareSuccess()

    addMessage({
      type: "success",
      content: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHARE TO FARCASTER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Cast composed successfully!
✓ Share recorded

Your game ${gameId} is now live on Farcaster!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      timestamp: Date.now(),
    })
  } catch (error) {
    addMessage({
      type: "error",
      content: `Failed to share game: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: Date.now(),
    })
  }
}

async function handleProfile(rawArgs: string, addMessage: (msg: CliMessage) => void, farcasterContext?: any) {
  if (!rawArgs) {
    addMessage({
      type: "error",
      content: "Usage: profile @username\nExample: profile @friend",
      timestamp: Date.now(),
    })
    return
  }

  const username = rawArgs.trim().replace('@', '')
  
  // Fetch user stats from database
  const { data: user, error } = await getPlayerStats(username)

  if (error || !user) {
    addMessage({
      type: "error",
      content: `Player not found: @${username}\n\nThey may not have played Writecast yet.`,
      timestamp: Date.now(),
    })
    return
  }

  const winRate = user.total_games_played > 0 
    ? ((user.total_games_won || 0) / user.total_games_played * 100).toFixed(1)
    : "0.0"

  const stats = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PLAYER STATS: @${username}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AS PLAYER:
  Games Played: ${user.total_games_played}
  Games Won: ${user.total_games_won || 0} (${winRate}% win rate)
  Total Points: ${user.total_points_earned}

AS AUTHOR:
  Games Created: ${user.total_games_created}
  Author Points: ${user.total_points_as_author}
  
OVERALL RANK: #${user.leaderboard_rank || 'Unranked'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`

  addMessage({ type: "output", content: stats, timestamp: Date.now() })
}

async function handleOpen(rawArgs: string, addMessage: (msg: CliMessage) => void, farcasterContext?: any) {
  if (!rawArgs) {
    addMessage({
      type: "error",
      content: "Usage: open <url>\nExample: open https://example.com",
      timestamp: Date.now(),
    })
    return
  }

  if (!farcasterContext) {
    addMessage({
      type: "error",
      content: "Farcaster SDK not available.",
      timestamp: Date.now(),
    })
    return
  }

  const url = rawArgs.trim()

  try {
    addMessage({
      type: "output",
      content: `[Opening ${url}...]`,
      timestamp: Date.now(),
    })

    await farcasterContext.viewProfile(url) // Using viewProfile as proxy for openUrl

    addMessage({
      type: "success",
      content: `✓ URL opened: ${url}`,
      timestamp: Date.now(),
    })
  } catch (error) {
    addMessage({
      type: "error",
      content: `Failed to open URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: Date.now(),
    })
  }
}

async function handleHome(addMessage: (msg: CliMessage) => void, farcasterContext?: any) {
  if (!farcasterContext) {
    addMessage({
      type: "error",
      content: "Farcaster SDK not available.",
      timestamp: Date.now(),
    })
    return
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://writecast.vercel.app"
    
    addMessage({
      type: "output",
      content: `[Opening Writecast mini app...]`,
      timestamp: Date.now(),
    })

    await farcasterContext.inviteUser(appUrl)

    addMessage({
      type: "success",
      content: `✓ Writecast mini app opened`,
      timestamp: Date.now(),
    })
  } catch (error) {
    addMessage({
      type: "error",
      content: `Failed to open mini app: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: Date.now(),
    })
  }
}

async function handleInstall(addMessage: (msg: CliMessage) => void, farcasterContext?: any) {
  if (!farcasterContext || !farcasterContext.isAvailable) {
    addMessage({
      type: "error",
      content: "Farcaster SDK not available. This command only works in the Farcaster Mini App.",
      timestamp: Date.now(),
    })
    return
  }

  try {
    addMessage({
      type: "output",
      content: `Adding Writecast to your mini apps...`,
      timestamp: Date.now(),
    })

    // Use the correct SDK method to add mini app
    await farcasterContext.addMiniApp()

    // Trigger success haptic feedback
    await terminalHaptics.success()

    addMessage({
      type: "success",
      content: `✓ Writecast has been added to your mini apps!\n\nYou can now access it anytime from your Farcaster mini apps menu.`,
      timestamp: Date.now(),
    })
  } catch (error) {
    addMessage({
      type: "error",
      content: `Failed to add mini app: ${error instanceof Error ? error.message : "Unknown error"}`,
      timestamp: Date.now(),
    })
  }
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

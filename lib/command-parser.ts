export interface ParsedCommand {
  command: string
  args: string[]
  rawArgs: string
}

export function parseCommand(input: string): ParsedCommand {
  const trimmed = input.trim()
  const parts = trimmed.split(/\s+/)
  const command = parts[0].toLowerCase()
  const args = parts.slice(1)
  const rawArgs = trimmed.substring(command.length).trim()

  return {
    command,
    args,
    rawArgs,
  }
}

export const HELP_TEXT = `
Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GAME CREATION:
  create <word>           Start creating a fill-in-blank game
  frame                   Start creating a frame-the-word game
  write <text>            Write your masterpiece text
  keyword <word>          Set the framing keyword (frame mode only)
  preview                 Preview your game before publishing
  confirm                 Publish your game and get a game ID

GAMEPLAY:
  games                   Browse available demo games
  play <gameId>           Start playing a game
  guess <word>            Make a guess in the current game
  reveal <gameId>         View results and stats for a game

NAVIGATION:
  menu                    Return to main menu
  leaderboard             View top players and authors
  notify                  Join waitlist for Farcaster mini app launch
  help                    Show this help message
  clear                   Clear terminal history

EXAMPLES:
  $ games
  $ play ABC123
  $ guess innovation
  $ create wisdom
  $ write True wisdom comes from experience
  $ notify user@email.com
  $ notify @farcasteruser
`

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

SOCIAL & SHARING:
  share <gameId>          Share game to Farcaster
  invite @username        Invite user to mini app
  profile @user           View Farcaster profile

AUTHENTICATION:
  login                   Sign in with Farcaster
  auth                    Get authentication token
  whoami                  Show current user
  logout                  Sign out

NAVIGATION:
  open <url>              Open external URL
  home                    Return to main app
  install                 Add Writecast to mini apps
  menu                    Return to main menu

UTILITIES:
  leaderboard             View top players and authors
  notify                  Join waitlist for Farcaster mini app launch
  help                    Show this help message
  clear                   Clear terminal history

EXAMPLES:
  $ login
  $ create wisdom
  $ write True wisdom comes from experience
  $ share ABC123
  $ play ABC123
  $ guess innovation
  $ notify user@email.com
  $ notify @farcasteruser
`

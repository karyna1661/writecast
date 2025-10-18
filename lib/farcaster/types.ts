export interface FarcasterUser {
  fid: number
  username: string
  displayName: string
  pfpUrl?: string
  bio?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: FarcasterUser | null
  token: string | null
  isLoading: boolean
}

export interface ShareTemplate {
  gameCreated: (gameCode: string) => string
  gameWon: (gameCode: string, attempts: number) => string
  gameInvite: (gameCode: string, username: string) => string
}

export interface PrimaryButtonConfig {
  text: string
  action: () => void
  disabled?: boolean
}

export interface HapticFeedback {
  success: () => Promise<void>
  error: () => Promise<void>
  warning: () => Promise<void>
  light: () => Promise<void>
  medium: () => Promise<void>
  heavy: () => Promise<void>
}

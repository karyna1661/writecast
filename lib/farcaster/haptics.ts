import { farcasterSDK } from "./sdk-client"

export interface HapticFeedback {
  success: () => Promise<void>
  error: () => Promise<void>
  warning: () => Promise<void>
  light: () => Promise<void>
  medium: () => Promise<void>
  heavy: () => Promise<void>
}

export class HapticManager {
  private static instance: HapticManager
  private isEnabled: boolean = true

  private constructor() {}

  static getInstance(): HapticManager {
    if (!HapticManager.instance) {
      HapticManager.instance = new HapticManager()
    }
    return HapticManager.instance
  }

  enable(): void {
    this.isEnabled = true
  }

  disable(): void {
    this.isEnabled = false
  }

  private async triggerHaptic(type: "success" | "error" | "warning" | "light" | "medium" | "heavy"): Promise<void> {
    if (!this.isEnabled) return

    try {
      if (type === "success" || type === "error" || type === "warning") {
        await farcasterSDK.haptics.notification(type)
      } else {
        await farcasterSDK.haptics.impact(type)
      }
    } catch (error) {
      console.warn("Haptic feedback failed:", error)
    }
  }

  async success(): Promise<void> {
    await this.triggerHaptic("success")
  }

  async error(): Promise<void> {
    await this.triggerHaptic("error")
  }

  async warning(): Promise<void> {
    await this.triggerHaptic("warning")
  }

  async light(): Promise<void> {
    await this.triggerHaptic("light")
  }

  async medium(): Promise<void> {
    await this.triggerHaptic("medium")
  }

  async heavy(): Promise<void> {
    await this.triggerHaptic("heavy")
  }
}

// Terminal-specific haptic patterns
export class TerminalHaptics {
  private hapticManager: HapticManager

  constructor() {
    this.hapticManager = HapticManager.getInstance()
  }

  // Game action haptics
  async correctGuess(): Promise<void> {
    await this.hapticManager.success()
  }

  async wrongGuess(): Promise<void> {
    await this.hapticManager.error()
  }

  async gameCreated(): Promise<void> {
    await this.hapticManager.success()
  }

  async gameWon(): Promise<void> {
    await this.hapticManager.success()
  }

  async gameLost(): Promise<void> {
    await this.hapticManager.warning()
  }

  // Command execution haptics
  async commandExecuted(): Promise<void> {
    await this.hapticManager.light()
  }

  async commandError(): Promise<void> {
    await this.hapticManager.error()
  }

  // Authentication haptics
  async loginSuccess(): Promise<void> {
    await this.hapticManager.success()
  }

  async loginError(): Promise<void> {
    await this.hapticManager.error()
  }

  // Social action haptics
  async shareSuccess(): Promise<void> {
    await this.hapticManager.success()
  }

  async inviteSent(): Promise<void> {
    await this.hapticManager.light()
  }

  // Navigation haptics
  async pageTransition(): Promise<void> {
    await this.hapticManager.light()
  }

  async deepLinkOpened(): Promise<void> {
    await this.hapticManager.medium()
  }
}

// Export singleton instance
export const terminalHaptics = new TerminalHaptics()

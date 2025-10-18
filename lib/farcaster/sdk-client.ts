import { sdk } from "@farcaster/miniapp-sdk"

export interface FarcasterSDK {
  actions: {
    signIn: () => Promise<void>
    composeCast: (text: string) => Promise<void>
    openMiniApp: (url: string) => Promise<void>
    openUrl: (url: string) => Promise<void>
    viewProfile: (username: string) => Promise<void>
    setPrimaryButton: (config: { text: string; action: () => void }) => Promise<void>
    addMiniApp: () => Promise<void>
    close: () => Promise<void>
    ready: () => Promise<void>
  }
  quickAuth: {
    getToken: () => Promise<{ token: string } | null>
    fetch: (url: string, options?: RequestInit) => Promise<Response>
  }
  haptics: {
    impact: (style: "light" | "medium" | "heavy") => Promise<void>
    notification: (type: "success" | "warning" | "error") => Promise<void>
  }
  getChains: () => Promise<any[]>
}

// Safe SDK wrapper with error handling
export const farcasterSDK = {
  actions: {
    signIn: async () => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await sdk.actions.signIn()
    },
    composeCast: async (text: string) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await sdk.actions.composeCast(text)
    },
    openMiniApp: async (url: string) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await sdk.actions.openMiniApp(url)
    },
    openUrl: async (url: string) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await sdk.actions.openUrl(url)
    },
    viewProfile: async (username: string) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await sdk.actions.viewProfile(username)
    },
    setPrimaryButton: async (config: { text: string; action: () => void }) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await sdk.actions.setPrimaryButton(config)
    },
    addMiniApp: async () => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await sdk.actions.addMiniApp()
    },
    close: async () => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await sdk.actions.close()
    },
    ready: async () => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await sdk.actions.ready()
    },
  },
  quickAuth: {
    getToken: async () => {
      if (!isFarcasterAvailable()) return null
      try {
        const result = await sdk.quickAuth.getToken()
        return result?.token ? { token: result.token } : null
      } catch (error) {
        console.warn("Failed to get token:", error)
        return null
      }
    },
    fetch: async (url: string, options?: RequestInit) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await sdk.quickAuth.fetch(url, options)
    },
  },
  haptics: {
    impact: async (style: "light" | "medium" | "heavy") => {
      if (!isFarcasterAvailable()) return
      try {
        return await sdk.haptics.impact(style)
      } catch (error) {
        console.warn("Haptic impact failed:", error)
      }
    },
    notification: async (type: "success" | "warning" | "error") => {
      if (!isFarcasterAvailable()) return
      try {
        return await sdk.haptics.notification(type)
      } catch (error) {
        console.warn("Haptic notification failed:", error)
      }
    },
  },
  getChains: async () => {
    if (!isFarcasterAvailable()) return []
    try {
      return await sdk.getChains()
    } catch (error) {
      console.warn("Failed to get chains:", error)
      return []
    }
  },
} as FarcasterSDK

export function isFarcasterAvailable(): boolean {
  return typeof window !== "undefined" && typeof sdk !== "undefined" && sdk !== null
}

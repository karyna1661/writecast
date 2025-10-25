import { sdk } from "@farcaster/miniapp-sdk"

// Simple rate limiter to prevent too many SDK calls
class RateLimiter {
  private lastCall: number = 0
  private minInterval: number = 100 // Minimum 100ms between calls

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now()
    const timeSinceLastCall = now - this.lastCall
    
    if (timeSinceLastCall < this.minInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minInterval - timeSinceLastCall))
    }
    
    this.lastCall = Date.now()
    return fn()
  }
}

const rateLimiter = new RateLimiter()

export interface FarcasterSDK {
  actions: {
    signIn: () => Promise<any>
    composeCast: (text: string, options?: any) => Promise<any>
    openMiniApp: (options: any) => Promise<any>
    openUrl: (url: string) => Promise<any>
    viewProfile: (options: any) => Promise<any>
    setPrimaryButton: (config: { text: string; action: () => void }) => Promise<any>
    addMiniApp: () => Promise<any>
    close: () => Promise<any>
    ready: () => Promise<any>
  }
  quickAuth: {
    getToken: () => Promise<{ token: string } | null>
    fetch: (url: string, options?: RequestInit) => Promise<Response>
  }
  haptics: {
    impactOccurred: (style: "light" | "medium" | "heavy") => Promise<void>
    notificationOccurred: (type: "success" | "warning" | "error") => Promise<void>
  }
  getChains: () => Promise<any[]>
}

// Safe SDK wrapper with error handling and rate limiting
export const farcasterSDK = {
  actions: {
    signIn: async () => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      // Use loose typing to accommodate SDK signature variations
      return await rateLimiter.throttle(() => (sdk as any).actions.signIn())
    },
    composeCast: async (text: string, options?: any) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      console.log("composeCast called with:", { text, options })
      
      // Use the correct Farcaster Mini App SDK format
      const castData = {
        text,
        embeds: options?.embeds || []
      }
      
      console.log("Sending cast data:", castData)
      return await rateLimiter.throttle(() => (sdk as any).actions.composeCast(castData))
    },
    openMiniApp: async (options: any) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await rateLimiter.throttle(() => (sdk as any).actions.openMiniApp(options))
    },
    openUrl: async (url: string) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await rateLimiter.throttle(() => (sdk as any).actions.openUrl(url))
    },
    viewProfile: async (options: any) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await rateLimiter.throttle(() => (sdk as any).actions.viewProfile(options))
    },
    setPrimaryButton: async (config: { text: string; action: () => void }) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await rateLimiter.throttle(() => (sdk as any).actions.setPrimaryButton(config))
    },
    addMiniApp: async () => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await rateLimiter.throttle(() => (sdk as any).actions.addMiniApp())
    },
    close: async () => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await rateLimiter.throttle(() => (sdk as any).actions.close())
    },
    ready: async () => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await rateLimiter.throttle(() => (sdk as any).actions.ready())
    },
  },
  quickAuth: {
    getToken: async () => {
      if (!isFarcasterAvailable()) return null
      try {
        const result: any = await rateLimiter.throttle(() => (sdk as any).quickAuth.getToken())
        return result && typeof result.token === "string" ? { token: result.token } : null
      } catch (error) {
        console.warn("Failed to get token:", error)
        return null
      }
    },
    fetch: async (url: string, options?: RequestInit) => {
      if (!isFarcasterAvailable()) throw new Error("SDK not available")
      return await rateLimiter.throttle(() => (sdk as any).quickAuth.fetch(url, options))
    },
  },
  haptics: {
    impactOccurred: async (style: "light" | "medium" | "heavy") => {
      if (!isFarcasterAvailable()) return
      try {
        return await rateLimiter.throttle(() => (sdk as any).haptics.impactOccurred(style))
      } catch (error) {
        console.warn("Haptic impact failed:", error)
      }
    },
    notificationOccurred: async (type: "success" | "warning" | "error") => {
      if (!isFarcasterAvailable()) return
      try {
        return await rateLimiter.throttle(() => (sdk as any).haptics.notificationOccurred(type))
      } catch (error) {
        console.warn("Haptic notification failed:", error)
      }
    },
  },
  getChains: async () => {
    if (!isFarcasterAvailable()) return []
    try {
      return await rateLimiter.throttle(() => (sdk as any).getChains())
    } catch (error) {
      console.warn("Failed to get chains:", error)
      return []
    }
  },
} as FarcasterSDK

export function isFarcasterAvailable(): boolean {
  try {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return false
    }
    
    // PRIMARY CHECK: SDK object existence (most reliable)
    const sdkAvailable = (
      typeof sdk !== "undefined" && 
      sdk !== null &&
      sdk.actions &&
      typeof sdk.actions.ready === "function"
    )
    
    // If SDK is available, we're in a Farcaster environment
    if (sdkAvailable) {
      console.log("Farcaster SDK detected and available")
      return true
    }
    
    // SECONDARY CHECK: User agent (only as hint for early detection)
    const isLikelyMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
    
    if (isLikelyMobile) {
      // On mobile but SDK not ready yet - might still load
      console.log("Mobile device detected but SDK not ready yet - optimistically returning true")
      return true // Optimistically return true and wait for SDK
    }
    
    // Desktop browser - SDK not available
    console.log("Desktop browser detected - Farcaster SDK not available")
    return false
  } catch (error) {
    console.warn("Error checking Farcaster availability:", error)
    return false
  }
}

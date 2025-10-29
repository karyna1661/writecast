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
      await waitForFarcasterSDKReady()
      return await rateLimiter.throttle(() => (sdk as any).actions.signIn())
    },
    composeCast: async (text: string, options?: any) => {
      await waitForFarcasterSDKReady()
      console.log("composeCast called with:", { text, options })

      const castData = {
        text,
        embeds: options?.embeds || []
      }

      console.log("Sending cast data:", castData)
      return await rateLimiter.throttle(() => (sdk as any).actions.composeCast(castData))
    },
    openMiniApp: async (options: any) => {
      await waitForFarcasterSDKReady()
      return await rateLimiter.throttle(() => (sdk as any).actions.openMiniApp(options))
    },
    openUrl: async (url: string) => {
      await waitForFarcasterSDKReady()
      return await rateLimiter.throttle(() => (sdk as any).actions.openUrl(url))
    },
    viewProfile: async (options: any) => {
      await waitForFarcasterSDKReady()
      return await rateLimiter.throttle(() => (sdk as any).actions.viewProfile(options))
    },
    setPrimaryButton: async (config: { text: string; action: () => void }) => {
      await waitForFarcasterSDKReady()
      return await rateLimiter.throttle(() => (sdk as any).actions.setPrimaryButton(config))
    },
    addMiniApp: async () => {
      await waitForFarcasterSDKReady()
      return await rateLimiter.throttle(() => (sdk as any).actions.addMiniApp())
    },
    close: async () => {
      await waitForFarcasterSDKReady()
      return await rateLimiter.throttle(() => (sdk as any).actions.close())
    },
    ready: async () => {
      await waitForFarcasterSDKReady()
      return await rateLimiter.throttle(() => (sdk as any).actions.ready())
    },
  },
  quickAuth: {
    getToken: async () => {
      const available = await waitForFarcasterSDKReady({ allowTimeoutResolve: true })
      if (!available) return null
      try {
        const result: any = await rateLimiter.throttle(() => (sdk as any).quickAuth.getToken())
        return result && typeof result.token === "string" ? { token: result.token } : null
      } catch (error) {
        console.warn("Failed to get token:", error)
        return null
      }
    },
    fetch: async (url: string, options?: RequestInit) => {
      await waitForFarcasterSDKReady()
      return await rateLimiter.throttle(() => (sdk as any).quickAuth.fetch(url, options))
    },
  },
  haptics: {
    impactOccurred: async (style: "light" | "medium" | "heavy") => {
      const available = await waitForFarcasterSDKReady({ allowTimeoutResolve: true })
      if (!available) return
      try {
        return await rateLimiter.throttle(() => (sdk as any).haptics.impactOccurred(style))
      } catch (error) {
        console.warn("Haptic impact failed:", error)
      }
    },
    notificationOccurred: async (type: "success" | "warning" | "error") => {
      const available = await waitForFarcasterSDKReady({ allowTimeoutResolve: true })
      if (!available) return
      try {
        return await rateLimiter.throttle(() => (sdk as any).haptics.notificationOccurred(type))
      } catch (error) {
        console.warn("Haptic notification failed:", error)
      }
    },
  },
  getChains: async () => {
    const available = await waitForFarcasterSDKReady({ allowTimeoutResolve: true })
    if (!available) return []
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
    if (typeof window === "undefined") return false
    const hasBridge = typeof (window as any).MiniApp !== "undefined" || typeof (window as any).farcaster !== "undefined"
    const sdkReadyFn = typeof (sdk as any)?.actions?.ready === "function"
    return hasBridge && sdkReadyFn
  } catch (error) {
    console.warn("Error checking Farcaster availability:", error)
    return false
  }
}

export async function waitForFarcasterSDKReady(opts?: { timeoutMs?: number; pollMs?: number; allowTimeoutResolve?: boolean }): Promise<boolean> {
  const timeoutMs = opts?.timeoutMs ?? 10000
  const pollMs = opts?.pollMs ?? 100
  const allowTimeoutResolve = opts?.allowTimeoutResolve ?? false

  if (typeof window === "undefined") return false

  const start = Date.now()

  const readyNow = isFarcasterAvailable()
  if (readyNow) return true

  return new Promise<boolean>((resolve) => {
    let intervalId: any
    let timeoutId: any

    const check = () => {
      const available = isFarcasterAvailable()
      if (available) {
        clearInterval(intervalId)
        clearTimeout(timeoutId)
        console.log("Farcaster SDK became available after", Date.now() - start, "ms")
        resolve(true)
      }
    }

    intervalId = setInterval(check, pollMs)
    timeoutId = setTimeout(() => {
      clearInterval(intervalId)
      const inIframe = typeof window !== "undefined" && window.self !== window.top
      console.warn("waitForFarcasterSDKReady: timeout after", timeoutMs, "ms", { inIframe, windowKeys: Object.keys(window) })
      resolve(allowTimeoutResolve ? false : false)
    }, timeoutMs)
  })
}

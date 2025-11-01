"use client"

import { useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"

export function ReadySignal() {
  useEffect(() => {
    let aborted = false
    let called = false

    // Detect iframe environment (Farcaster web)
    const isInIframe = typeof window !== "undefined" && window.self !== window.top

    // Try multiple methods to call ready()
    const tryCallReady = async (): Promise<boolean> => {
      if (called || aborted) return false

      try {
        // Method 1: Direct import from @farcaster/miniapp-sdk
        if (sdk && (sdk as any).actions && typeof (sdk as any).actions.ready === "function") {
          console.log("ReadySignal: Calling ready() via direct SDK import")
          called = true
          await (sdk as any).actions.ready()
          console.log("ReadySignal: ready() completed via direct import")
          return true
        }

        // Method 2: window.sdk (if exposed)
        if (typeof window !== "undefined" && (window as any).sdk) {
          const windowSdk = (window as any).sdk
          if (windowSdk.actions && typeof windowSdk.actions.ready === "function") {
            console.log("ReadySignal: Calling ready() via window.sdk")
            called = true
            await windowSdk.actions.ready()
            console.log("ReadySignal: ready() completed via window.sdk")
            return true
          }
        }

        // Method 3: If in iframe, try accessing via bridge even if actions.ready isn't ready yet
        if (isInIframe) {
          const hasBridge = typeof (window as any).MiniApp !== "undefined" || typeof (window as any).farcaster !== "undefined"
          if (hasBridge && sdk) {
            // In iframe, try calling ready() anyway - the bridge might work even if detection failed
            console.log("ReadySignal: In iframe with bridge detected, attempting ready() via direct import")
            try {
              called = true
              await (sdk as any).actions.ready()
              console.log("ReadySignal: ready() completed in iframe context")
              return true
            } catch (e) {
              console.warn("ReadySignal: ready() failed in iframe, will retry", e)
              called = false // Allow retry
            }
          }
        }
      } catch (e) {
        console.warn("ReadySignal: tryCallReady error", e)
      }

      return false
    }

    const run = async () => {
      // If in iframe, be more aggressive - try immediately and frequently
      if (isInIframe) {
        console.log("ReadySignal: Detected iframe environment (Farcaster web)")
        
        // Immediate attempt
        if (await tryCallReady()) {
          return
        }

        // Try multiple times with shorter intervals in iframe
        const maxAttempts = 50 // 5 seconds at 100ms intervals
        let attempts = 0

        const intervalId = setInterval(async () => {
          attempts++
          if (called || aborted || attempts >= maxAttempts) {
            clearInterval(intervalId)
            if (!called && !aborted) {
              console.warn(`ReadySignal: Failed to call ready() after ${attempts} attempts in iframe`)
            }
            return
          }

          if (await tryCallReady()) {
            clearInterval(intervalId)
          }
        }, 100)

        // Cleanup timeout
        setTimeout(() => {
          clearInterval(intervalId)
        }, 15000) // 15s max

        return
      }

      // For non-iframe (standalone), use more conservative approach
      console.log("ReadySignal: Standalone mode detected")
      
      // Wait a bit for SDK to initialize
      for (let i = 0; i < 30; i++) {
        if (aborted) return
        if (await tryCallReady()) return
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      if (!called) {
        console.warn("ReadySignal: Could not call ready() in standalone mode")
      }
    }

    void run()
    return () => { aborted = true }
  }, [])

  return null
}


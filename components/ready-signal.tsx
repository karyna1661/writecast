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
    // CRITICAL: Don't wait for type checks - try calling ready() directly and catch errors
    const tryCallReady = async (): Promise<boolean> => {
      if (called || aborted) return false

      try {
        // Method 1: If SDK import exists, try calling ready() DIRECTLY (don't check type first)
        if (sdk && (sdk as any).actions) {
          try {
            console.log("ReadySignal: Attempting ready() via direct SDK import (no type check)")
            called = true
            await (sdk as any).actions.ready()
            console.log("ReadySignal: ready() completed via direct import")
            return true
          } catch (e) {
            console.warn("ReadySignal: ready() call failed, will retry", e)
            called = false // Allow retry
          }
        }

        // Method 2: window.sdk (if exposed)
        if (typeof window !== "undefined" && (window as any).sdk) {
          const windowSdk = (window as any).sdk
          if (windowSdk.actions) {
            try {
              console.log("ReadySignal: Attempting ready() via window.sdk (no type check)")
              called = true
              await windowSdk.actions.ready()
              console.log("ReadySignal: ready() completed via window.sdk")
              return true
            } catch (e) {
              console.warn("ReadySignal: window.sdk ready() failed, will retry", e)
              called = false // Allow retry
            }
          }
        }
      } catch (e) {
        console.warn("ReadySignal: tryCallReady outer error", e)
        called = false // Allow retry
      }

      return false
    }

    const run = async () => {
      // If in iframe, be more aggressive - try calling ready() immediately
      if (isInIframe) {
        console.log("ReadySignal: Detected iframe environment (Farcaster web/mobile)")
        console.log("ReadySignal: SDK import exists?", typeof sdk !== "undefined")
        console.log("ReadySignal: SDK actions exists?", typeof (sdk as any)?.actions !== "undefined")
        
        // In iframe, if SDK import exists, try calling ready() IMMEDIATELY without waiting
        if (typeof sdk !== "undefined" && (sdk as any).actions) {
          try {
            console.log("ReadySignal: Calling ready() immediately in iframe (no checks)")
            called = true
            await (sdk as any).actions.ready()
            console.log("ReadySignal: ready() completed immediately!")
            return
          } catch (e) {
            console.warn("ReadySignal: Immediate ready() call failed, will retry", e)
            called = false // Allow retry
          }
        }

        // Try multiple times with shorter intervals in iframe
        const maxAttempts = 100 // 10 seconds at 100ms intervals
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


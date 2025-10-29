"use client"

import { useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"

export function ReadySignal() {
  useEffect(() => {
    // Poll for SDK availability (web can load it asynchronously)
    let called = false
    const maxWaitMs = 10000
    const intervalMs = 100

    const tryReady = async () => {
      try {
        // Detect if we are inside an iframe (Farcaster web loads miniapps in a frame)
        const inIframe = typeof window !== "undefined" && window.self !== window.top
        if (!called) {
          // Log detection state for debugging
          // eslint-disable-next-line no-console
          console.log("ReadySignal: inIframe=", inIframe, "sdk exists=", typeof sdk !== "undefined", "has actions=", !!(sdk as any)?.actions, "has ready=", typeof (sdk as any)?.actions?.ready)
        }

        // Be permissive: if sdk/actions exist, attempt ready() when available
        const canAttemptReady = typeof sdk !== "undefined" && (sdk as any)?.actions && typeof (sdk as any)?.actions?.ready === "function"

        if (!called && canAttemptReady) {
          called = true
          console.log("ReadySignal: SDK detected, calling sdk.actions.ready()")
          await (sdk as any).actions.ready()
          console.log("ReadySignal: ready() called successfully - splash screen should dismiss")
        }
      } catch (error) {
        console.error("ReadySignal: Failed to call sdk.actions.ready():", error)
      }
    }

    // Immediate attempt
    tryReady()

    // Start polling until SDK is available or timeout
    const intervalId = setInterval(() => {
      if (!called) {
        void tryReady()
      } else {
        clearInterval(intervalId)
        clearTimeout(timeoutId)
      }
    }, intervalMs)

    const timeoutId = setTimeout(() => {
      if (!called) {
        console.warn("ReadySignal: SDK not detected within timeout; stopping retries")
        clearInterval(intervalId)
      }
    }, maxWaitMs)

    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [])
  
  return null
}


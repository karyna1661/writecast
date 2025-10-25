"use client"

import { useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"

export function ReadySignal() {
  useEffect(() => {
    // Call ready() after the app has mounted and is ready to display
    const signalReady = async () => {
      try {
        if (typeof sdk !== "undefined" && sdk?.actions?.ready) {
          console.log("ReadySignal: App mounted, calling sdk.actions.ready()")
          await sdk.actions.ready()
          console.log("ReadySignal: sdk.actions.ready() called successfully - splash screen should dismiss")
        } else {
          console.warn("ReadySignal: SDK not available, cannot call ready()")
        }
      } catch (error) {
        console.error("ReadySignal: Failed to call sdk.actions.ready():", error)
      }
    }
    
    // Call ready immediately when component mounts
    signalReady()
  }, [])
  
  return null
}


"use client"

import { useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"
import { waitForFarcasterSDKReady } from "@/lib/farcaster/sdk-client"

export function ReadySignal() {
  useEffect(() => {
    let aborted = false

    const run = async () => {
      // Short wait for SDK - FarcasterContext handles the heavy lifting
      const ready = await waitForFarcasterSDKReady({ 
        timeoutMs: 5000, 
        pollMs: 100, 
        allowTimeoutResolve: false 
      })
      
      if (!ready || aborted) {
        console.log("ReadySignal: SDK not available, skipping ready() call")
        return
      }
      
      try {
        console.log("ReadySignal: calling sdk.actions.ready()")
        await (sdk as any).actions.ready()
        console.log("ReadySignal: ready() completed")
      } catch (e) {
        console.error("ReadySignal: ready() failed", e)
      }
    }

    void run()
    return () => { aborted = true }
  }, [])

  return null
}


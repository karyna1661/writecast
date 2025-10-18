"use client"

import type React from "react"
import { useFarcaster } from "@/contexts/FarcasterContext"

interface TerminalPromptProps {
  user?: string
  children?: React.ReactNode
}

export function TerminalPrompt({ user, children }: TerminalPromptProps) {
  const farcaster = useFarcaster()
  
  // Use Farcaster username if authenticated, otherwise fall back to prop or default
  const displayUser = farcaster.auth.isAuthenticated && farcaster.auth.user 
    ? farcaster.auth.user.username 
    : user || "guest"

  return (
    <div className="flex items-start gap-2 text-sm md:text-base">
      <span className="text-terminal-yellow shrink-0">
        {farcaster.auth.isAuthenticated ? "@" : ""}{displayUser}@writecast
      </span>
      <span className="text-terminal-muted shrink-0">~</span>
      <span className="text-terminal-green shrink-0">$</span>
      {children && <span className="text-terminal-text">{children}</span>}
    </div>
  )
}

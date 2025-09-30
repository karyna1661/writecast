import type React from "react"
interface TerminalPromptProps {
  user?: string
  children?: React.ReactNode
}

export function TerminalPrompt({ user = "guest", children }: TerminalPromptProps) {
  return (
    <div className="flex items-start gap-2 text-sm md:text-base">
      <span className="text-terminal-yellow shrink-0">{user}@writecast</span>
      <span className="text-terminal-muted shrink-0">~</span>
      <span className="text-terminal-green shrink-0">$</span>
      {children && <span className="text-terminal-text">{children}</span>}
    </div>
  )
}

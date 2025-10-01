import type { ReactNode } from "react"

interface TerminalWindowProps {
  children: ReactNode
}

export function TerminalWindow({ children }: TerminalWindowProps) {
  return (
    <div className="min-h-screen bg-terminal-bg terminal-scanline">
      <div className="w-full h-screen">
        <div className="bg-terminal-blue/20 border-2 border-terminal-border rounded-none p-2 sm:p-4 md:p-6 shadow-2xl h-full flex flex-col">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-4 pb-2 sm:pb-3 border-b border-terminal-border flex-shrink-0">
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-terminal-red"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-terminal-yellow"></div>
            <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-terminal-green"></div>
            <span className="ml-1 sm:ml-2 text-terminal-muted text-[10px] sm:text-xs">writecast.terminal</span>
          </div>
          <div className="flex-1 overflow-y-hidden flex flex-col min-h-0 scrollbar-hide">{children}</div>
        </div>
      </div>
    </div>
  )
}

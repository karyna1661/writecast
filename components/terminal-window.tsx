import type { ReactNode } from "react"

interface TerminalWindowProps {
  children: ReactNode
}

export function TerminalWindow({ children }: TerminalWindowProps) {
  return (
    <div className="min-h-screen bg-terminal-bg terminal-scanline">
      <div className="w-full min-h-screen h-auto">
        <div className="bg-terminal-blue/20 border-2 border-terminal-border rounded-none p-0 xs:p-1 sm:p-2 md:p-4 lg:p-6 shadow-2xl min-h-screen h-auto flex flex-col">
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 mb-1 xs:mb-2 sm:mb-4 pb-1 xs:pb-2 sm:pb-3 border-b border-terminal-border flex-shrink-0 px-1 xs:px-2 sm:px-4">
            <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-3 sm:h-3 rounded-full bg-terminal-red"></div>
            <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-3 sm:h-3 rounded-full bg-terminal-yellow"></div>
            <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-3 sm:h-3 rounded-full bg-terminal-green"></div>
            <span className="ml-0.5 xs:ml-1 sm:ml-2 text-terminal-muted text-[8px] xs:text-[10px] sm:text-xs">writecast.terminal</span>
          </div>
          <div className="flex-1 overflow-y-hidden flex flex-col min-h-0 scrollbar-hide px-1 xs:px-2 sm:px-4">{children}</div>
        </div>
      </div>
    </div>
  )
}

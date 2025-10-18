"use client"

import { useFarcaster } from "@/contexts/FarcasterContext"

export function TerminalHeader() {
  const farcaster = useFarcaster()

  return (
    <div className="mb-4 sm:mb-8 flex flex-col items-center">
      <pre className="text-terminal-cyan text-[6px] xs:text-[8px] sm:text-sm md:text-base leading-tight mx-auto scale-[0.65] xs:scale-75 sm:scale-100 origin-center overflow-hidden">
        {`
██╗    ██╗██████╗ ██╗████████╗███████╗ ██████╗ █████╗ ███████╗████████╗
██║    ██║██╔══██╗██║╚══██╔══╝██╔════╝██╔════╝██╔══██╗██╔════╝╚══██╔══╝
██║ █╗ ██║██████╔╝██║   ██║   █████╗  ██║     ███████║███████╗   ██║   
██║███╗██║██╔══██╗██║   ██║   ██╔══╝  ██║     ██╔══██║╚════██║   ██║   
╚███╔███╔╝██║  ██║██║   ██║   ███████╗╚██████╗██║  ██║███████║   ██║   
 ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝   
`}
      </pre>
      <div className="text-terminal-green text-[10px] xs:text-xs sm:text-sm mt-1 sm:mt-2 text-center mx-auto px-4">
        <div className="flex items-center justify-center gap-2">
          <span>v1.0.0</span>
          <span className="text-terminal-muted">|</span>
          {farcaster.isAvailable ? (
            <>
              <span className="text-terminal-yellow">Farcaster Mini App</span>
              <span className="text-terminal-muted">|</span>
              {farcaster.auth.isAuthenticated ? (
                <span className="text-terminal-green">✓ @{farcaster.auth.user?.username}</span>
              ) : (
                <span className="text-terminal-muted">Type 'login' to authenticate</span>
              )}
            </>
          ) : (
            <span className="text-terminal-muted">Web Version</span>
          )}
          <span className="text-terminal-muted">|</span>
          <span>Type 'help' for commands</span>
        </div>
      </div>
    </div>
  )
}

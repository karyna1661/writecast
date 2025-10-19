"use client"

import { useFarcaster } from "@/contexts/FarcasterContext"

export function TerminalHeader() {
  const farcaster = useFarcaster()

  return (
    <div className="mb-2 xs:mb-4 sm:mb-8 flex flex-col items-center">
      {/* ASCII Art - Visible on all screens with responsive sizing */}
      <div>
        <pre className="text-terminal-cyan text-[5px] xs:text-[6px] sm:text-xs md:text-sm leading-tight mx-auto scale-[0.4] xs:scale-[0.5] sm:scale-[0.7] md:scale-100 origin-center overflow-hidden">
          {`
██╗    ██╗██████╗ ██╗████████╗███████╗ ██████╗ █████╗ ███████╗████████╗
██║    ██║██╔══██╗██║╚══██╔══╝██╔════╝██╔════╝██╔══██╗██╔════╝╚══██╔══╝
██║ █╗ ██║██████╔╝██║   ██║   █████╗  ██║     ███████║███████╗   ██║   
██║███╗██║██╔══██╗██║   ██║   ██╔══╝  ██║     ██╔══██║╚════██║   ██║   
╚███╔███╔╝██║  ██║██║   ██║   ███████╗╚██████╗██║  ██║███████║   ██║   
 ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝   ╚═╝   ╚══════╝ ╚═════╝╚═╝  ╚═╝╚══════╝   ╚═╝   
`}
        </pre>
      </div>
      
      <div className="text-terminal-green text-[8px] xs:text-[10px] sm:text-sm mt-1 xs:mt-1 sm:mt-2 text-center mx-auto px-2 xs:px-4">
        <div className="flex items-center justify-center gap-1 xs:gap-2 flex-wrap">
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

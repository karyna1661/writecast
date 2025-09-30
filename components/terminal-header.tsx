export function TerminalHeader() {
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
      <p className="text-terminal-green text-[10px] xs:text-xs sm:text-sm mt-1 sm:mt-2 text-center mx-auto px-4">
        v1.0.0 | Farcaster Mini App Coming Soon | Type 'help' for commands
      </p>
    </div>
  )
}

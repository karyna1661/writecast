import type { ButtonHTMLAttributes } from "react"

interface TerminalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger"
}

export function TerminalButton({ children, variant = "primary", className = "", ...props }: TerminalButtonProps) {
  const variants = {
    primary: "bg-terminal-green hover:bg-terminal-green/80 text-terminal-bg",
    secondary: "bg-terminal-cyan hover:bg-terminal-cyan/80 text-terminal-bg",
    danger: "bg-terminal-red hover:bg-terminal-red/80 text-terminal-bg",
  }

  return (
    <button
      className={`px-4 py-2 font-mono text-sm font-bold border-2 border-current transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

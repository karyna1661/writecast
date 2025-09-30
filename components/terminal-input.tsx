import { type InputHTMLAttributes, forwardRef } from "react"

interface TerminalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const TerminalInput = forwardRef<HTMLInputElement, TerminalInputProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-terminal-green text-sm font-bold">
            {">"} {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full bg-terminal-bg border-2 border-terminal-border px-3 py-2 text-terminal-text font-mono focus:outline-none focus:border-terminal-cyan transition-colors ${className}`}
          {...props}
        />
      </div>
    )
  },
)

TerminalInput.displayName = "TerminalInput"

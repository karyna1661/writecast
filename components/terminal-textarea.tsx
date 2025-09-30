import { type TextareaHTMLAttributes, forwardRef } from "react"

interface TerminalTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const TerminalTextarea = forwardRef<HTMLTextAreaElement, TerminalTextareaProps>(
  ({ label, className = "", ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-terminal-green text-sm font-bold">
            {">"} {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full bg-terminal-bg border-2 border-terminal-border px-3 py-2 text-terminal-text font-mono focus:outline-none focus:border-terminal-cyan transition-colors resize-none ${className}`}
          {...props}
        />
      </div>
    )
  },
)

TerminalTextarea.displayName = "TerminalTextarea"

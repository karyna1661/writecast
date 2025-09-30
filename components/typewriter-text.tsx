"use client"

import { useTypewriter } from "@/hooks/use-typewriter"

interface TypewriterTextProps {
  text: string
  speed?: number
  onComplete?: () => void
  className?: string
}

export function TypewriterText({ text, speed = 20, onComplete, className = "" }: TypewriterTextProps) {
  const { displayedText, isComplete } = useTypewriter({ text, speed, onComplete })

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">▊</span>}
    </span>
  )
}

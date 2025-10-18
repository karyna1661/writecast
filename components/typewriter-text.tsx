"use client"

import { useTypewriter } from "@/hooks/use-typewriter"

interface TypewriterTextProps {
  text: string
  speed?: number
  onComplete?: () => void
  onProgress?: (index: number) => void
  className?: string
}

export function TypewriterText({ text, speed = 20, onComplete, onProgress, className = "" }: TypewriterTextProps) {
  const { displayedText, isComplete } = useTypewriter({ text, speed, onComplete, onProgress })

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">▊</span>}
    </span>
  )
}

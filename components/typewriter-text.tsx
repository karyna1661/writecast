"use client"

import { useTypewriter } from "@/hooks/use-typewriter"

interface TypewriterTextProps {
  text: string
  speed?: number
  onComplete?: () => void
  onProgress?: (index: number) => void
  className?: string
  uniqueKey?: string
}

export function TypewriterText({ text, speed = 20, onComplete, onProgress, className = "", uniqueKey }: TypewriterTextProps) {
  // Don't render if text is empty or undefined
  if (!text || text.length === 0) {
    return null
  }

  const { displayedText, isComplete } = useTypewriter({ text, speed, onComplete, onProgress, uniqueKey })


  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">▊</span>}
    </span>
  )
}

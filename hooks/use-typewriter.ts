"use client"

import { useState, useEffect } from "react"

interface UseTypewriterOptions {
  text: string
  speed?: number
  onComplete?: () => void
}

export function useTypewriter({ text, speed = 20, onComplete }: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayedText("")
    setIsComplete(false)
    let currentIndex = 0

    const interval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        setIsComplete(true)
        clearInterval(interval)
        onComplete?.()
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed, onComplete])

  return { displayedText, isComplete }
}

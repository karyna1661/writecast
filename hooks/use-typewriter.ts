"use client"

import { useState, useEffect, useRef } from "react"

interface UseTypewriterOptions {
  text: string
  speed?: number
  onComplete?: () => void
  onProgress?: (index: number) => void
}

export function useTypewriter({ text, speed = 20, onComplete, onProgress }: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTextRef = useRef("")

  useEffect(() => {
    // Only reset if text actually changed
    if (lastTextRef.current && text.startsWith(lastTextRef.current)) {
      // Continue from current position - don't restart
      return
    }
    
    // New text, start over
    setDisplayedText("")
    setCurrentIndex(0)
    setIsComplete(false)
    lastTextRef.current = ""
    
    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current)
    
    let index = 0
    intervalRef.current = setInterval(() => {
      if (index < text.length) {
        const newText = text.slice(0, index + 1)
        setDisplayedText(newText)
        setCurrentIndex(index + 1)
        lastTextRef.current = newText
        
        // Call progress callback for scroll tracking
        onProgress?.(index + 1)
        
        index++
      } else {
        setIsComplete(true)
        if (intervalRef.current) clearInterval(intervalRef.current)
        onComplete?.()
      }
    }, speed)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [text]) // Only depend on text, not onComplete, speed, or onProgress
  
  return { displayedText, currentIndex, isComplete }
}

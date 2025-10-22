"use client"

import { useState, useEffect, useRef, useMemo } from "react"

interface UseTypewriterOptions {
  text: string
  speed?: number
  onComplete?: () => void
  onProgress?: (index: number) => void
  uniqueKey?: string // Add uniqueKey prop for stable identity
}

export function useTypewriter({ text, speed = 20, onComplete, onProgress, uniqueKey }: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)
  const prevTextRef = useRef<string>("")
  const onCompleteRef = useRef(onComplete)
  const onProgressRef = useRef(onProgress)
  
  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete
    onProgressRef.current = onProgress
  })
  
  // Create a stable hash for the text to prevent unnecessary re-renders
  const textHash = useMemo(() => {
    if (uniqueKey) return uniqueKey
    
    // For texts without uniqueKey, create a stable hash
    const safeText = text || ""
    if (safeText.length <= 40) {
      return safeText // Short texts: use full text as key  
    }
    return `${safeText.length}-${safeText.slice(0, 20)}-${safeText.slice(-20)}`
  }, [text, uniqueKey])

  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Check if text actually changed and animation is already complete
    if (prevTextRef.current === text && isComplete && displayedText === text) {
      // Same text, already complete and displayed - don't re-run
      return
    }
    
    prevTextRef.current = text
    
    // Reset state for new text
    setDisplayedText("")
    setCurrentIndex(0)
    setIsComplete(false)
    isInitializedRef.current = false
    
    // Don't start if text is empty
    if (!text || text.length === 0) {
      setIsComplete(true)
      onCompleteRef.current?.()
      return
    }
    
    let index = 0
    isInitializedRef.current = true
    
    intervalRef.current = setInterval(() => {
      // Check if component is still mounted and initialized
      if (!isInitializedRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        return
      }
      
      if (index < text.length) {
        const newText = text.slice(0, index + 1)
        setDisplayedText(newText)
        setCurrentIndex(index + 1)
        
        // Call progress callback for scroll tracking
        onProgressRef.current?.(index + 1)
        
        index++
      } else {
        setIsComplete(true)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        onCompleteRef.current?.()
      }
    }, speed)

    return () => {
      isInitializedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [text, speed])
  
  return { displayedText, currentIndex, isComplete }
}

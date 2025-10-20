"use client"

import { useState, useEffect, useRef, useMemo } from "react"

interface UseTypewriterOptions {
  text: string
  speed?: number
  onComplete?: () => void
  onProgress?: (index: number) => void
  key?: string // Add key prop for stable identity
}

export function useTypewriter({ text, speed = 20, onComplete, onProgress, key }: UseTypewriterOptions) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)
  
  // Create a stable hash for the text to prevent unnecessary re-renders
  const textHash = useMemo(() => {
    return key || `${text.length}-${text.slice(0, 10)}-${Date.now()}`
  }, [text, key])

  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Reset state for new text
    setDisplayedText("")
    setCurrentIndex(0)
    setIsComplete(false)
    isInitializedRef.current = false
    
    // Don't start if text is empty
    if (!text || text.length === 0) {
      setIsComplete(true)
      onComplete?.()
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
        onProgress?.(index + 1)
        
        index++
      } else {
        setIsComplete(true)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
        onComplete?.()
      }
    }, speed)

    return () => {
      isInitializedRef.current = false
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [textHash, speed]) // Use textHash instead of text
  
  return { displayedText, currentIndex, isComplete }
}

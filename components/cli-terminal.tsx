"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { TypewriterText } from "./typewriter-text"
import { TerminalPrompt } from "./terminal-prompt"

interface CliMessage {
  type: "command" | "output" | "error" | "success"
  content: string
  timestamp: number
}

interface CliTerminalProps {
  onCommand: (command: string) => void
  messages: CliMessage[]
  placeholder?: string
}

export function CliTerminal({ onCommand, messages, placeholder = "help for commands" }: CliTerminalProps) {
  const [input, setInput] = useState("")
  const [streamingIndex, setStreamingIndex] = useState(-1)
  const [isInputEnabled, setIsInputEnabled] = useState(false)
  const [isUserScrolling, setIsUserScrolling] = useState(false)
  const [typewriterProgress, setTypewriterProgress] = useState<Record<number, number>>({})
  const [lastStreamedIndex, setLastStreamedIndex] = useState(-1)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (!isUserScrolling) {
      messagesEndRef.current?.scrollIntoView({ behavior })
    }
  }, [isUserScrolling])

  // Auto-scroll on new messages AND during typewriter progress (smooth following)
  useEffect(() => {
    scrollToBottom("auto")
  }, [messages, typewriterProgress, scrollToBottom])

  // Detect if user is manually scrolling
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const threshold = window.innerWidth < 640 ? 20 : 10 // Larger threshold on mobile
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - threshold
      
      if (isAtBottom) {
        setIsUserScrolling(false)
      } else {
        setIsUserScrolling(true)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    // If currently streaming, wait for it to complete
    if (streamingIndex !== -1) {
      return
    }
    
    // Find the next message that needs to be streamed
    const nextIndex = lastStreamedIndex + 1
    
    if (nextIndex < messages.length) {
      const nextMessage = messages[nextIndex]
      
      if (nextMessage.type === "command") {
        // Commands don't stream - mark as completed and move to next
        setLastStreamedIndex(nextIndex)
      } else {
        // Start streaming this message
        setStreamingIndex(nextIndex)
        setIsInputEnabled(false)
      }
    } else {
      // All messages have been streamed
      setIsInputEnabled(true)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [messages, streamingIndex, lastStreamedIndex])

  const handleStreamComplete = () => {
    // Mark current message as streamed
    setLastStreamedIndex(streamingIndex)
    // Clear streaming state to allow next message
    setStreamingIndex(-1)
    // Don't enable input yet - let the useEffect handle the queue
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !isInputEnabled) return

    // Reset scroll state when user submits command
    setIsUserScrolling(false)
    onCommand(input.trim())
    setInput("")
  }

  const handleContainerClick = () => {
    if (isInputEnabled) {
      inputRef.current?.focus()
    }
  }

  return (
    <div className="flex flex-col h-full" onClick={handleContainerClick}>
      {/* Messages area with scroll detection */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden space-y-1 xs:space-y-2 pr-1 xs:pr-2 pb-2 xs:pb-4 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {messages.map((msg, i) => {
          const isStreaming = i === streamingIndex
          const hasAlreadyStreamed = i <= lastStreamedIndex
          const shouldUseTypewriter = msg.type !== "command" && (isStreaming || hasAlreadyStreamed)

          return (
            <div key={i} className="space-y-1 overflow-hidden">
              {msg.type === "command" ? (
                <TerminalPrompt>
                  <span className="text-terminal-text text-[10px] xs:text-xs sm:text-sm break-all">{msg.content}</span>
                </TerminalPrompt>
              ) : msg.type === "error" ? (
                <div className="pl-1 xs:pl-2 sm:pl-4 text-terminal-red text-[10px] xs:text-xs sm:text-sm">
                  {shouldUseTypewriter ? (
                    <>
                      <span className="text-terminal-red">ERROR:</span>{" "}
                      <TypewriterText
                        text={msg.content}
                        speed={15}
                        uniqueKey={`error-${i}-${msg.timestamp}`}
                        onProgress={(index) => {
                          setTypewriterProgress(prev => ({ ...prev, [i]: index }))
                        }}
                        onComplete={handleStreamComplete}
                        className="text-terminal-red"
                      />
                    </>
                  ) : (
                    <>
                      <span className="text-terminal-red">ERROR:</span> {msg.content}
                    </>
                  )}
                </div>
              ) : msg.type === "success" ? (
                <div className="pl-1 xs:pl-2 sm:pl-4 text-terminal-green text-[10px] xs:text-xs sm:text-sm break-words">
                  {shouldUseTypewriter ? (
                    <TypewriterText
                      text={msg.content}
                      speed={15}
                      uniqueKey={`success-${i}-${msg.timestamp}`}
                      onProgress={(index) => {
                        setTypewriterProgress(prev => ({ ...prev, [i]: index }))
                      }}
                      onComplete={handleStreamComplete}
                      className="text-terminal-green"
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              ) : (
                <div className="pl-1 xs:pl-2 sm:pl-4 text-terminal-text text-[10px] xs:text-xs sm:text-sm whitespace-pre-wrap break-words">
                  <div className="[text-indent:-2rem] pl-8">
                    {shouldUseTypewriter ? (
                      <TypewriterText 
                        text={msg.content} 
                        speed={15} 
                        uniqueKey={`output-${i}-${msg.timestamp}`}
                        onProgress={(index) => {
                          setTypewriterProgress(prev => ({ ...prev, [i]: index }))
                        }}
                        onComplete={handleStreamComplete} 
                      />
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {isInputEnabled && (
          <form onSubmit={handleSubmit} className="flex items-start gap-1 xs:gap-1.5 sm:gap-2 flex-wrap">
            <TerminalPrompt>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 min-w-[100px] xs:min-w-[120px] bg-transparent border-none outline-none text-terminal-text font-mono caret-terminal-cyan text-[10px] xs:text-xs sm:text-sm"
                placeholder={placeholder}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                inputMode="text"
              />
            </TerminalPrompt>
          </form>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export type { CliMessage }

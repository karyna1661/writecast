"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { TypewriterText } from "./typewriter-text"

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

export function CliTerminal({ onCommand, messages, placeholder = "Type 'help' for commands..." }: CliTerminalProps) {
  const [input, setInput] = useState("")
  const [streamingIndex, setStreamingIndex] = useState(-1)
  const [isInputEnabled, setIsInputEnabled] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingIndex])

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessageIndex = messages.length - 1
      const lastMessage = messages[lastMessageIndex]

      // Only stream non-command messages
      if (lastMessage.type !== "command") {
        setStreamingIndex(lastMessageIndex)
        setIsInputEnabled(false)
      } else {
        // Commands are instant, enable input immediately
        setIsInputEnabled(true)
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      }
    }
  }, [messages])

  const handleStreamComplete = () => {
    setStreamingIndex(-1)
    setIsInputEnabled(true)
    // Focus input after streaming completes
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !isInputEnabled) return

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
      {/* Messages area with inline input */}
      <div className="flex-1 overflow-y-hidden space-y-2 pr-2 pb-4 scrollbar-hide">
        {messages.map((msg, i) => {
          const isStreaming = i === streamingIndex
          const shouldStream = msg.type !== "command" && isStreaming

          return (
            <div key={i} className="space-y-1">
              {msg.type === "command" ? (
                <div className="flex items-start gap-1 sm:gap-2 flex-wrap">
                  <span className="text-terminal-yellow font-bold text-xs sm:text-sm">guest@writecast</span>
                  <span className="text-terminal-text text-xs sm:text-sm">~</span>
                  <span className="text-terminal-green font-bold text-xs sm:text-sm">$</span>
                  <span className="text-terminal-text text-xs sm:text-sm break-all">{msg.content}</span>
                </div>
              ) : msg.type === "error" ? (
                <div className="pl-4 sm:pl-8 text-terminal-red text-xs sm:text-sm">
                  {shouldStream ? (
                    <>
                      <span className="text-terminal-red">ERROR:</span>{" "}
                      <TypewriterText
                        text={msg.content}
                        speed={15}
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
                <div className="pl-4 sm:pl-8 text-terminal-green text-xs sm:text-sm break-words">
                  {shouldStream ? (
                    <TypewriterText
                      text={msg.content}
                      speed={15}
                      onComplete={handleStreamComplete}
                      className="text-terminal-green"
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              ) : (
                <div className="pl-4 sm:pl-8 text-terminal-text text-xs sm:text-sm whitespace-pre-wrap break-words">
                  {shouldStream ? (
                    <TypewriterText text={msg.content} speed={15} onComplete={handleStreamComplete} />
                  ) : (
                    msg.content
                  )}
                </div>
              )}
            </div>
          )
        })}

        {isInputEnabled && (
          <form onSubmit={handleSubmit} className="flex items-start gap-1 sm:gap-2 flex-wrap">
            <span className="text-terminal-yellow font-bold text-xs sm:text-sm">guest@writecast</span>
            <span className="text-terminal-text text-xs sm:text-sm">~</span>
            <span className="text-terminal-green font-bold text-xs sm:text-sm">$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-terminal-text font-mono caret-terminal-cyan text-xs sm:text-sm"
              placeholder={placeholder}
              autoComplete="off"
              spellCheck={false}
            />
          </form>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export type { CliMessage }

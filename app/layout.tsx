import type React from "react"
import "./globals.css"

export const metadata = {
  title: "Writecast - CLI Word Game",
  description: "A terminal-style word guessing game on Farcaster"
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="font-mono antialiased">
      <body>{children}</body>
    </html>
  )
}

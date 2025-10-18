import type React from "react"
import "./globals.css"
import { FarcasterProvider } from "@/contexts/FarcasterContext"

export const metadata = {
  title: "Writecast - CLI Word Game",
  description: "A terminal-style word guessing game on Farcaster",
  openGraph: {
    title: "Writecast - CLI Word Game",
    description: "A terminal-style word guessing game on Farcaster",
    type: "website",
    url: "https://writecast.vercel.app",
    siteName: "Writecast",
  },
  twitter: {
    card: "summary_large_image",
    title: "Writecast - CLI Word Game",
    description: "A terminal-style word guessing game on Farcaster",
  },
  other: {
    "farcaster:app": "writecast",
    "farcaster:app_url": "https://writecast.vercel.app",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="font-mono antialiased">
      <body>
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </body>
    </html>
  )
}

import type React from "react"
import "./globals.css"
import { FarcasterProvider } from "@/contexts/FarcasterContext"
import { Analytics } from "@vercel/analytics/react"

export const metadata = {
  title: "Writecast - CLI Word Game",
  description: "A terminal-style word guessing game on Farcaster",
  manifest: "/manifest.json",
  metadataBase: new URL('https://writecast-1.vercel.app'),
  openGraph: {
    title: 'Writecast - CLI Word Game',
    description: 'A terminal-style word guessing game on Farcaster',
    url: 'https://writecast-1.vercel.app',
    siteName: 'Writecast',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Writecast Game',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Writecast - CLI Word Game',
    description: 'A terminal-style word guessing game on Farcaster',
    images: ['/icon-512.png'],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#1e3a8a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Writecast",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "farcaster:app": "writecast",
    "farcaster:app_url": "https://writecast-1.vercel.app",
    // Mini App embed metadata
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: "https://writecast-1.vercel.app/icon-512.png",
      button: {
        title: "Play Now",
        action: {
          type: "launch_miniapp",
          name: "Writecast",
          url: "https://writecast-1.vercel.app",
          splashImageUrl: "https://writecast-1.vercel.app/icon-512.png",
          splashBackgroundColor: "#0a1628"
        }
      }
    })
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="font-mono antialiased" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
        <Analytics />
      </body>
    </html>
  )
}

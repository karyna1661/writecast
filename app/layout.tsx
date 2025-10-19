import type React from "react"
import "./globals.css"
import { FarcasterProvider } from "@/contexts/FarcasterContext"

export const metadata = {
  title: "Writecast - CLI Word Game",
  description: "A terminal-style word guessing game on Farcaster",
  manifest: "/manifest.json",
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
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
    shortcut: "/icon-192.png",
  },
  openGraph: {
    title: "Writecast - CLI Word Game",
    description: "A terminal-style word guessing game on Farcaster",
    type: "website",
    url: "https://writecast.vercel.app",
    siteName: "Writecast",
    images: [
      {
        url: "https://writecast.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Writecast - CLI Word Game",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Writecast - CLI Word Game",
    description: "A terminal-style word guessing game on Farcaster",
    images: ["https://writecast.vercel.app/og-image.png"],
  },
  other: {
    "farcaster:app": "writecast",
    "farcaster:app_url": "https://writecast.vercel.app",
    "fc:miniapp": '{"version":"1","imageUrl":"https://writecast.vercel.app/og-image.png","button":{"title":"Play Now","action":{"type":"launch_miniapp","name":"Writecast","url":"https://writecast.vercel.app","splashImageUrl":"https://writecast.vercel.app/og-image.png","splashBackgroundColor":"#0a1628"}}}',
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

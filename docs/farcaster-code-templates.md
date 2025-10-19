# Farcaster Mini App Code Templates

> **Copy-paste ready code templates for Farcaster Mini Apps**

## 🚀 Project Setup Templates

### ✅ Package.json Template
```json
{
  "name": "your-farcaster-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@farcaster/miniapp-sdk": "^1.0.0",
    "next": "14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "14.0.0",
    "typescript": "^5.0.0"
  }
}
```

### ✅ Next.js Config Template
```javascript
// next.config.mjs
const nextConfig = {
  async headers() {
    return [
      {
        source: '/.well-known/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

### ✅ Vercel Config Template
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "headers": [
    {
      "source": "/.well-known/:path*",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/json"
        }
      ]
    }
  ]
}
```

---

## 📄 Layout Templates

### ✅ Root Layout Template
```typescript
// app/layout.tsx
import type { Metadata } from "next"
import { FarcasterProvider } from "@/contexts/FarcasterContext"
import "./globals.css"

export const metadata: Metadata = {
  title: "Your App - Description",
  description: "Your app description for Farcaster",
  openGraph: {
    title: "Your App - Description",
    description: "Your app description for Farcaster",
    type: "website",
    url: "https://yourdomain.com",
    siteName: "Your App",
    images: [
      {
        url: "https://yourdomain.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Your App - Description",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Your App - Description",
    description: "Your app description for Farcaster",
    images: ["https://yourdomain.com/og-image.png"],
  },
  other: {
    "farcaster:app": "your-app-name",
    "farcaster:app_url": "https://yourdomain.com",
    "fc:miniapp": '{"version":"1","imageUrl":"https://yourdomain.com/og-image.png","button":{"title":"Launch App","action":{"type":"launch_miniapp","name":"Your App","url":"https://yourdomain.com","splashImageUrl":"https://yourdomain.com/og-image.png","splashBackgroundColor":"#000000"}}}',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </body>
    </html>
  )
}
```

### ✅ Home Page Template
```typescript
// app/page.tsx
import { Metadata } from "next"
import HomeClient from "./home-client"

export const metadata: Metadata = {
  title: "Your App - Home",
  description: "Welcome to Your App on Farcaster",
  openGraph: {
    title: "Your App - Home",
    description: "Welcome to Your App on Farcaster",
    images: ["https://yourdomain.com/og-image.png"],
  },
  other: {
    "fc:miniapp": '{"version":"1","imageUrl":"https://yourdomain.com/og-image.png","button":{"title":"Get Started","action":{"type":"launch_miniapp","name":"Your App","url":"https://yourdomain.com","splashImageUrl":"https://yourdomain.com/og-image.png","splashBackgroundColor":"#000000"}}}',
  },
}

export default function HomePage() {
  return <HomeClient />
}
```

### ✅ Dynamic Page Template
```typescript
// app/[slug]/page.tsx
import { Metadata } from "next"
import DynamicClient from "./dynamic-client"

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug
  
  return {
    title: `${slug} - Your App`,
    description: `Dynamic page ${slug} on Your App`,
    openGraph: {
      title: `${slug} - Your App`,
      description: `Dynamic page ${slug} on Your App`,
      images: ["https://yourdomain.com/og-image.png"],
      url: `https://yourdomain.com/${slug}`,
    },
    other: {
      "fc:miniapp": `{"version":"1","imageUrl":"https://yourdomain.com/og-image.png","button":{"title":"View ${slug}","action":{"type":"launch_miniapp","name":"Your App","url":"https://yourdomain.com/${slug}","splashImageUrl":"https://yourdomain.com/og-image.png","splashBackgroundColor":"#000000"}}}`,
    },
  }
}

export default function DynamicPage({ params }: Props) {
  return <DynamicClient slug={params.slug} />
}
```

---

## 🎯 Client Component Templates

### ✅ Home Client Template
```typescript
// app/home-client.tsx
"use client"
import { useFarcaster } from "@/contexts/FarcasterContext"
import { useState } from "react"

export default function HomeClient() {
  const { auth, login, shareContent, hapticFeedback, isAvailable } = useFarcaster()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await login()
      await hapticFeedback.success()
    } catch (error) {
      console.error("Login failed:", error)
      await hapticFeedback.error()
    } finally {
      setIsLoading(false)
    }
  }

  const handleShare = async () => {
    try {
      await shareContent("Check out this amazing app!")
      await hapticFeedback.success()
    } catch (error) {
      console.error("Share failed:", error)
      await hapticFeedback.error()
    }
  }

  if (!isAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your App</h1>
          <p className="text-gray-600">Please open this app in Farcaster</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your App</h1>
        
        {auth.isAuthenticated ? (
          <div className="space-y-4">
            <p className="text-green-600">Welcome back!</p>
            <button
              onClick={handleShare}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            >
              Share App
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 mb-4">Sign in to get started</p>
            <button
              onClick={handleLogin}
              disabled={isLoading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

### ✅ Dynamic Client Template
```typescript
// app/[slug]/dynamic-client.tsx
"use client"
import { useFarcaster } from "@/contexts/FarcasterContext"
import { useState, useEffect } from "react"

interface DynamicClientProps {
  slug: string
}

export default function DynamicClient({ slug }: DynamicClientProps) {
  const { auth, shareContent, hapticFeedback, isAvailable } = useFarcaster()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data based on slug
        const response = await fetch(`/api/data/${slug}`)
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [slug])

  const handleShare = async () => {
    try {
      await shareContent(`Check out ${slug} on Your App!`)
      await hapticFeedback.success()
    } catch (error) {
      console.error("Share failed:", error)
      await hapticFeedback.error()
    }
  }

  if (!isAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{slug}</h1>
          <p className="text-gray-600">Please open this app in Farcaster</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{slug}</h1>
        
        {data && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
          </div>
        )}

        {auth.isAuthenticated && (
          <button
            onClick={handleShare}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
          >
            Share {slug}
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## 🔧 Context Templates

### ✅ Farcaster Context Template
```typescript
// contexts/FarcasterContext.tsx
"use client"
import React, { createContext, useContext, useEffect, useState } from "react"
import { sdk } from "@farcaster/miniapp-sdk"

interface FarcasterContextType {
  auth: {
    isAuthenticated: boolean
    user: any | null
    token: string | null
    isLoading: boolean
  }
  login: () => Promise<void>
  logout: () => void
  shareContent: (text: string) => Promise<void>
  hapticFeedback: {
    success: () => Promise<void>
    error: () => Promise<void>
    warning: () => Promise<void>
  }
  isAvailable: boolean
}

const FarcasterContext = createContext<FarcasterContextType | null>(null)

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true,
  })
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    const initSDK = async () => {
      try {
        const available = typeof window !== "undefined" && typeof sdk !== "undefined"
        setIsAvailable(available)
        
        if (available) {
          await sdk.actions.ready()
        }
        
        setAuth(prev => ({ ...prev, isLoading: false }))
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error)
        setAuth(prev => ({ ...prev, isLoading: false }))
      }
    }
    
    initSDK()
  }, [])

  const login = async () => {
    if (!isAvailable) {
      throw new Error("Farcaster SDK not available")
    }

    try {
      setAuth(prev => ({ ...prev, isLoading: true }))
      
      await sdk.actions.signIn()
      
      const tokenResult = await sdk.quickAuth.getToken()
      
      setAuth({
        isAuthenticated: true,
        user: { fid: 12345, username: "user" }, // Mock user data
        token: tokenResult?.token || null,
        isLoading: false,
      })
    } catch (error) {
      console.error("Login failed:", error)
      setAuth(prev => ({ ...prev, isLoading: false }))
      throw error
    }
  }

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false,
    })
  }

  const shareContent = async (text: string) => {
    if (!isAvailable) {
      throw new Error("Farcaster SDK not available")
    }

    try {
      await sdk.actions.composeCast(text)
    } catch (error) {
      console.error("Failed to share:", error)
      throw error
    }
  }

  const hapticFeedback = {
    success: async () => {
      if (!isAvailable) return
      try {
        await sdk.haptics.notification("success")
      } catch (error) {
        console.error("Haptic feedback failed:", error)
      }
    },
    error: async () => {
      if (!isAvailable) return
      try {
        await sdk.haptics.notification("error")
      } catch (error) {
        console.error("Haptic feedback failed:", error)
      }
    },
    warning: async () => {
      if (!isAvailable) return
      try {
        await sdk.haptics.notification("warning")
      } catch (error) {
        console.error("Haptic feedback failed:", error)
      }
    },
  }

  return (
    <FarcasterContext.Provider value={{
      auth,
      login,
      logout,
      shareContent,
      hapticFeedback,
      isAvailable,
    }}>
      {children}
    </FarcasterContext.Provider>
  )
}

export function useFarcaster() {
  const context = useContext(FarcasterContext)
  if (!context) {
    throw new Error("useFarcaster must be used within a FarcasterProvider")
  }
  return context
}
```

### ✅ Custom Hook Template
```typescript
// hooks/useFarcasterAuth.ts
import { useFarcaster } from "@/contexts/FarcasterContext"
import { useState } from "react"

export function useFarcasterAuth() {
  const { auth, login, logout, isAvailable } = useFarcaster()
  const [isLoading, setIsLoading] = useState(false)

  const signIn = async () => {
    if (!isAvailable) {
      throw new Error("Farcaster not available")
    }

    setIsLoading(true)
    try {
      await login()
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = () => {
    logout()
  }

  return {
    ...auth,
    isLoading: auth.isLoading || isLoading,
    signIn,
    signOut,
    isAvailable,
  }
}
```

---

## 📄 Manifest Templates

### ✅ Basic Manifest Template
```json
{
  "miniapp": {
    "version": "1",
    "name": "Your App",
    "iconUrl": "https://yourdomain.com/icon-512.png",
    "homeUrl": "https://yourdomain.com",
    "splashImageUrl": "https://yourdomain.com/og-image.png",
    "splashBackgroundColor": "#000000",
    "heroImageUrl": "https://yourdomain.com/og-image.png",
    "tagline": "Your app tagline"
  },
  "verification": {
    "domain": "yourdomain.com",
    "signature": "PLACEHOLDER_SIGNATURE_TO_BE_UPDATED_IN_PRODUCTION"
  }
}
```

### ✅ Complete Manifest Template
```json
{
  "miniapp": {
    "version": "1",
    "name": "Your App",
    "iconUrl": "https://yourdomain.com/icon-512.png",
    "homeUrl": "https://yourdomain.com",
    "splashImageUrl": "https://yourdomain.com/og-image.png",
    "splashBackgroundColor": "#000000",
    "heroImageUrl": "https://yourdomain.com/og-image.png",
    "tagline": "Your app tagline"
  },
  "account": {
    "type": "farcaster",
    "username": "your-app-name"
  },
  "verification": {
    "domain": "yourdomain.com",
    "signature": "PLACEHOLDER_SIGNATURE_TO_BE_UPDATED_IN_PRODUCTION"
  },
  "permissions": [
    "notifications",
    "social_sharing",
    "user_profile"
  ],
  "categories": ["your-category"],
  "tags": ["tag1", "tag2", "tag3"]
}
```

---

## 🎨 Styling Templates

### ✅ Global CSS Template
```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-start-rgb: 0, 0, 0;
    --background-end-rgb: 0, 0, 0;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}

/* Farcaster-specific styles */
.farcaster-button {
  @apply bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors;
}

.farcaster-card {
  @apply bg-white rounded-lg shadow-md p-6;
}

.farcaster-loading {
  @apply animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900;
}
```

### ✅ Tailwind Config Template
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        farcaster: {
          blue: '#0066CC',
          green: '#00CC66',
          purple: '#6600CC',
        },
      },
    },
  },
  plugins: [],
}
```

---

## 🚀 Deployment Templates

### ✅ Environment Variables Template
```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_FARCASTER_APP_ID=your-app-name
NEXT_PUBLIC_FARCASTER_APP_VERSION=1.0.0
```

### ✅ GitHub Actions Template
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📝 Utility Templates

### ✅ Meta Tag Generator
```typescript
// lib/meta-tags.ts
export function generateFarcasterMetaTag(config: {
  version: string
  imageUrl: string
  buttonTitle: string
  appName: string
  appUrl: string
  splashImageUrl: string
  splashBackgroundColor: string
}) {
  const content = {
    version: config.version,
    imageUrl: config.imageUrl,
    button: {
      title: config.buttonTitle,
      action: {
        type: "launch_miniapp",
        name: config.appName,
        url: config.appUrl,
        splashImageUrl: config.splashImageUrl,
        splashBackgroundColor: config.splashBackgroundColor,
      },
    },
  }

  return {
    "fc:miniapp": JSON.stringify(content),
  }
}

// Usage
const metaTag = generateFarcasterMetaTag({
  version: "1",
  imageUrl: "https://yourdomain.com/og-image.png",
  buttonTitle: "Launch App",
  appName: "Your App",
  appUrl: "https://yourdomain.com",
  splashImageUrl: "https://yourdomain.com/og-image.png",
  splashBackgroundColor: "#000000",
})
```

### ✅ Error Handler Template
```typescript
// lib/error-handler.ts
export class FarcasterError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'FarcasterError'
  }
}

export function handleFarcasterError(error: unknown): FarcasterError {
  if (error instanceof FarcasterError) {
    return error
  }

  if (error instanceof Error) {
    return new FarcasterError(
      error.message,
      'UNKNOWN_ERROR',
      error
    )
  }

  return new FarcasterError(
    'An unknown error occurred',
    'UNKNOWN_ERROR'
  )
}
```

---

**🎯 Copy these templates and customize for your specific app!**

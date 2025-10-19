# Farcaster Mini App Complete Guide

> **The definitive guide for building Farcaster Mini Apps with Next.js**

## 🚀 Quick Start Checklist

### ✅ Pre-Development Setup
- [ ] Next.js 14+ project with App Router
- [ ] Vercel account for deployment
- [ ] Farcaster developer account
- [ ] Domain ready (or Vercel domain)

### ✅ Required Dependencies
```bash
npm install @farcaster/miniapp-sdk
```

### ✅ Essential Files Structure
```
your-app/
├── app/
│   ├── layout.tsx              # Root layout with meta tags
│   ├── page.tsx               # Home page
│   └── [dynamic]/page.tsx     # Dynamic pages
├── public/
│   ├── .well-known/
│   │   └── farcaster.json     # Mini App manifest
│   ├── og-image.png           # 1200x630px
│   ├── icon-192.png           # 192x192px
│   └── icon-512.png           # 512x512px
└── contexts/
    └── FarcasterContext.tsx   # SDK integration
```

---

## 📋 Meta Tags Configuration

### ✅ Correct Format (JSON Content)

**❌ WRONG - Individual Properties:**
```html
<meta name="fc:miniapp:version" content="1.0" />
<meta name="fc:miniapp:image" content="https://..." />
<meta name="fc:miniapp:button:1" content="Play Now" />
```

**✅ CORRECT - JSON Content:**
```html
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://yourdomain.com/og-image.png","button":{"title":"Play Now","action":{"type":"launch_miniapp","name":"Your App","url":"https://yourdomain.com","splashImageUrl":"https://yourdomain.com/og-image.png","splashBackgroundColor":"#000000"}}}' />
```

### ✅ Layout.tsx Template

```typescript
// app/layout.tsx
import type { Metadata } from "next"

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
      <body>{children}</body>
    </html>
  )
}
```

### ✅ Dynamic Page Metadata Template

```typescript
// app/[slug]/page.tsx
import { Metadata } from "next"

type Props = {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = params.slug
  
  return {
    title: `Page ${slug} - Your App`,
    description: `Dynamic page ${slug} description`,
    openGraph: {
      title: `Page ${slug} - Your App`,
      description: `Dynamic page ${slug} description`,
      images: ["https://yourdomain.com/og-image.png"],
      url: `https://yourdomain.com/${slug}`,
    },
    other: {
      "fc:miniapp": `{"version":"1","imageUrl":"https://yourdomain.com/og-image.png","button":{"title":"View Page","action":{"type":"launch_miniapp","name":"Your App","url":"https://yourdomain.com/${slug}","splashImageUrl":"https://yourdomain.com/og-image.png","splashBackgroundColor":"#000000"}}}`,
    },
  }
}

export default function DynamicPage({ params }: Props) {
  return <div>Page content for {params.slug}</div>
}
```

---

## 📄 Manifest Setup

### ✅ Complete Manifest Template

```json
// public/.well-known/farcaster.json
{
  "miniapp": {
    "version": "1",
    "name": "Your App Name",
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

### ✅ Next.js Configuration

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

---

## 🖼️ Asset Requirements

### ✅ Image Specifications

| Asset | Dimensions | Format | Max Size | Purpose |
|-------|------------|--------|----------|---------|
| og-image.png | 1200x630px | PNG | 5MB | Social sharing preview |
| icon-192.png | 192x192px | PNG | 1MB | Mobile icon |
| icon-512.png | 512x512px | PNG | 2MB | App icon |

### ✅ Asset Creation Tools

**Free Options:**
- **Canva** - Templates for OG images
- **Figma** - Professional design
- **GIMP** - Free image editor
- **Online converters** - SVG to PNG

**Quick OG Image Template:**
```html
<!-- Save as generate-og.html, open in browser, screenshot -->
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            width: 1200px; height: 630px;
            background: #000; color: #fff;
            font-family: Arial, sans-serif;
            display: flex; flex-direction: column;
            justify-content: center; align-items: center;
        }
        .title { font-size: 72px; font-weight: bold; }
        .subtitle { font-size: 32px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="title">YOUR APP</div>
    <div class="subtitle">Your tagline here</div>
</body>
</html>
```

---

## ⚛️ Next.js Integration

### ✅ Server vs Client Components

**❌ WRONG - Client Component with Metadata:**
```typescript
"use client"
export const metadata = { ... } // Won't work!
```

**✅ CORRECT - Server Component:**
```typescript
// No "use client" directive
export const metadata = { ... } // Works!
```

**✅ CORRECT - Client Component Wrapper:**
```typescript
// app/page.tsx (Server Component)
import ClientComponent from './client-component'

export const metadata = { ... }

export default function Page() {
  return <ClientComponent />
}

// app/client-component.tsx (Client Component)
"use client"
export default function ClientComponent() {
  return <div>Client content</div>
}
```

### ✅ SDK Integration Template

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
        setIsAvailable(typeof window !== "undefined" && typeof sdk !== "undefined")
        await sdk.actions.ready()
        setAuth(prev => ({ ...prev, isLoading: false }))
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error)
        setAuth(prev => ({ ...prev, isLoading: false }))
      }
    }
    initSDK()
  }, [])

  const login = async () => {
    try {
      setAuth(prev => ({ ...prev, isLoading: true }))
      await sdk.actions.signIn()
      const tokenResult = await sdk.quickAuth.getToken()
      setAuth({
        isAuthenticated: true,
        user: { fid: 12345, username: "user" }, // Mock user
        token: tokenResult?.token || null,
        isLoading: false,
      })
    } catch (error) {
      console.error("Login failed:", error)
      setAuth(prev => ({ ...prev, isLoading: false }))
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
    try {
      await sdk.actions.composeCast(text)
    } catch (error) {
      console.error("Failed to share:", error)
      throw error
    }
  }

  const hapticFeedback = {
    success: async () => {
      try {
        await sdk.haptics.notification("success")
      } catch (error) {
        console.error("Haptic feedback failed:", error)
      }
    },
    error: async () => {
      try {
        await sdk.haptics.notification("error")
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

---

## 🐛 Common Issues & Solutions

### ❌ "No Embed Error"

**Causes:**
1. Wrong meta tag format (individual properties instead of JSON)
2. Missing PNG assets
3. Domain mismatch between manifest and actual domain
4. Client component exporting metadata

**Solutions:**
1. Use JSON content format in `fc:miniapp` meta tag
2. Create proper PNG assets (not SVG)
3. Ensure all URLs match your actual domain
4. Move metadata to server components only

### ❌ Preview Image Not Showing

**Causes:**
1. Image dimensions wrong (must be 1200x630px)
2. Image format not supported (use PNG, not SVG)
3. Image file too small or corrupted
4. Image URL not accessible

**Solutions:**
1. Create proper 1200x630px PNG image
2. Test image URL directly in browser
3. Use high-quality image (not placeholder)
4. Ensure image is publicly accessible

### ❌ Domain Mismatch Issues

**Problem:** Manifest URLs don't match actual domain

**Solution:** Update all URLs consistently
```bash
# Find and replace all instances
find . -name "*.tsx" -o -name "*.ts" -o -name "*.json" | xargs sed -i 's/writecast.vercel.app/writecast-1.vercel.app/g'
```

### ❌ Metadata Not Rendering

**Causes:**
1. Client component exporting metadata
2. Metadata in wrong file
3. Next.js version incompatibility

**Solutions:**
1. Move metadata to server components
2. Use `generateMetadata` for dynamic pages
3. Ensure Next.js 14+ with App Router

---

## 🧪 Testing Checklist

### ✅ Local Testing
- [ ] Run `npm run dev`
- [ ] Visit `http://localhost:3000`
- [ ] Check page source for meta tags
- [ ] Test manifest: `http://localhost:3000/.well-known/farcaster.json`
- [ ] Verify image URLs are accessible

### ✅ Deployment Testing
- [ ] Deploy to Vercel
- [ ] Test production URLs
- [ ] Verify manifest accessibility
- [ ] Check image loading
- [ ] Test dynamic page metadata

### ✅ Farcaster Testing
- [ ] Share main URL in Farcaster
- [ ] Share dynamic page URL
- [ ] Verify embed appears correctly
- [ ] Test "Play Now" button functionality
- [ ] Check preview image shows

### ✅ Debug Tools
- **Frame Validator:** https://warpcast.com/~/developers/frames
- **Meta Tag Checker:** https://metatags.io/
- **Image Validator:** Test image URLs directly
- **Console Logs:** Check for SDK errors

---

## 🚀 Deployment Guide

### ✅ Vercel Configuration

```json
// vercel.json
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

### ✅ Environment Variables

```bash
# .env.local
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_FARCASTER_APP_ID=your-app-name
```

### ✅ Domain Setup

**Option 1: Use Vercel Domain**
- Use `your-app.vercel.app`
- Update all URLs to match
- No additional setup needed

**Option 2: Custom Domain**
- Add domain in Vercel dashboard
- Update DNS records
- Update all URLs in code
- Generate domain verification signature

---

## 📚 Code Templates

### ✅ Complete Project Template

```bash
# Create new project
npx create-next-app@latest my-farcaster-app
cd my-farcaster-app

# Install dependencies
npm install @farcaster/miniapp-sdk

# Copy templates from this guide
# Update URLs and app names
# Deploy to Vercel
```

### ✅ Command Handler Template

```typescript
// lib/command-handler.ts
import { sdk } from "@farcaster/miniapp-sdk"

export async function handleFarcasterCommand(
  command: string,
  args: string[],
  farcasterContext: any
) {
  switch (command) {
    case "login":
      await farcasterContext.login()
      break
    case "share":
      await farcasterContext.shareContent(`Check out this content: ${args[0]}`)
      break
    case "haptic":
      await farcasterContext.hapticFeedback.success()
      break
  }
}
```

---

## 🎯 Best Practices

### ✅ Do's
- Always use server components for metadata
- Test locally before deploying
- Use proper PNG assets (not SVG)
- Keep URLs consistent across all files
- Use JSON content format for meta tags
- Test in actual Farcaster client

### ❌ Don'ts
- Don't export metadata from client components
- Don't use individual `fc:miniapp:*` properties
- Don't use SVG images for OG images
- Don't mix domain URLs
- Don't skip testing the manifest
- Don't ignore console errors

---

## 🔗 Resources

- **Farcaster Docs:** https://miniapps.farcaster.xyz/docs
- **Next.js Metadata:** https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- **Vercel Deployment:** https://vercel.com/docs
- **Frame Validator:** https://warpcast.com/~/developers/frames

---

## 📝 Quick Reference

### Meta Tag Format
```html
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://domain.com/image.png","button":{"title":"Action","action":{"type":"launch_miniapp","name":"App","url":"https://domain.com","splashImageUrl":"https://domain.com/image.png","splashBackgroundColor":"#000000"}}}' />
```

### Manifest Structure
```json
{
  "miniapp": {
    "version": "1",
    "name": "App Name",
    "iconUrl": "https://domain.com/icon.png",
    "homeUrl": "https://domain.com"
  }
}
```

### Asset Requirements
- og-image.png: 1200x630px PNG
- icon-192.png: 192x192px PNG  
- icon-512.png: 512x512px PNG

---

**🎉 You're ready to build amazing Farcaster Mini Apps!**

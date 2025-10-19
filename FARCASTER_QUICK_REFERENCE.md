# Farcaster Mini App Quick Reference

> **One-page cheat sheet for Farcaster Mini App development**

## 🚀 Quick Setup (5 minutes)

```bash
# 1. Install SDK
npm install @farcaster/miniapp-sdk

# 2. Create manifest
mkdir -p public/.well-known
# Copy manifest template below

# 3. Add meta tags to layout.tsx
# Copy meta tag template below

# 4. Create assets
# og-image.png (1200x630px), icon-192.png, icon-512.png

# 5. Deploy to Vercel
vercel --prod
```

---

## 📋 Essential Files

### ✅ Manifest Template
```json
// public/.well-known/farcaster.json
{
  "miniapp": {
    "version": "1",
    "name": "Your App",
    "iconUrl": "https://yourdomain.com/icon-512.png",
    "homeUrl": "https://yourdomain.com",
    "splashImageUrl": "https://yourdomain.com/og-image.png",
    "splashBackgroundColor": "#000000"
  },
  "verification": {
    "domain": "yourdomain.com",
    "signature": "PLACEHOLDER_SIGNATURE"
  }
}
```

### ✅ Meta Tags Template
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  other: {
    "farcaster:app": "your-app-name",
    "farcaster:app_url": "https://yourdomain.com",
    "fc:miniapp": '{"version":"1","imageUrl":"https://yourdomain.com/og-image.png","button":{"title":"Launch","action":{"type":"launch_miniapp","name":"Your App","url":"https://yourdomain.com","splashImageUrl":"https://yourdomain.com/og-image.png","splashBackgroundColor":"#000000"}}}',
  },
}
```

### ✅ Dynamic Page Template
```typescript
// app/[slug]/page.tsx
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  return {
    other: {
      "fc:miniapp": `{"version":"1","imageUrl":"https://yourdomain.com/og-image.png","button":{"title":"View","action":{"type":"launch_miniapp","name":"Your App","url":"https://yourdomain.com/${params.slug}","splashImageUrl":"https://yourdomain.com/og-image.png","splashBackgroundColor":"#000000"}}}`,
    },
  }
}
```

---

## 🖼️ Asset Requirements

| File | Size | Format | Purpose |
|------|------|--------|---------|
| og-image.png | 1200x630px | PNG | Preview image |
| icon-192.png | 192x192px | PNG | Mobile icon |
| icon-512.png | 512x512px | PNG | App icon |

---

## 🐛 Common Issues & Quick Fixes

### ❌ "No Embed Error"
**Fix:** Use JSON content format, not individual properties
```html
<!-- WRONG -->
<meta name="fc:miniapp:version" content="1" />

<!-- CORRECT -->
<meta name="fc:miniapp" content='{"version":"1",...}' />
```

### ❌ Preview Image Missing
**Fix:** Create proper 1200x630px PNG (not SVG)
```bash
# Test image URL
curl -I https://yourdomain.com/og-image.png
```

### ❌ Domain Mismatch
**Fix:** Update all URLs consistently
```bash
# Find and replace
find . -name "*.tsx" -o -name "*.json" | xargs sed -i 's/old-domain.com/new-domain.com/g'
```

### ❌ Metadata Not Working
**Fix:** Move to server component (remove "use client")
```typescript
// WRONG - Client component
"use client"
export const metadata = { ... }

// CORRECT - Server component
export const metadata = { ... }
```

---

## 🧪 Testing Checklist

- [ ] Local: `http://localhost:3000`
- [ ] Manifest: `http://localhost:3000/.well-known/farcaster.json`
- [ ] Images load: Test all PNG URLs
- [ ] Deploy: `vercel --prod`
- [ ] Production: Test actual domain
- [ ] Farcaster: Share URL in app

---

## 🔧 SDK Integration

### ✅ Context Provider
```typescript
// contexts/FarcasterContext.tsx
"use client"
import { sdk } from "@farcaster/miniapp-sdk"

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    sdk.actions.ready()
  }, [])

  const login = async () => {
    await sdk.actions.signIn()
  }

  const share = async (text: string) => {
    await sdk.actions.composeCast(text)
  }

  return (
    <FarcasterContext.Provider value={{ login, share }}>
      {children}
    </FarcasterContext.Provider>
  )
}
```

### ✅ Usage Hook
```typescript
// hooks/useFarcaster.ts
export function useFarcaster() {
  const context = useContext(FarcasterContext)
  if (!context) {
    throw new Error("useFarcaster must be used within FarcasterProvider")
  }
  return context
}
```

---

## 📝 Copy-Paste Commands

### ✅ Create New Project
```bash
npx create-next-app@latest my-app
cd my-app
npm install @farcaster/miniapp-sdk
mkdir -p public/.well-known
```

### ✅ Deploy to Vercel
```bash
vercel login
vercel --prod
```

### ✅ Test Manifest
```bash
curl https://yourdomain.com/.well-known/farcaster.json
```

### ✅ Check Meta Tags
```bash
curl -s https://yourdomain.com | grep -i "fc:miniapp"
```

---

## 🎯 Meta Tag Generator

### ✅ JSON Content Builder
```javascript
const metaTagContent = {
  version: "1",
  imageUrl: "https://yourdomain.com/og-image.png",
  button: {
    title: "Launch App",
    action: {
      type: "launch_miniapp",
      name: "Your App",
      url: "https://yourdomain.com",
      splashImageUrl: "https://yourdomain.com/og-image.png",
      splashBackgroundColor: "#000000"
    }
  }
}

const metaTag = `<meta name="fc:miniapp" content='${JSON.stringify(metaTagContent)}' />`
```

---

## 🚨 Critical Rules

1. **Always use JSON content format** for `fc:miniapp`
2. **Never export metadata from client components**
3. **Always use PNG images** (not SVG)
4. **Keep all URLs consistent** across files
5. **Test manifest accessibility** before sharing
6. **Use proper dimensions** for all images

---

## 🔗 Essential Links

- **Farcaster Docs:** https://miniapps.farcaster.xyz/docs
- **Frame Validator:** https://warpcast.com/~/developers/frames
- **Next.js Metadata:** https://nextjs.org/docs/app/building-your-application/optimizing/metadata
- **Vercel Deploy:** https://vercel.com/docs

---

**⚡ Quick Start: Copy templates → Update URLs → Deploy → Test!**

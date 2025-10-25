# Farcaster Mini App Desktop/Web Compatibility Reference

## Critical Issue: Splash Screen Hang

### The Problem
The Farcaster frame wrapper **always expects `sdk.actions.ready()` to be called** to dismiss the splash screen, regardless of whether the app is running on desktop or mobile.

### The Solution
**ALWAYS call `sdk.actions.ready()` after your app mounts**, even on desktop/web environments.

## Implementation Pattern

### 1. Create ReadySignal Component
```typescript
// components/ready-signal.tsx
"use client"

import { useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"

export function ReadySignal() {
  useEffect(() => {
    const signalReady = async () => {
      try {
        if (typeof sdk !== "undefined" && sdk?.actions?.ready) {
          console.log("ReadySignal: Calling sdk.actions.ready()")
          await sdk.actions.ready()
          console.log("ReadySignal: Splash screen dismissed")
        }
      } catch (error) {
        console.error("ReadySignal: Failed to call ready():", error)
      }
    }
    
    // Call immediately when component mounts
    signalReady()
  }, [])
  
  return null
}
```

### 2. Add to Root Layout
```typescript
// app/layout.tsx
import { ReadySignal } from "@/components/ready-signal"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReadySignal />
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </body>
    </html>
  )
}
```

### 3. FarcasterContext Pattern
```typescript
// contexts/FarcasterContext.tsx
"use client"

import { sdk } from "@farcaster/miniapp-sdk"
import { isFarcasterAvailable } from "@/lib/farcaster/sdk-client"

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    user: null,
    isLoading: false, // Start as false for immediate UI render
  })

  useEffect(() => {
    const initSDK = async () => {
      const available = isFarcasterAvailable()
      
      if (!available) {
        // Desktop/browser mode - create demo user
        const demoUser = {
          fid: 99999,
          username: "browser_user",
          displayName: "Browser User",
        }
        setAuth({
          isAuthenticated: true,
          user: demoUser,
          token: null,
          isLoading: false,
        })
        return
      }

      // Mobile app mode - authenticate in background
      setAuth(prev => ({ ...prev, isLoading: false }))
      
      setTimeout(async () => {
        try {
          const user = await authenticateUser()
          setAuth({
            isAuthenticated: true,
            user,
            token: null,
            isLoading: false,
          })
        } catch (error) {
          console.error("Background auth failed:", error)
        }
      }, 0)
    }

    initSDK()
  }, [])

  return (
    <FarcasterContext.Provider value={{ auth, ... }}>
      {children}
    </FarcasterContext.Provider>
  )
}
```

## Desktop Detection

### SDK Client Pattern
```typescript
// lib/farcaster/sdk-client.ts
import { sdk } from "@farcaster/miniapp-sdk"

export function isFarcasterAvailable(): boolean {
  if (typeof window === "undefined") return false
  
  // Aggressive desktop detection
  const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
  
  if (isDesktop) {
    console.log("Desktop browser detected - Farcaster SDK not available")
    return false
  }
  
  // Additional checks for mobile
  return typeof sdk !== "undefined" && !!sdk.context
}
```

## Critical Rules

### ✅ DO
1. **Always call `sdk.actions.ready()`** - Even on desktop
2. **Call ready() AFTER app mounts** - Not during initialization
3. **Set isLoading: false immediately** - Don't wait for SDK
4. **Make haptic calls non-blocking** - Use `.catch(() => {})` without await
5. **Provide demo/guest mode** - For desktop/browser users

### ❌ DON'T
1. **Don't skip ready() on desktop** - The frame wrapper needs it
2. **Don't await haptic feedback** - It blocks the UI thread
3. **Don't wait for SDK before rendering** - Show UI immediately
4. **Don't call ready() during initialization** - Wait for mount
5. **Don't assume SDK availability** - Always check and fallback

## Haptic Feedback Pattern

```typescript
// Make haptic calls non-blocking
terminalHaptics.deepLinkOpened().catch(() => {})  // No await!

// In haptics wrapper
export const terminalHaptics = {
  async deepLinkOpened() {
    try {
      if (typeof sdk !== "undefined" && sdk?.haptics) {
        await sdk.haptics.impactOccurred("medium")
      }
    } catch (error) {
      // Silently fail - haptics are optional
    }
  }
}
```

## Loading State Pattern

```typescript
// app/page.tsx
"use client"

export default function HomePage() {
  const farcaster = useFarcaster()
  const [maxLoadingReached, setMaxLoadingReached] = useState(false)

  // Safety timeout
  useEffect(() => {
    const timeout = setTimeout(() => {
      setMaxLoadingReached(true)
    }, 6000)
    return () => clearTimeout(timeout)
  }, [])

  // Show loading only briefly
  if (farcaster.auth.isLoading && !maxLoadingReached) {
    return <LoadingScreen />
  }

  return <MainApp />
}
```

## Debugging Checklist

When splash screen hangs:
1. ✅ Check if `sdk.actions.ready()` is called
2. ✅ Verify ready() is called AFTER mount (in useEffect)
3. ✅ Check console for "ready() called successfully" log
4. ✅ Ensure no blocking operations before ready()
5. ✅ Verify haptic calls are non-blocking
6. ✅ Check if isLoading is set to false

## Common Errors

### Error: "Ready not called"
**Cause:** `sdk.actions.ready()` not called or called too early
**Fix:** Add ReadySignal component to layout

### Error: Infinite loading on desktop
**Cause:** Desktop detection not working or ready() not called
**Fix:** Implement aggressive desktop detection + always call ready()

### Error: UI blocks during initialization
**Cause:** Awaiting haptic feedback or blocking SDK calls
**Fix:** Make all optional SDK calls non-blocking

## Testing Commands

```bash
# Check if ready() is being called
# Open browser console and look for:
"ReadySignal: Calling sdk.actions.ready()"
"ReadySignal: Splash screen dismissed"

# Test on desktop
# Should see:
"Desktop browser detected - Farcaster SDK not available"
"FarcasterContext: SDK not available - running in standalone mode"

# Test on mobile (via preview tool)
# Should see:
"ReadySignal: Calling sdk.actions.ready()"
"FarcasterContext: SDK detected - initializing in background"
```

## File Checklist

Required files for proper desktop/web compatibility:
- [ ] `components/ready-signal.tsx` - Calls ready() on mount
- [ ] `contexts/FarcasterContext.tsx` - Handles SDK initialization
- [ ] `lib/farcaster/sdk-client.ts` - Desktop detection logic
- [ ] `app/layout.tsx` - Includes ReadySignal component
- [ ] `app/page.tsx` - Loading state with timeout

## Official Documentation References

- **Loading your app:** https://miniapps.farcaster.xyz/docs/guides/loading
- **sdk.actions.ready():** https://miniapps.farcaster.xyz/docs/sdk/actions/ready
- **Checklist for AI agents:** https://miniapps.farcaster.xyz/docs/guides/agents-checklist

## Key Takeaway

**The Farcaster frame wrapper requires `sdk.actions.ready()` to dismiss the splash screen on BOTH mobile and desktop.** Always call it after your app mounts, regardless of the environment.

## Essential SDK Imports

```typescript
// Always import these for Mini App functionality
import { sdk } from "@farcaster/miniapp-sdk"

// Common SDK usage patterns
await sdk.actions.ready()           // Dismiss splash screen
await sdk.actions.signIn()          // Authenticate user
await sdk.actions.composeCast()     // Share content
await sdk.actions.addMiniApp()      // Add to user's apps
await sdk.haptics.impactOccurred()  // Haptic feedback
```

## Manifest Requirements

```json
{
  "accountAssociation": {
    "header": "...",
    "payload": "...",
    "signature": "..."
  },
  "frame": {
    "version": "1",
    "name": "App Name",
    "iconUrl": "https://domain.com/icon-512.png",
    "homeUrl": "https://domain.com",
    "imageUrl": "https://domain.com/og-image.png",
    "buttonTitle": "Play Now",
    "splashImageUrl": "https://domain.com/icon-512.png",
    "splashBackgroundColor": "#000000"
  }
}
```

## Meta Tag Requirements

```html
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://domain.com/og-image.png","button":{"title":"Play Now","action":{"type":"launch_miniapp","name":"App Name","url":"https://domain.com","splashImageUrl":"https://domain.com/icon-512.png","splashBackgroundColor":"#000000"}}}' />
```

## Asset Requirements

| Asset | Dimensions | Format | Purpose |
|-------|------------|--------|---------|
| og-image.png | 1200x630px | PNG | Social sharing preview |
| icon-192.png | 192x192px | PNG | Mobile icon |
| icon-512.png | 512x512px | PNG | App icon |

## Quick Fix Commands

```bash
# Test manifest accessibility
curl https://yourdomain.com/.well-known/farcaster.json

# Check meta tags
curl -s https://yourdomain.com | grep -i "fc:miniapp"

# Test image accessibility
curl -I https://yourdomain.com/og-image.png
```

## Environment Detection

```typescript
// Check if running in Mini App environment
const isMiniApp = await sdk.isInMiniApp()

// Check platform type
const platformType = sdk.context.client.platformType // 'web' | 'mobile'

// Check capabilities
const capabilities = await sdk.getCapabilities()
const supportsHaptics = capabilities.includes('haptics.impactOccurred')
```

## Error Handling Patterns

```typescript
// Safe SDK calls with fallbacks
try {
  await sdk.actions.ready()
} catch (error) {
  console.warn("Ready call failed:", error)
  // Continue anyway - don't block UI
}

// Non-blocking haptic feedback
sdk.haptics?.impactOccurred?.('medium').catch(() => {
  // Silently fail - haptics are optional
})

// Safe authentication
try {
  const result = await sdk.actions.signIn({ nonce: 'secure-nonce' })
  // Handle successful sign-in
} catch (error) {
  if (error.name === 'RejectedByUser') {
    // User declined to sign in
  } else {
    // Other error
  }
}
```

## Performance Optimization

```typescript
// Preconnect to auth server for faster Quick Auth
<link rel="preconnect" href="https://auth.farcaster.xyz" />

// Use React's preconnect for dynamic imports
import { preconnect } from 'react-dom'
preconnect("https://auth.farcaster.xyz")

// Cache SDK context to avoid repeated calls
const context = await sdk.context
// Use context throughout app lifecycle
```

## Testing Checklist

### Local Development
- [ ] App loads without splash screen hang
- [ ] Console shows "ready() called successfully"
- [ ] Desktop detection works correctly
- [ ] Demo user created for browser mode
- [ ] No blocking operations during initialization

### Production Deployment
- [ ] Manifest accessible at `/.well-known/farcaster.json`
- [ ] Meta tags present in HTML head
- [ ] Images load correctly (PNG format)
- [ ] Domain matches manifest URLs
- [ ] App works in Farcaster preview tool

### Mobile Testing
- [ ] App opens in Farcaster client
- [ ] Splash screen dismisses quickly
- [ ] Authentication works
- [ ] Haptic feedback functions
- [ ] Sharing works correctly

---

**🎯 Remember: The key to desktop/web compatibility is ALWAYS calling `sdk.actions.ready()` after your app mounts, regardless of the environment!**

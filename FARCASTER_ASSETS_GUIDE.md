# Farcaster Mini App Assets Guide

## Required Assets for Writecast

Your Farcaster mini app is now configured with proper metadata and manifest, but you need to create these assets for optimal social sharing and app installation:

### 1. Open Graph Image (Required)
**File:** `public/og-image.png`  
**Size:** 1200x630px  
**Purpose:** Social media preview when sharing your app

**Design Requirements:**
- Background: Dark terminal color `#0a1628`
- Include "WRITECAST" ASCII art or logo
- Tagline: "CLI Word Game on Farcaster"
- Terminal aesthetic with green/cyan text
- Clean, readable design for small previews

**Tools to Create:**
- Figma, Canva, or Photoshop
- Use terminal fonts like "Fira Code" or "JetBrains Mono"
- Export as PNG with high quality

### 2. App Icons (Required)
**Files:** `public/icon-192.png` and `public/icon-512.png`  
**Sizes:** 192x192px and 512x512px  
**Purpose:** Mobile home screen and splash screen icons

**Design Requirements:**
- Square format with rounded corners (handled by OS)
- Terminal-themed design
- "W" letter or ASCII art symbol
- High contrast for visibility
- Works well at small sizes

**Tools to Create:**
- Use same design for both sizes
- Ensure 512px version is crisp when scaled down
- Export as PNG with transparent background

### 3. Optional: Additional Icons
**Files:** `public/icon-180.png` (Apple Touch Icon)  
**Size:** 180x180px  
**Purpose:** iOS home screen icon

## Farcaster Mini App Integration

### ✅ Manifest Implementation (Complete)
**File:** `public/.well-known/farcaster.json`

Your app now has a proper Farcaster manifest that:
- Registers your app with Farcaster clients
- Enables app store listings and discovery
- Supports notifications (webhook configured)
- Provides app identity and metadata

**Key Features:**
- App name: "Writecast"
- Description: Terminal-style word game
- Icon: Points to `/icon-512.png`
- Home URL: `https://writecast.vercel.app`
- Webhook URL: Configured for notifications
- Domain verification: Placeholder (needs production signature)

### ✅ Embed Implementation (Complete)
**Files:** `app/page.tsx`, `app/play/[gameCode]/page.tsx`

Your app now has proper `fc:miniapp` embed tags that:
- Enable social sharing as rich cards
- Show game-specific previews
- Provide "Play Now" buttons
- Support deep linking to specific games

**Embed Features:**
- Main page: General app sharing with "Play Now" button
- Game pages: Dynamic metadata with game info and "Play Game" button
- Open Graph fallback for non-Farcaster clients
- Consistent branding across all embeds

### 🔧 Domain Verification (Production Required)

The manifest includes a placeholder signature that needs to be updated in production:

```json
"verification": {
  "domain": "writecast.vercel.app",
  "signature": "PLACEHOLDER_SIGNATURE_TO_BE_UPDATED_IN_PRODUCTION"
}
```

**To generate the actual signature:**
1. Use Farcaster's domain verification tools
2. Sign the manifest with your domain's private key
3. Replace the placeholder signature
4. Deploy the updated manifest

## Current Status

✅ **Farcaster manifest created** - `public/.well-known/farcaster.json`  
✅ **Embed tags implemented** - `fc:miniapp` tags on all pages  
✅ **Dynamic metadata** - Game-specific previews  
✅ **Deep linking** - Direct game access via URLs  
✅ **PWA manifest** - `public/manifest.json`  
✅ **Metadata configured** - Enhanced Open Graph tags  
✅ **PWA ready** - App can be installed on mobile devices  
⏳ **Assets needed** - OG image and icons required for full functionality

## Testing Your Setup

### 1. Test Manifest
```bash
# Open browser dev tools
# Go to Application tab > Manifest
# Verify manifest loads correctly
```

### 2. Test Open Graph
```bash
# Use Facebook Sharing Debugger
# URL: https://developers.facebook.com/tools/debug/
# Enter: https://writecast.vercel.app
```

### 3. Test Farcaster Frame
```bash
# Use Farcaster Frame Validator
# URL: https://warpcast.com/~/developers/frames
# Enter: https://writecast.vercel.app
```

## Quick Asset Creation Tips

### For OG Image (1200x630px):
1. Create dark background `#0a1628`
2. Add large "WRITECAST" text in cyan `#06b6d4`
3. Add subtitle "CLI Word Game on Farcaster" in green `#10b981`
4. Include terminal-style border or ASCII elements
5. Export as PNG

### For Icons (192x192px and 512x512px):
1. Create square canvas
2. Add "W" letter in terminal font
3. Use terminal colors (cyan/green on dark background)
4. Ensure high contrast
5. Export both sizes as PNG

## Deployment Notes

Once you create these assets:
1. Place them in the `public/` folder
2. Deploy to Vercel
3. Test social sharing
4. Register as Farcaster mini app

Your app will then have:
- Rich social media previews
- Professional app icons
- Full PWA capabilities
- Farcaster frame integration

## Current Configuration

Your app is already configured to use these assets:
- Manifest: `/manifest.json`
- OG Image: `/og-image.png`
- Icons: `/icon-192.png`, `/icon-512.png`
- Farcaster Frame: Configured with "Play Now" button

Just add the visual assets and you're ready to go! 🚀

# PNG Assets Required for Farcaster Embeds

## Critical Issue: Missing PNG Assets

The Farcaster embed is failing because the following PNG files are missing:

### Required Files:
- `public/og-image.png` (1200x630px)
- `public/icon-192.png` (192x192px) 
- `public/icon-512.png` (512x512px)

### Current Status:
- ✅ SVG versions exist (`og-image.svg`, `icon-512.svg`)
- ❌ PNG versions missing (Farcaster requires PNG format)

## Quick Fix Instructions:

### Option 1: Convert SVG to PNG
1. Open `public/og-image.svg` in any image editor
2. Export as PNG with dimensions 1200x630px
3. Save as `public/og-image.png`

4. Open `public/icon-512.svg` in any image editor  
5. Export as PNG with dimensions 512x512px
6. Save as `public/icon-512.png`

7. Resize the 512px PNG to 192x192px
8. Save as `public/icon-192.png`

### Option 2: Create Simple Placeholders
Create simple terminal-themed PNG images with:
- Dark background (#0a1628)
- Green text "WRITECAST"
- Terminal aesthetic
- Correct dimensions

### Option 3: Use Online Converter
1. Upload SVG files to any online SVG-to-PNG converter
2. Set correct dimensions
3. Download and place in `public/` folder

## After Creating PNG Files:
1. Commit the PNG files to git
2. Push to GitHub
3. Wait for Vercel deployment
4. Test Farcaster embed again

## Testing:
Once PNG files are created, test by:
1. Visiting https://writecast.vercel.app
2. Viewing page source to verify meta tags
3. Sharing the link in Farcaster
4. Checking if embed appears correctly

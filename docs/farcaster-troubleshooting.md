# Farcaster Mini App Troubleshooting Guide

> **Comprehensive troubleshooting for Farcaster Mini App issues**

## 🚨 Critical Issues

### ❌ "No Embed Error"

**Symptoms:**
- Farcaster shows "no embed" when sharing URL
- No preview card appears
- Link appears as plain text

**Root Causes & Solutions:**

#### 1. Wrong Meta Tag Format
**Problem:** Using individual properties instead of JSON content

**❌ WRONG:**
```html
<meta name="fc:miniapp:version" content="1.0" />
<meta name="fc:miniapp:image" content="https://..." />
<meta name="fc:miniapp:button:1" content="Play Now" />
```

**✅ CORRECT:**
```html
<meta name="fc:miniapp" content='{"version":"1","imageUrl":"https://yourdomain.com/og-image.png","button":{"title":"Play Now","action":{"type":"launch_miniapp","name":"Your App","url":"https://yourdomain.com","splashImageUrl":"https://yourdomain.com/og-image.png","splashBackgroundColor":"#000000"}}}' />
```

**Fix Steps:**
1. Remove all individual `fc:miniapp:*` meta tags
2. Add single `fc:miniapp` meta tag with JSON content
3. Ensure JSON is properly escaped in HTML

#### 2. Missing PNG Assets
**Problem:** Using SVG or missing image files

**Check:**
```bash
# Verify files exist and are PNG
ls -la public/og-image.png public/icon-192.png public/icon-512.png

# Check file sizes (should be > 1KB for proper images)
file public/og-image.png
```

**Fix:**
1. Create proper PNG files with correct dimensions
2. Ensure files are publicly accessible
3. Test image URLs directly in browser

#### 3. Domain Mismatch
**Problem:** URLs in manifest/meta tags don't match actual domain

**Check:**
```bash
# Check what domain you're actually using
vercel ls

# Compare with your manifest
cat public/.well-known/farcaster.json | grep -E "(homeUrl|iconUrl|splashImageUrl)"
```

**Fix:**
1. Update all URLs to match actual domain
2. Use consistent domain across all files
3. Test manifest accessibility

#### 4. Client Component Metadata
**Problem:** Exporting metadata from client component

**❌ WRONG:**
```typescript
"use client"
export const metadata = { ... } // Won't work!
```

**✅ CORRECT:**
```typescript
// Server component (no "use client")
export const metadata = { ... } // Works!
```

**Fix:**
1. Move metadata to server component
2. Use client wrapper for interactive content
3. Use `generateMetadata` for dynamic pages

---

### ❌ Preview Image Not Showing

**Symptoms:**
- Embed appears but no image
- Blank image placeholder
- Broken image icon

**Root Causes & Solutions:**

#### 1. Wrong Image Dimensions
**Problem:** Image not 1200x630px

**Check:**
```bash
# Check image dimensions
identify public/og-image.png
# Should show: 1200x630
```

**Fix:**
1. Resize image to exactly 1200x630px
2. Use PNG format (not JPEG/SVG)
3. Ensure aspect ratio is maintained

#### 2. Image Format Issues
**Problem:** Using SVG or unsupported format

**Check:**
```bash
# Check file type
file public/og-image.png
# Should show: PNG image data
```

**Fix:**
1. Convert SVG to PNG
2. Use high-quality PNG (not placeholder)
3. Optimize file size (< 5MB)

#### 3. Image URL Not Accessible
**Problem:** Image URL returns 404 or error

**Check:**
```bash
# Test image URL
curl -I https://yourdomain.com/og-image.png
# Should return: HTTP/1.1 200 OK
```

**Fix:**
1. Ensure image is in `public/` folder
2. Check file permissions
3. Verify deployment includes image

#### 4. Image File Corrupted
**Problem:** Image file is corrupted or too small

**Check:**
```bash
# Check file size
ls -la public/og-image.png
# Should be > 1KB (not 568 bytes like placeholder)
```

**Fix:**
1. Replace with proper image
2. Don't use placeholder files
3. Create high-quality image

---

### ❌ Manifest Not Found

**Symptoms:**
- 404 error on manifest URL
- Farcaster can't find app configuration
- Verification fails

**Root Causes & Solutions:**

#### 1. Wrong File Location
**Problem:** Manifest not in correct location

**Check:**
```bash
# Verify file exists
ls -la public/.well-known/farcaster.json
```

**Fix:**
1. Ensure file is at `public/.well-known/farcaster.json`
2. Check file permissions
3. Verify deployment includes file

#### 2. Wrong Content-Type
**Problem:** Server not serving JSON content type

**Check:**
```bash
# Check content type
curl -I https://yourdomain.com/.well-known/farcaster.json
# Should show: Content-Type: application/json
```

**Fix:**
1. Add headers configuration to `next.config.mjs`
2. Add headers rule to `vercel.json`
3. Ensure server serves correct content type

#### 3. Invalid JSON Format
**Problem:** Manifest contains invalid JSON

**Check:**
```bash
# Validate JSON
cat public/.well-known/farcaster.json | jq .
```

**Fix:**
1. Fix JSON syntax errors
2. Ensure all strings are quoted
3. Remove trailing commas

---

### ❌ SDK Integration Issues

**Symptoms:**
- SDK not initializing
- Authentication fails
- Features not working

**Root Causes & Solutions:**

#### 1. SDK Not Available
**Problem:** SDK not loaded or available

**Check:**
```typescript
// Check if SDK is available
console.log(typeof sdk !== 'undefined') // Should be true
```

**Fix:**
1. Ensure SDK is installed: `npm install @farcaster/miniapp-sdk`
2. Check import statement
3. Verify SDK is loaded before use

#### 2. Context Not Provided
**Problem:** Using SDK outside of Farcaster context

**Check:**
```typescript
// Check if running in Farcaster
console.log(window.location.hostname.includes('farcaster'))
```

**Fix:**
1. Add proper error handling
2. Check if running in Farcaster environment
3. Provide fallbacks for non-Farcaster environments

#### 3. Authentication Flow Issues
**Problem:** Login/signup not working

**Check:**
```typescript
// Check authentication state
console.log(sdk.auth.isAuthenticated)
```

**Fix:**
1. Implement proper error handling
2. Check authentication flow
3. Handle token refresh

---

## 🔍 Debugging Tools

### ✅ Frame Validator
**URL:** https://warpcast.com/~/developers/frames

**Usage:**
1. Enter your URL
2. Check for errors
3. Verify meta tags
4. Test image loading

### ✅ Meta Tag Checker
**URL:** https://metatags.io/

**Usage:**
1. Enter your URL
2. Check Open Graph tags
3. Verify image dimensions
4. Test social sharing

### ✅ Browser DevTools
**Steps:**
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check for failed requests
5. Verify image loading

### ✅ Console Logging
**Add to your app:**
```typescript
// Debug meta tags
useEffect(() => {
  const metaTags = document.querySelectorAll('meta[name*="fc:"]')
  console.log('Farcaster meta tags:', metaTags)
}, [])

// Debug SDK
useEffect(() => {
  console.log('SDK available:', typeof sdk !== 'undefined')
  console.log('SDK version:', sdk?.version)
}, [])
```

---

## 🧪 Testing Checklist

### ✅ Local Testing
- [ ] Run `npm run dev`
- [ ] Visit `http://localhost:3000`
- [ ] Check page source for meta tags
- [ ] Test manifest: `http://localhost:3000/.well-known/farcaster.json`
- [ ] Verify image URLs load
- [ ] Check console for errors

### ✅ Deployment Testing
- [ ] Deploy to Vercel: `vercel --prod`
- [ ] Test production URLs
- [ ] Verify manifest accessibility
- [ ] Check image loading
- [ ] Test dynamic page metadata
- [ ] Verify all URLs work

### ✅ Farcaster Testing
- [ ] Share main URL in Farcaster
- [ ] Share dynamic page URL
- [ ] Verify embed appears correctly
- [ ] Test "Play Now" button functionality
- [ ] Check preview image shows
- [ ] Test on different devices

---

## 🚨 Emergency Fixes

### ✅ Quick Fix for "No Embed Error"
```bash
# 1. Check meta tag format
curl -s https://yourdomain.com | grep -i "fc:miniapp"

# 2. Fix if needed (replace with correct JSON format)
# 3. Check manifest
curl https://yourdomain.com/.well-known/farcaster.json

# 4. Check images
curl -I https://yourdomain.com/og-image.png

# 5. Redeploy
vercel --prod
```

### ✅ Quick Fix for Missing Preview Image
```bash
# 1. Check image dimensions
identify public/og-image.png

# 2. Resize if needed (1200x630px)
# 3. Ensure PNG format
# 4. Test URL
curl -I https://yourdomain.com/og-image.png

# 5. Redeploy
vercel --prod
```

### ✅ Quick Fix for Domain Mismatch
```bash
# 1. Find actual domain
vercel ls

# 2. Update all URLs
find . -name "*.tsx" -o -name "*.ts" -o -name "*.json" | xargs sed -i 's/old-domain.com/new-domain.com/g'

# 3. Commit and deploy
git add . && git commit -m "fix: Update domain URLs" && vercel --prod
```

---

## 📞 Getting Help

### ✅ Self-Diagnosis Steps
1. **Check Frame Validator** - https://warpcast.com/~/developers/frames
2. **Verify Meta Tags** - Use browser DevTools
3. **Test Manifest** - Direct URL access
4. **Check Images** - Test image URLs
5. **Review Console** - Look for errors

### ✅ Common Solutions
1. **Use JSON format** for meta tags
2. **Create proper PNG assets**
3. **Match all URLs** to actual domain
4. **Use server components** for metadata
5. **Test locally first**

### ✅ When to Ask for Help
- Frame validator shows errors you can't fix
- Images still not showing after proper setup
- SDK integration not working
- Authentication flow issues
- Custom domain verification problems

---

**🎯 Remember: Most issues are caused by wrong meta tag format, missing PNG assets, or domain mismatches!**

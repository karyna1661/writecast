# OG Image Generator for Writecast

## Problem
The current `og-image.png` is only 568 bytes (placeholder file), which is why the preview image doesn't show in Farcaster.

## Solution
Create a proper 1200x630px PNG image with Writecast branding.

## Quick Fix Instructions

### Option 1: Use Online Tool
1. Go to https://www.canva.com/ or https://www.figma.com/
2. Create a new design with dimensions 1200x630px
3. Add dark background (#0a1628)
4. Add green text "WRITECAST" in large font
5. Add subtitle "CLI Word Game on Farcaster"
6. Export as PNG
7. Save as `public/og-image.png`

### Option 2: Use HTML Generator
1. Create this HTML file:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            padding: 0;
            width: 1200px;
            height: 630px;
            background: #0a1628;
            font-family: 'Courier New', monospace;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #00ff00;
        }
        .title {
            font-size: 72px;
            font-weight: bold;
            margin-bottom: 20px;
            text-shadow: 0 0 10px #00ff00;
        }
        .subtitle {
            font-size: 32px;
            color: #00ffff;
            margin-bottom: 40px;
        }
        .description {
            font-size: 24px;
            color: #ffffff;
            text-align: center;
            max-width: 800px;
            line-height: 1.4;
        }
        .terminal-prompt {
            font-size: 20px;
            color: #00ff00;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="title">WRITECAST</div>
    <div class="subtitle">CLI Word Game on Farcaster</div>
    <div class="description">
        Create and play word games through terminal commands.<br>
        Two modes: Fill-in-Blank & Frame-the-Word
    </div>
    <div class="terminal-prompt">$ play ABC123</div>
</body>
</html>
```

2. Open in browser
3. Take screenshot at 1200x630px
4. Save as `public/og-image.png`

### Option 3: Use Placeholder Service
1. Go to https://via.placeholder.com/1200x630/0a1628/00ff00?text=WRITECAST
2. Right-click and save image as `public/og-image.png`

## After Creating Image
1. Verify file size is > 1KB
2. Test image URL: https://writecast-1.vercel.app/og-image.png
3. Commit and deploy
4. Test in Farcaster

## Expected Result
- Preview image shows correctly in Farcaster
- Rich embed with proper branding
- Professional appearance

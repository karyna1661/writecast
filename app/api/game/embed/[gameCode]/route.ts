import { NextRequest, NextResponse } from "next/server"
import { getGameByCode } from "@/lib/actions/game-actions"

export async function GET(
  request: NextRequest,
  { params }: { params: { gameCode: string } }
) {
  try {
    const { gameCode } = params
    const { searchParams } = new URL(request.url)
    const sharer = searchParams.get('sharer')
    const invitedBy = searchParams.get('invitedBy')
    const invitee = searchParams.get('invitee')

    if (!gameCode) {
      return new NextResponse("Game code is required", { status: 400 })
    }

    // Get game details
    const { data: game, error } = await getGameByCode(gameCode.toUpperCase())
    if (error || !game) {
      return new NextResponse("Game not found", { status: 404 })
    }

    // Determine the Mini App URL based on context
    let miniAppUrl = "https://farcaster.xyz/miniapps/lgcZHUGhSVly/writecast"
    let queryParams = `code=${gameCode.toUpperCase()}`
    
    if (sharer) {
      queryParams += `&sharer=${sharer}`
    }
    if (invitedBy) {
      queryParams += `&invitedBy=${invitedBy}`
    }
    if (invitee) {
      queryParams += `&invitee=${invitee}`
    }

    const fullMiniAppUrl = `${miniAppUrl}?${queryParams}`

    // Generate OG image URL - use the new icon
    const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://writecast-1.vercel.app"}/icon-512.png`

    // Create HTML with Farcaster meta tags
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Writecast Game - ${gameCode.toUpperCase()}</title>
    
    <!-- Farcaster Mini App Meta Tags -->
    <meta name="fc:miniapp" content='{
      "version": "1",
      "imageUrl": "${ogImageUrl}",
      "button": {
        "title": "Play Now",
        "action": {
          "type": "launch_miniapp",
          "url": "${fullMiniAppUrl}"
        }
      }
    }' />
    
    <meta name="fc:frame" content='{
      "version": "1",
      "imageUrl": "${ogImageUrl}",
      "button": {
        "title": "Play Now",
        "action": {
          "type": "launch_miniapp",
          "url": "${fullMiniAppUrl}"
        }
      }
    }' />
    
    <!-- Standard Open Graph Meta Tags -->
    <meta property="og:title" content="Writecast Game - ${gameCode.toUpperCase()}" />
    <meta property="og:description" content="Can you guess the hidden word? Play this ${game.game_type === 'fill-blank' ? 'Fill-in-Blank' : 'Frame-the-Word'} word game!" />
    <meta property="og:image" content="${ogImageUrl}" />
    <meta property="og:url" content="${request.url}" />
    <meta property="og:type" content="website" />
    
    <!-- Twitter Card Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Writecast Game - ${gameCode.toUpperCase()}" />
    <meta name="twitter:description" content="Can you guess the hidden word? Play this ${game.game_type === 'fill-blank' ? 'Fill-in-Blank' : 'Frame-the-Word'} word game!" />
    <meta name="twitter:image" content="${ogImageUrl}" />
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
        }
        .game-code {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin: 20px 0;
        }
        .game-type {
            font-size: 1.2em;
            color: #666;
            margin-bottom: 20px;
        }
        .play-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1em;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
        }
        .play-button:hover {
            background: #5a6fd8;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎮 Writecast Game</h1>
        <div class="game-code">${gameCode.toUpperCase()}</div>
        <div class="game-type">${game.game_type === 'fill-blank' ? 'Fill-in-Blank' : 'Frame-the-Word'} Word Game</div>
        <p>Can you guess the hidden word? Click "Play Now" to start!</p>
        <a href="${fullMiniAppUrl}" class="play-button">Play Now</a>
    </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error("Embed API Error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

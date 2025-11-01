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

    // Create minimal HTML with frame meta tags only; no auto-redirect
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Writecast Game - ${gameCode.toUpperCase()}</title>
    
    <!-- Farcaster Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${ogImageUrl}" />
    <meta property="fc:frame:button:1" content="Play Now" />
    <meta property="fc:frame:button:1:action" content="launch_miniapp" />
    <meta property="fc:frame:button:1:target" content="${fullMiniAppUrl}" />
    
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
    
</head>
<body>
    <p>Play in Farcaster: use the "Play Now" button.</p>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
      },
    })
  } catch (error) {
    console.error("Embed API Error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

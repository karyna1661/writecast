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

    // Build target URL using direct app URL (not Farcaster mini app format)
    // This ensures query parameters are preserved when launch_miniapp opens the mini app
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://writecast-1.vercel.app"
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

    // Use direct app URL so query parameters are preserved when launch_miniapp opens the mini app
    const fullMiniAppUrl = `${appBaseUrl}/?${queryParams}`

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
        // Shorter cache time for frame metadata to ensure fresh scrapes
        // Farcaster may cache the frame HTML, so we want fresh metadata
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error("Embed API Error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

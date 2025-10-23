import { NextRequest, NextResponse } from "next/server"
import { getGameByCode } from "@/lib/actions/game-actions"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { gameId, userId } = await request.json()

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 }
      )
    }

    // Verify game exists
    const { data: game, error: gameError } = await getGameByCode(gameId.toUpperCase())
    if (gameError || !game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      )
    }

    // Record share in database
    const supabase = await createClient()
    const { error: shareError } = await supabase
      .from("game_shares")
      .insert({
        game_id: game.id,
        shared_by_user_id: userId || null,
        share_platform: "farcaster",
        share_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://writecast-1.vercel.app"}/api/game/embed/${gameId}`
      })

    if (shareError) {
      console.error("Failed to record share:", shareError)
      // Don't fail the request if recording fails
    }

    // Generate share URL with embed metadata
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://writecast-1.vercel.app"}/api/game/embed/${gameId}?sharer=${userId || 'anonymous'}`

    return NextResponse.json({
      shareUrl,
      gameCode: gameId.toUpperCase(),
      gameMode: game.game_type,
      masterpiece: game.masterpiece_text
    })
  } catch (error) {
    console.error("Share API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

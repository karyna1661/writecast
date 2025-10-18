import { NextRequest, NextResponse } from "next/server"
import { getGameByCode } from "@/lib/actions/game-actions"

export async function GET(
  request: NextRequest,
  { params }: { params: { gameCode: string } }
) {
  try {
    const { gameCode } = params

    if (!gameCode) {
      return NextResponse.json(
        { error: "Game code is required" },
        { status: 400 }
      )
    }

    const { data: game, error } = await getGameByCode(gameCode.toUpperCase())

    if (error || !game) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      )
    }

    // Return game metadata for sharing
    return NextResponse.json({
      gameCode: gameCode.toUpperCase(),
      mode: game.mode,
      masterpiece: game.masterpiece,
      createdAt: game.created_at,
      authorId: game.author_id,
      // Don't expose the hidden word in metadata
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

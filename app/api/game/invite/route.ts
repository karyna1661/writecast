import { NextRequest, NextResponse } from "next/server"
import { getGameByCode, getOrCreateUser } from "@/lib/actions/game-actions"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { gameId, inviterUserId, friendHandle } = await request.json()

    if (!gameId || !inviterUserId || !friendHandle) {
      return NextResponse.json(
        { error: "Game ID, inviter user ID, and friend handle are required" },
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

    // Get or create inviter user
    const { data: inviter, error: userError } = await getOrCreateUser({
      userId: inviterUserId,
      username: inviterUserId.replace('farcaster_', ''),
      displayName: inviterUserId.replace('farcaster_', '')
    })

    if (userError || !inviter) {
      return NextResponse.json(
        { error: "Failed to get inviter user" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if inviter already has an invite for this game
    const { data: existingInvite } = await supabase
      .from("game_invites")
      .select("*")
      .eq("game_id", game.id)
      .eq("inviter_player_id", inviter.id)
      .single()

    if (existingInvite) {
      return NextResponse.json(
        { error: "You have already invited someone for this game" },
        { status: 400 }
      )
    }

    // Create invite record
    const { data: invite, error: inviteError } = await supabase
      .from("game_invites")
      .insert({
        game_id: game.id,
        inviter_player_id: inviter.id,
        invited_username: friendHandle.replace('@', ''),
        status: 'pending'
      })
      .select()
      .single()

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "Failed to create invite" },
        { status: 500 }
      )
    }

    // Grant +1 attempt to inviter immediately
    const { error: sessionError } = await supabase
      .from("game_sessions")
      .upsert({
        game_id: game.id,
        player_id: inviter.id,
        status: 'in_progress',
        has_used_invite: true,
        bonus_attempts: 1,
        invite_id: invite.id
      }, {
        onConflict: 'game_id,player_id'
      })

    if (sessionError) {
      console.error("Failed to grant bonus attempt:", sessionError)
      // Don't fail the request if this fails
    }

    // Generate invite URL with embed metadata
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://writecast-1.vercel.app"}/api/game/embed/${gameId}?invitedBy=${inviterUserId}&invitee=${friendHandle.replace('@', '')}`

    return NextResponse.json({
      inviteUrl,
      inviteId: invite.id,
      gameCode: gameId.toUpperCase(),
      message: "Invite sent! You now have 4 total attempts."
    })
  } catch (error) {
    console.error("Invite API Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

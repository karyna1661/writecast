import { Metadata } from "next"
import { getGameByCode } from "@/lib/actions/game-actions"
import PlayGameClient from "./play-game-client"

type Props = {
  params: { gameCode: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const gameCode = params.gameCode.toUpperCase()
  
  try {
    const { data: game } = await getGameByCode(gameCode)
    
    if (!game) {
      return {
        title: `Game ${gameCode} - Writecast`,
        description: "Game not found on Writecast",
        openGraph: {
          title: `Game ${gameCode} - Writecast`,
          description: "Game not found on Writecast",
          images: ["https://writecast.vercel.app/og-image.png"],
        },
        other: {
          "fc:miniapp": "vNext",
          "fc:miniapp:version": "1.0",
          "fc:miniapp:name": "Writecast",
          "fc:miniapp:image": "https://writecast.vercel.app/og-image.png",
          "fc:miniapp:button:1": "Play Game",
          "fc:miniapp:button:1:action": "link",
          "fc:miniapp:button:1:target": `https://writecast.vercel.app/play/${gameCode}`,
        },
      }
    }

    const gameMode = game.game_type === "fill-blank" ? "Fill-in-Blank" : "Frame-the-Word"
    const description = `${gameMode} word game on Writecast. Can you guess the hidden word?`
    
    return {
      title: `Game ${gameCode} - Writecast`,
      description,
      openGraph: {
        title: `Game ${gameCode} - Writecast`,
        description,
        images: ["https://writecast.vercel.app/og-image.png"],
        url: `https://writecast.vercel.app/play/${gameCode}`,
      },
      other: {
        "fc:miniapp": "vNext",
        "fc:miniapp:version": "1.0",
        "fc:miniapp:name": "Writecast",
        "fc:miniapp:image": "https://writecast.vercel.app/og-image.png",
        "fc:miniapp:button:1": "Play Game",
        "fc:miniapp:button:1:action": "link",
        "fc:miniapp:button:1:target": `https://writecast.vercel.app/play/${gameCode}`,
      },
    }
  } catch (error) {
    return {
      title: `Game ${gameCode} - Writecast`,
      description: "Play this word game on Writecast",
      openGraph: {
        title: `Game ${gameCode} - Writecast`,
        description: "Play this word game on Writecast",
        images: ["https://writecast.vercel.app/og-image.png"],
      },
      other: {
        "fc:miniapp": "vNext",
        "fc:miniapp:version": "1.0",
        "fc:miniapp:name": "Writecast",
        "fc:miniapp:image": "https://writecast.vercel.app/og-image.png",
        "fc:miniapp:button:1": "Play Game",
        "fc:miniapp:button:1:action": "link",
        "fc:miniapp:button:1:target": `https://writecast.vercel.app/play/${gameCode}`,
      },
    }
  }
}

export default function PlayGamePage({ params }: Props) {
  return <PlayGameClient gameCode={params.gameCode} />
}

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
          "fc:miniapp": `{"version":"1","imageUrl":"https://writecast.vercel.app/og-image.png","button":{"title":"Play Game","action":{"type":"launch_miniapp","name":"Writecast","url":"https://writecast.vercel.app/play/${gameCode}","splashImageUrl":"https://writecast.vercel.app/og-image.png","splashBackgroundColor":"#0a1628"}}}`,
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
        "fc:miniapp": `{"version":"1","imageUrl":"https://writecast.vercel.app/og-image.png","button":{"title":"Play Game","action":{"type":"launch_miniapp","name":"Writecast","url":"https://writecast.vercel.app/play/${gameCode}","splashImageUrl":"https://writecast.vercel.app/og-image.png","splashBackgroundColor":"#0a1628"}}}`,
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
        "fc:miniapp": `{"version":"1","imageUrl":"https://writecast.vercel.app/og-image.png","button":{"title":"Play Game","action":{"type":"launch_miniapp","name":"Writecast","url":"https://writecast.vercel.app/play/${gameCode}","splashImageUrl":"https://writecast.vercel.app/og-image.png","splashBackgroundColor":"#0a1628"}}}`,
      },
    }
  }
}

export default function PlayGamePage({ params }: Props) {
  return <PlayGameClient gameCode={params.gameCode} />
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://writecast-1.vercel.app'

  const manifest = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    // Root level metadata
    ogTitle: "Writecast - CLI Word Game",
    ogDescription: "Terminal-style word guessing game. Create puzzles, challenge friends!",
    ogImageUrl: `${baseUrl}/og-image.png`,
    castShareUrl: baseUrl,
    
    frame: {
      version: "1",
      name: "Writecast",
      iconUrl: `${baseUrl}/icon-512.svg`,
      homeUrl: baseUrl,
      imageUrl: `${baseUrl}/og-image.png`,
      buttonTitle: "Play Now",
      splashImageUrl: `${baseUrl}/icon-512.svg`,
      splashBackgroundColor: "#0a1628",
      
      // Additional frame fields
      tagline: "CLI word game on Farcaster",
      subtitle: "Terminal-style word puzzles",
      description: "Writecast is a terminal-style word guessing game where you create puzzles by hiding words in your text or framing them with context. Challenge friends to guess your hidden words and earn points for stumping them!",
      webhookUrl: `${baseUrl}/api/farcaster/webhook`,
      
      // Discovery fields
      primaryCategory: "games",
      tags: ["games", "word-game", "puzzle", "social", "terminal", "cli"],
      screenshotUrls: [
        `${baseUrl}/og-image.png`
      ]
    },
    creator: {
      fid: "10032",
      username: "thatweb3guy",
      displayName: "Hand Of Gold"
    }
  }

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}



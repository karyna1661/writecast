export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://writecast-1.vercel.app'

  const manifest = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    frame: {
      version: "1",
      name: "Writecast",
      iconUrl: `${baseUrl}/icon-512.png`,
      homeUrl: baseUrl,
      imageUrl: `${baseUrl}/og-image.png`,
      buttonTitle: "Play Now",
      splashImageUrl: `${baseUrl}/og-image.png`,
      splashBackgroundColor: "#0a1628"
    },
    creator: {
      fid: "thatweb3guy",
      username: "thatweb3guy",
      displayName: "thatweb3guy"
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



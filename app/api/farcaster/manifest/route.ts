export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://writecast-1.vercel.app'

  const manifest = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    frame: {
      version: 'next',
      name: 'Writecast',
      iconUrl: `${baseUrl}/icon-512.png`,
      splashImageUrl: `${baseUrl}/og-image.png`,
      splashBackgroundColor: '#0a1628',
      homeUrl: baseUrl,
      imageUrl: `${baseUrl}/og-image.png`,
      button: {
        title: 'Play Now',
        action: {
          type: 'launch_frame',
          name: 'Writecast',
          url: baseUrl,
          splashImageUrl: `${baseUrl}/og-image.png`,
          splashBackgroundColor: '#0a1628',
        },
      },
      webhookUrl: `${baseUrl}/api/farcaster/webhook`,
    },
    creator: {
      fid: 'thatweb3guy',
      username: 'thatweb3guy',
      displayName: 'thatweb3guy',
    },
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



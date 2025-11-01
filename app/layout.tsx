import type React from "react"
import "./globals.css"
import { FarcasterProvider } from "@/contexts/FarcasterContext"
import { Analytics } from "@vercel/analytics/react"
import { ReadySignal } from "@/components/ready-signal"
import Script from "next/script"

export const metadata = {
  title: "Writecast - CLI Word Game",
  description: "A terminal-style word guessing game on Farcaster",
  manifest: "/manifest.json",
  metadataBase: new URL('https://writecast-1.vercel.app'),
  openGraph: {
    title: 'Writecast - CLI Word Game',
    description: 'A terminal-style word guessing game on Farcaster',
    url: 'https://writecast-1.vercel.app',
    siteName: 'Writecast',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Writecast Game',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Writecast - CLI Word Game',
    description: 'A terminal-style word guessing game on Farcaster',
    images: ['/icon-512.png'],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: "#1e3a8a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Writecast",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "farcaster:app": "writecast",
    "farcaster:app_url": "https://writecast-1.vercel.app",
    // Mini App embed metadata
    'fc:miniapp': JSON.stringify({
      version: "1",
      imageUrl: "https://writecast-1.vercel.app/icon-512.png",
      button: {
        title: "Play Now",
        action: {
          type: "launch_miniapp",
          name: "Writecast",
          url: "https://writecast-1.vercel.app",
          splashImageUrl: "https://writecast-1.vercel.app/icon-512.png",
          splashBackgroundColor: "#0a1628"
        }
      }
    })
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="font-mono antialiased" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Script id="fc-ready-inline" strategy="afterInteractive">
          {`(function(){
  try {
    var called = false;
    var isInIframe = typeof window !== 'undefined' && window.self !== window.top;
    var maxWaitMs = isInIframe ? 15000 : 10000;
    var intervalMs = isInIframe ? 50 : 100;
    var attempts = 0;
    var maxAttempts = isInIframe ? 200 : 100;

    console.log('InlineReady: Starting, iframe=' + isInIframe);

    function tryReady(){
      if (called || attempts >= maxAttempts) {
        return;
      }
      attempts++;

      try {
        // Method 1: window.sdk (most common)
        var w = window;
        var s = w.sdk;
        if (s && s.actions && typeof s.actions.ready === 'function'){
          called = true;
          console.log('InlineReady: Found window.sdk, calling ready()');
          Promise.resolve(s.actions.ready()).then(function(){
            console.log('InlineReady: ready() completed via window.sdk');
          }).catch(function(e){
            console.warn('InlineReady: ready() failed via window.sdk', e);
            called = false; // Allow retry
          });
          return;
        }

        // Method 2: Check for bridge in iframe context
        if (isInIframe) {
          var hasBridge = typeof w.MiniApp !== 'undefined' || typeof w.farcaster !== 'undefined';
          if (hasBridge) {
            // Try to find SDK in various locations
            // Sometimes SDK might be on a different object
            var possibleSDKs = [
              w.sdk,
              w.farcaster && w.farcaster.sdk,
              w.MiniApp && w.MiniApp.sdk,
              w.__FARCASTER_SDK__,
              w.FarcasterSDK
            ];

            for (var i = 0; i < possibleSDKs.length; i++) {
              var sdk = possibleSDKs[i];
              if (sdk && sdk.actions && typeof sdk.actions.ready === 'function') {
                called = true;
                console.log('InlineReady: Found SDK via bridge detection, calling ready()');
                Promise.resolve(sdk.actions.ready()).then(function(){
                  console.log('InlineReady: ready() completed via bridge');
                }).catch(function(e){
                  console.warn('InlineReady: ready() failed via bridge', e);
                  called = false;
                });
                return;
              }
            }

            // In iframe with bridge, even if we can't find SDK yet,
            // log that we detected the environment
            if (attempts === 1) {
              console.log('InlineReady: Iframe detected with bridge, SDK may load soon');
            }
          }
        }
      } catch (e) {
        console.warn('InlineReady: error in tryReady', e);
      }
    }

    // Immediate attempt
    tryReady();

    var intervalId = setInterval(function(){
      tryReady();
      if (called || attempts >= maxAttempts) {
        clearInterval(intervalId);
        if (!called) {
          console.warn('InlineReady: timeout after ' + attempts + ' attempts');
        }
      }
    }, intervalMs);

    var timeoutId = setTimeout(function(){
      clearInterval(intervalId);
      if (!called) {
        console.warn('InlineReady: Final timeout after ' + maxWaitMs + 'ms');
      }
    }, maxWaitMs);

  } catch (e) {
    console.warn('InlineReady: setup failed', e);
  }
})();`}
        </Script>
        <ReadySignal />
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
        <Analytics />
      </body>
    </html>
  )
}

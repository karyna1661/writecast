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
        var w = window;
        
        // CRITICAL: In iframe, try calling ready() DIRECTLY without type checks
        if (isInIframe) {
          // Method 1: Try window.sdk directly (don't check type first)
          if (w.sdk && w.sdk.actions) {
            try {
              called = true;
              console.log('InlineReady: Calling ready() via window.sdk (no type check, iframe)');
              Promise.resolve(w.sdk.actions.ready()).then(function(){
                console.log('InlineReady: ready() completed via window.sdk');
              }).catch(function(e){
                console.warn('InlineReady: ready() failed, will retry', e);
                called = false; // Allow retry
              });
              return;
            } catch (e) {
              console.warn('InlineReady: error calling ready()', e);
              called = false;
            }
          }

          // Method 2: Try all possible SDK locations without type checks
          var possibleSDKs = [
            w.sdk,
            w.farcaster && w.farcaster.sdk,
            w.MiniApp && w.MiniApp.sdk,
            w.__FARCASTER_SDK__,
            w.FarcasterSDK
          ];

          for (var i = 0; i < possibleSDKs.length; i++) {
            var sdk = possibleSDKs[i];
            if (sdk && sdk.actions) {
              try {
                called = true;
                console.log('InlineReady: Calling ready() via SDK location ' + i + ' (no type check)');
                Promise.resolve(sdk.actions.ready()).then(function(){
                  console.log('InlineReady: ready() completed');
                }).catch(function(e){
                  console.warn('InlineReady: ready() failed via location ' + i, e);
                  called = false;
                });
                return;
              } catch (e) {
                console.warn('InlineReady: error calling ready() via location ' + i, e);
                called = false;
              }
            }
          }
        } else {
          // Standalone mode: still try without type checks, but be more conservative
          if (w.sdk && w.sdk.actions) {
            try {
              called = true;
              console.log('InlineReady: Calling ready() via window.sdk (standalone)');
              Promise.resolve(w.sdk.actions.ready()).then(function(){
                console.log('InlineReady: ready() completed via window.sdk');
              }).catch(function(e){
                console.warn('InlineReady: ready() failed', e);
                called = false;
              });
              return;
            } catch (e) {
              console.warn('InlineReady: error calling ready()', e);
              called = false;
            }
          }
        }
      } catch (e) {
        console.warn('InlineReady: error in tryReady', e);
      }
    }

    // In iframe, try calling ready() IMMEDIATELY if SDK is available
    if (isInIframe && window.sdk && window.sdk.actions) {
      try {
        called = true;
        console.log('InlineReady: Immediate ready() call in iframe');
        Promise.resolve(window.sdk.actions.ready()).then(function(){
          console.log('InlineReady: ready() completed immediately!');
        }).catch(function(e){
          console.warn('InlineReady: Immediate ready() failed, will retry', e);
          called = false;
        });
      } catch (e) {
        console.warn('InlineReady: Immediate ready() call error', e);
        called = false;
      }
    }

    // Also try the normal path
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

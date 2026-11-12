// Root HTML compatible with Expo Router in Expo SDK 55.
// The server document context hook is not available in this SDK.
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#102C27" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="STACKORA" />
        <meta name="description" content="STACKORA : tournois de poker privés entre amis, sans argent réel." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <ScrollViewStyleReset />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: `if ('serviceWorker' in navigator && location.protocol === 'https:') { addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(console.warn); }); }` }} />
      </body>
    </html>
  );
}

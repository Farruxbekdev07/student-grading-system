// lib/emotionCache.ts
// -------------------------------------------------
// Decision: Creating Emotion cache with a custom key
// and inserting it before other styles prevents MUI
// styles from conflicting with Tailwind on the server.
// This is the official MUI + Next.js SSR pattern.
// -------------------------------------------------

import createCache from "@emotion/cache";

export function createEmotionCache() {
  return createCache({
    key: "mui",
    // Insert MUI styles before all other <head> styles,
    // so Tailwind utility classes can override them when needed.
    prepend: true,
  });
}

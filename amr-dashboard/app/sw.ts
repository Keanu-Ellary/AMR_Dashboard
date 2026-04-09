import { defaultCache } from "@serwist/next/worker";
import { type PrecacheEntry, Serwist } from "serwist";
import { CacheFirst, ExpirationPlugin } from "serwist";

declare global {
  interface WorkerGlobalScope {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: WorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.hostname.includes("tile.openstreetmap.org"),
      handler: new CacheFirst({
        cacheName: "osm-tiles",
        plugins: [
          new ExpirationPlugin({
            maxEntries: 500, // Limit to 500 tiles
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      }),
    },
    // 2. Default Next.js routing and caching rules
    ...defaultCache,
  ],
});

serwist.addEventListeners();

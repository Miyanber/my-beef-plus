import type { PlasmoCSConfig } from "plasmo"
import { useEffect } from "react"
import { waitForSelector } from "~lib/utils"

export const config: PlasmoCSConfig = {
  matches: [
    "https://beefplus.center.kobe-u.ac.jp/lms/*",
    "https://beefplus.center.kobe-u.ac.jp/portal/*"
  ],
  run_at: "document_start"
}

const PlasmoOverlay = () => {
  useEffect(() => {
    (async () => {
      await waitForSelector("body");

      // レスポンシブ用 viewport の強制注入
      await waitForSelector('meta[name="viewport"]').catch(() => null);
      let viewport = document.querySelector('meta[name="viewport"]');

      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      } else {
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        document.head.appendChild(viewport);
      }
    })();
  }, []);

  return <></>
}

export default PlasmoOverlay

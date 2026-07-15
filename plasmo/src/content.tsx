import cssText from "data-text:~style.css"
import type { PlasmoCSConfig } from "plasmo"
import { useEffect } from "react"
import { waitForSelector } from "~lib/utils"

import "~style.css"

export const config: PlasmoCSConfig = {
  matches: ["https://beefplus.center.kobe-u.ac.jp/lms/*"],
  run_at: "document_start"
}

/**
 * Generates a style element with adjusted CSS to work correctly within a Shadow DOM.
 *
 * Tailwind CSS relies on `rem` units, which are based on the root font size (typically defined on the <html>
 * or <body> element). However, in a Shadow DOM (as used by Plasmo), there is no native root element, so the
 * rem values would reference the actual page's root font size—often leading to sizing inconsistencies.
 *
 * To address this, we:
 * 1. Replace the `:root` selector with `:host(plasmo-csui)` to properly scope the styles within the Shadow DOM.
 * 2. Convert all `rem` units to pixel values using a fixed base font size, ensuring consistent styling
 *    regardless of the host page's font size.
 */
export const getStyle = (): HTMLStyleElement => {
  const baseFontSize = 16

  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  const remRegex = /([\d.]+)rem/g
  updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
    const pixelsValue = parseFloat(remValue) * baseFontSize

    return `${pixelsValue}px`
  })

  const styleElement = document.createElement("style")

  styleElement.textContent = updatedCssText

  return styleElement
}

const PlasmoOverlay = () => {
  // ここで主な JavaScript 処理を入れる
  useEffect(() => {
    (async () => {
      await waitForSelector("body");
      document.body.classList.add("antialiased", "my-beef-plus");

      return
      document.body.style.setProperty("overflow-x", "hidden", "important");


      await waitForSelector('meta[name="viewport"]');
      let viewport = document.querySelector('meta[name="viewport"]');

      if (viewport) {
        // 既存のタグがあれば、initial-scale=1.0 を強制注入する
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      } else {
        // 万が一タグがなければ新しく生成して head に突っ込む
        viewport = document.createElement('meta');
        viewport.setAttribute('name', 'viewport');
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        document.head.appendChild(viewport);
      }
    })();
  });

  return <></>
}

export default PlasmoOverlay

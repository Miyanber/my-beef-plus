import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 指定したセレクターの要素がDOMに出現するまで待機する関数
 */
export function waitForSelector(selector: string, timeout = 10000): Promise<Element> {
  return new Promise((resolve, reject) => {
    // 既に存在していれば即レス
    const existingElement = document.querySelector(selector)
    if (existingElement) return resolve(existingElement)

    const observer = new MutationObserver((_, obs) => {
      const element = document.querySelector(selector)
      if (element) {
        obs.disconnect()
        clearTimeout(timer)
        resolve(element)
      }
    })

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    })

    // タイムアウト処理（一応入れておくと安全）
    const timer = setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Timeout: Element "${selector}" not found after ${timeout}ms`))
    }, timeout)
  })
}
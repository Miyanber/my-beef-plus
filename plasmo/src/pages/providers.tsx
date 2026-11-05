'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect, useRef, type ReactNode } from 'react';

const ThemeBridge = ({ children }: { children: React.ReactNode }) => {
  const { theme, resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const activeTheme = resolvedTheme || theme
    const container = containerRef.current
    const isDark = activeTheme === "dark"

    if (container) {
      if (isDark) {
        container.classList.add("dark")
        container.style.colorScheme = "dark" // スクロールバーなどもダーク対応させる
      } else {
        container.classList.remove("dark")
        container.style.colorScheme = "light"
      }
    }

    // <html> タグとも完全に同期させてネイティブ側との一貫性を維持
    if (typeof document !== "undefined") {
      if (isDark) {
        document.documentElement.classList.add("dark")
        document.documentElement.style.colorScheme = "dark"
      } else {
        document.documentElement.classList.remove("dark")
        document.documentElement.style.colorScheme = "light"
      }
    }
  }, [theme, resolvedTheme])

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex bg-background text-foreground font-sans antialiased"
    >
      {children}
    </div>
  )
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    /* attribute="class" を指定することで、htmlタグに 'dark' クラスが付与されます */
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemeBridge>
        {children}
      </ThemeBridge>
    </NextThemesProvider>
  );
}

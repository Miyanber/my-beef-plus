'use client';

import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { useEffect, useRef, type ReactNode } from 'react';

const ThemeBridge = ({ children }: { children: React.ReactNode }) => {
  const { theme, resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const activeTheme = resolvedTheme || theme
    const container = containerRef.current

    if (container) {
      if (activeTheme === "dark") {
        container.classList.add("dark")
        container.style.colorScheme = "dark" // スクロールバーなどもダーク対応させる
      } else {
        container.classList.remove("dark")
        container.style.colorScheme = "light"
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
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppSidebar } from '@/components/timetable/app-sidebar'
import { TopHeader } from '@/components/timetable/top-header'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: '時間割 | 神戸大学 LMS BEEF+',
  description: '神戸大学 LMS BEEF+ の時間割ページ',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja" className={`${inter.variable} bg-background`}>
      <body className="font-sans antialiased">

        <div className="flex min-h-screen bg-background">
          <AppSidebar />

          <div className="flex min-w-0 flex-1 flex-col">
            <TopHeader />
            {children}
            <footer className="border-t border-border bg-card/50 px-6 py-6 lg:px-10">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
                  B
                </div>
                <span className="text-sm font-semibold text-foreground">
                  BEEF<span className="text-primary">+</span>
                </span>
                <span className="text-xs text-muted-foreground">神戸大学 LMS</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Copyright © ISTC, KOBE UNIV. All Rights Reserved.
              </p>
            </div>
          </footer>
          </div>
        </div>
      </body>
    </html>
  )
}

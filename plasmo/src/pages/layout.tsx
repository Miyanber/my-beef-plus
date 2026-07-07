import { AppSidebar } from '@/components/timetable/app-sidebar'
import { TopHeader } from '@/components/timetable/top-header'
import { ThemeProvider } from './providers'


interface LayoutProps {
  children: React.ReactNode
}

export function DefaultLayout({ children }: LayoutProps) {
  return (
		<ThemeProvider>
			<div className="flex w-full min-h-screen bg-background">
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
		</ThemeProvider>
  )
}

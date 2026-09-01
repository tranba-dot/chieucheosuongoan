import { Analytics } from '@vercel/analytics/next'
import { Be_Vietnam_Pro } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
})

export const metadata: Metadata = {
  title: 'Chiếu Chèo Sương Oan | Di sản Việt Nam',
  description: 'Không gian số khám phá nghệ thuật truyền thống Việt Nam và đồng hành cùng board game Chiếu Chèo Sương Oan.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#f4eee3',
  userScalable: true,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi" className={`${beVietnamPro.variable} bg-background`}><body className="antialiased">{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html>
}

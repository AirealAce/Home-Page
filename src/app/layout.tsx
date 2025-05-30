import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
import Script from 'next/script'

config.autoAddCss = false

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Aaron Mills | Developer & Creator',
  description: 'Personal portfolio and blog of Aaron Mills',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link 
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/css/bootstrap.min.css" 
          rel="stylesheet"
        />
        <link href="/css/styles.css" rel="stylesheet" />
        <link href="/css/mystyles.css" rel="stylesheet" />
      </head>
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
        <Script 
          src="https://kit.fontawesome.com/3c09bcb51a.js" 
          crossOrigin="anonymous"
        />
        <Script 
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.0/dist/js/bootstrap.bundle.min.js"
        />
        <Script src="/js/scripts.js" />
      </body>
    </html>
  )
} 
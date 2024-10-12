import type { Metadata } from 'next'
import { IBM_Plex_Mono } from 'next/font/google'

import './globals.css'

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-imb-plex-mono',
})

const title = 'Aaron Ford | Front-End Developer'
const description =
  "Howdy! I'm Aaron, a front-end developer and all-around web enthusiast living in the Pacific Northwest."
const url = 'https://ford.ooo'
const siteName = 'ford.ooo'

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title,
  description,
  openGraph: {
    title,
    description,
    url,
    siteName,
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={ibmPlexMono.variable}>{children}</body>
    </html>
  )
}

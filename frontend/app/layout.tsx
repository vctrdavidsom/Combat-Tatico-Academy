import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { CombatProvider } from '@/contexts/CombatContext'

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-mono'
})

export const metadata: Metadata = {
  title: 'Combat Tático Academy',
  description: 'Plataforma de treinamento tático e segurança profissional',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/logo.png',
        type: 'image/png',
      },
    ],
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${jetbrainsMono.variable} font-mono antialiased`}>
        <CombatProvider>{children}</CombatProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

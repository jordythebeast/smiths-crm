import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import TopBar from '@/components/TopBar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "Smith's Motorcycles CRM",
  description: "Workshop management for Smith's Motorcycle Shop",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-w-0 pb-20 md:pb-0 flex flex-col">
            <TopBar />
            {children}
          </main>
        </div>
        <MobileNav />
      </body>
    </html>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wrench, Users, Bike } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/jobs', label: 'Workshop', icon: Wrench },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/motorcycles', label: 'Motorcycles', icon: Bike },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 bg-black min-h-screen shrink-0">
      <Link href="/" className="px-5 py-6 border-b border-gray-800 block hover:opacity-80 transition-opacity">
        <div className="text-red-600 font-black text-xl tracking-tight">SMITH'S</div>
        <div className="text-gray-400 text-xs font-medium tracking-widest uppercase mt-0.5">Motorcycles CRM</div>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

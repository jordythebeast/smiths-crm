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

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="flex items-center">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                active ? 'text-red-500' : 'text-gray-500'
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

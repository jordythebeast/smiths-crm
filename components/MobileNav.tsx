'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { LayoutDashboard, Wrench, Users, Bike, Receipt } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/jobs', label: 'Workshop', icon: Wrench, exact: false },
  { href: '/customers', label: 'Customers', icon: Users, exact: false },
  { href: '/motorcycles', label: 'Motorcycles', icon: Bike, exact: false },
  { href: '/jobs?type=accounting', label: 'Accounting', icon: Receipt, exact: false, accountingOnly: true },
]

export default function MobileNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isAccounting = pathname === '/jobs' && searchParams.get('type') === 'accounting'

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="flex items-center">
        {nav.map(({ href, label, icon: Icon, exact, accountingOnly }) => {
          let active: boolean
          if (accountingOnly) {
            active = isAccounting
          } else if (exact) {
            active = pathname === '/'
          } else {
            active = pathname.startsWith(href.split('?')[0]) && !isAccounting
          }
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

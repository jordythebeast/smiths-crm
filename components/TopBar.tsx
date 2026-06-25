'use client'

import Link from 'next/link'
import { ClipboardList, UserPlus, Bike } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

export default function TopBar() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex items-center justify-between">
      <div className="md:hidden">
        <div className="text-red-600 font-black text-lg tracking-tight leading-none">SMITH'S</div>
        <div className="text-gray-400 text-[10px] font-medium tracking-widest uppercase">Motorcycles CRM</div>
      </div>
      <div className="hidden md:block" />

      <div className="flex items-center gap-2">
        <NotificationBell />
        <Link
          href="/jobs/new"
          className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
        >
          <ClipboardList size={13} />
          <span>Check In Bike</span>
        </Link>
        <Link
          href="/customers/new"
          className="hidden sm:flex items-center gap-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-black text-xs font-medium px-3 py-2 rounded-lg transition-colors bg-white"
        >
          <UserPlus size={13} />
          Add Customer
        </Link>
        <Link
          href="/motorcycles/new"
          className="hidden sm:flex items-center gap-1.5 border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-black text-xs font-medium px-3 py-2 rounded-lg transition-colors bg-white"
        >
          <Bike size={13} />
          Add Bike
        </Link>
      </div>
    </header>
  )
}

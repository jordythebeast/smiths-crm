'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, BellRing, X } from 'lucide-react'
import { subscribeToPush, unsubscribeFromPush } from '@/app/actions/notifications'
import { getDueTasks, type DueTask } from '@/app/actions/tasks'

function dueDateLabel(dateStr: string): { text: string; className: string } {
  const today = new Date().toISOString().split('T')[0]
  if (dateStr < today) return { text: 'Overdue', className: 'text-red-600 font-semibold' }
  return { text: 'Due today', className: 'text-amber-600 font-semibold' }
}

export default function NotificationBell() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [subLoading, setSubLoading] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [tasks, setTasks] = useState<DueTask[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
      })
    }
    getDueTasks().then(setTasks)
  }, [])

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false)
      }
    }
    if (showPanel) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showPanel])

  async function togglePanel() {
    const next = !showPanel
    setShowPanel(next)
    if (next) {
      const fresh = await getDueTasks()
      setTasks(fresh)
    }
  }

  async function enablePush() {
    setSubLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      await subscribeToPush(json, 'Team device')
      setSubscribed(true)
    } finally {
      setSubLoading(false)
    }
  }

  async function disablePush() {
    setSubLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await unsubscribeFromPush(sub.endpoint)
      }
      setSubscribed(false)
    } finally {
      setSubLoading(false)
    }
  }

  const overdueCount = tasks.filter((t) => t.due_date < new Date().toISOString().split('T')[0]).length
  const todayCount = tasks.length - overdueCount
  const badgeCount = tasks.length

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={togglePanel}
        title={`${badgeCount} task${badgeCount !== 1 ? 's' : ''} due`}
        className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
          badgeCount > 0
            ? 'text-red-600 hover:bg-red-50'
            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        {badgeCount > 0 ? <BellRing size={16} /> : <Bell size={16} />}
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-80">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div>
              <p className="font-semibold text-sm">Due Today</p>
              {tasks.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {overdueCount > 0 && `${overdueCount} overdue`}
                  {overdueCount > 0 && todayCount > 0 && ' · '}
                  {todayCount > 0 && `${todayCount} due today`}
                </p>
              )}
            </div>
            <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-black transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Task list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {tasks.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">All clear — nothing due today</p>
              </div>
            ) : (
              tasks.map((task) => {
                const label = dueDateLabel(task.due_date)
                const bike = task.job?.bike
                const bikeDesc = bike
                  ? `${bike.year ? bike.year + ' ' : ''}${bike.make} ${bike.model}`
                  : null
                return (
                  <a
                    key={task.id}
                    href={task.job ? `/jobs/${task.job.id}` : '/jobs'}
                    onClick={() => setShowPanel(false)}
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 leading-snug flex-1">{task.title}</p>
                      <span className={`text-xs shrink-0 ${label.className}`}>{label.text}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {task.job?.customer?.name && `${task.job.customer.name} · `}
                      {bikeDesc && bikeDesc}
                      {task.job?.job_number && (
                        <span className="ml-1 font-mono">#{task.job.job_number}</span>
                      )}
                    </p>
                  </a>
                )
              })
            )}
          </div>

          {/* Footer — push subscription toggle */}
          {supported && (
            <div className="px-4 py-3 border-t border-gray-100 rounded-b-xl bg-gray-50">
              {subscribed ? (
                <button
                  onClick={disablePush}
                  disabled={subLoading}
                  className="text-xs text-gray-400 hover:text-red-600 transition-colors"
                >
                  {subLoading ? 'Turning off…' : 'Push notifications on · tap to disable'}
                </button>
              ) : (
                <button
                  onClick={enablePush}
                  disabled={subLoading}
                  className="text-xs text-red-600 font-medium hover:text-red-700 transition-colors"
                >
                  {subLoading ? 'Enabling…' : 'Enable push notifications for this device'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

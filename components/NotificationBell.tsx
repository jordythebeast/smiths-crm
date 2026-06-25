'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, BellRing, X } from 'lucide-react'
import {
  subscribeToPush,
  unsubscribeFromPush,
  getNotifications,
  markAllNotificationsRead,
  type NotificationRow,
} from '@/app/actions/notifications'

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

export default function NotificationBell() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPanel, setShowPanel] = useState(false)
  const [showNamePrompt, setShowNamePrompt] = useState(false)
  const [name, setName] = useState('')
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.pushManager.getSubscription().then((sub) => setSubscribed(!!sub))
      })
    }
    loadNotifications()
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

  async function loadNotifications() {
    const data = await getNotifications()
    setNotifications(data)
    setUnreadCount(data.filter((n) => !n.read).length)
  }

  async function openPanel() {
    setShowPanel((prev) => !prev)
    if (!showPanel && unreadCount > 0) {
      await markAllNotificationsRead()
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    }
  }

  async function enable() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setLoading(false); return }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      await subscribeToPush(json, name || 'Team device')
      setSubscribed(true)
      setShowNamePrompt(false)
    } finally {
      setLoading(false)
    }
  }

  async function disable() {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await unsubscribeFromPush(sub.endpoint)
      }
      setSubscribed(false)
    } finally {
      setLoading(false)
    }
  }

  if (!supported) return null

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={openPanel}
        title="Notifications"
        className={`relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
          subscribed
            ? 'text-red-600 hover:bg-red-50'
            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        {subscribed ? <BellRing size={16} /> : <Bell size={16} />}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showPanel && (
        <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-xl shadow-xl w-80">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-sm">Notifications</p>
            <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-black transition-colors">
              <X size={14} />
            </button>
          </div>

          {/* Notification list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">
                  You&apos;ll get buzzed when a bike is ready for collection
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <a
                  key={n.id}
                  href={n.url || '/jobs'}
                  onClick={() => setShowPanel(false)}
                  className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900 leading-snug">{n.title}</p>
                  {n.body && (
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                  )}
                  <p className="text-xs text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                </a>
              ))
            )}
          </div>

          {/* Footer — subscribe / unsubscribe */}
          <div className="px-4 py-3 border-t border-gray-100 rounded-b-xl bg-gray-50">
            {subscribed ? (
              <button
                onClick={disable}
                disabled={loading}
                className="text-xs text-gray-400 hover:text-red-600 transition-colors w-full text-left"
              >
                {loading ? 'Turning off…' : 'Turn off notifications for this device'}
              </button>
            ) : showNamePrompt ? (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">Your name (e.g. Norman or David)</p>
                <input
                  className="input text-sm py-1.5"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && enable()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowNamePrompt(false)}
                    className="btn-ghost flex-1 py-1.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={enable}
                    disabled={loading}
                    className="btn-primary flex-1 py-1.5 text-xs"
                  >
                    {loading ? 'Enabling…' : 'Enable'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNamePrompt(true)}
                className="text-xs text-red-600 font-medium hover:text-red-700 transition-colors"
              >
                Enable notifications for this device
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

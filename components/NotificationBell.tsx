'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { subscribeToPush, unsubscribeFromPush } from '@/app/actions/notifications'

export default function NotificationBell() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [name, setName] = useState('')

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub)
        })
      })
    }
  }, [])

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
      setShowPrompt(false)
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
    <div className="relative">
      <button
        onClick={() => subscribed ? disable() : setShowPrompt(true)}
        disabled={loading}
        title={subscribed ? 'Notifications on — tap to turn off' : 'Enable notifications'}
        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
          subscribed
            ? 'text-red-600 hover:bg-red-50'
            : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
        }`}
      >
        {loading ? (
          <BellOff size={16} className="animate-pulse" />
        ) : subscribed ? (
          <BellRing size={16} />
        ) : (
          <Bell size={16} />
        )}
      </button>

      {showPrompt && !subscribed && (
        <div className="absolute right-0 top-10 z-50 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-64">
          <p className="text-sm font-semibold text-black mb-1">Enable notifications</p>
          <p className="text-xs text-gray-500 mb-3">
            You&apos;ll buzz when a bike is ready for collection.
          </p>
          <input
            className="input text-sm py-2 mb-2"
            placeholder="Your name (e.g. Norman)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowPrompt(false)} className="btn-ghost flex-1 py-2 text-sm">
              Cancel
            </button>
            <button onClick={enable} className="btn-primary flex-1 py-2 text-sm">
              Enable
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

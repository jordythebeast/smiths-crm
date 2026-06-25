'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

function getWebPush() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const webpush = require('web-push')
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )
  return webpush
}

export async function subscribeToPush(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  label: string
) {
  const supabase = await createClient()
  await supabase.from('push_subscriptions').upsert(
    {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      label: label || 'Team device',
    },
    { onConflict: 'endpoint' }
  )
}

export async function unsubscribeFromPush(endpoint: string) {
  const supabase = await createClient()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}

export async function sendPushToAll(payload: { title: string; body: string; url?: string }) {
  const supabase = await createClient()

  // Save to notification history
  try {
    await supabase.from('notifications').insert({
      title: payload.title,
      body: payload.body,
      url: payload.url || null,
    })
  } catch { /* ignore if table doesn't exist yet */ }

  const { data: subs } = await supabase.from('push_subscriptions').select('*')
  if (!subs?.length) return

  const webpush = getWebPush()

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      } catch (err: unknown) {
        if ((err as { statusCode?: number }).statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    })
  )
}

export type NotificationRow = {
  id: string
  title: string
  body: string | null
  url: string | null
  read: boolean
  created_at: string
}

export async function getNotifications(): Promise<NotificationRow[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(30)
  return (data as NotificationRow[]) || []
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  await supabase.from('notifications').update({ read: true }).eq('read', false)
  revalidatePath('/')
}

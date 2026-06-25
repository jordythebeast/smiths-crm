'use server'

import { createClient } from '@/lib/supabase/server'

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

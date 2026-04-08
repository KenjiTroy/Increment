import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

export default async function handler(req, res) {
  try {
    const { data: rows, error } = await supabase
      .from('push_subscriptions')
      .select('user_id, subscription, timezone')

    if (error) throw error

    const results = await Promise.allSettled(
      (rows || []).map((row) =>
        webpush.sendNotification(
          row.subscription,
          JSON.stringify({
            title: 'Increment',
            body: 'It is 8:00 AM. Time to do your tasks.',
          })
        )
      )
    )

    res.status(200).json({
      ok: true,
      sent: results.filter((r) => r.status === 'fulfilled').length,
      failed: results.filter((r) => r.status === 'rejected').length,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      ok: false,
      error: err.message,
    })
  }
}
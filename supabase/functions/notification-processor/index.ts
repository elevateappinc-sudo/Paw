// PAW · notification-processor Edge Function
// F-PUSH-NOTIFICATIONS · Sprint 2
// Runs every 5 minutes via Deno.cron

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@paw.app";

const RATE_LIMIT_PER_HOUR = 10;
const MAX_ATTEMPTS = 3;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface NotificationRow {
  id: string;
  user_id: string;
  subscription_id: string | null;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  scheduled_for: string;
  status: string;
  attempts: number;
}

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  active: boolean;
}

async function checkRateLimit(userId: string): Promise<boolean> {
  const hourBucket = new Date();
  hourBucket.setMinutes(0, 0, 0);

  const { data, error } = await supabase
    .from("notification_rate_tracker")
    .select("count")
    .eq("user_id", userId)
    .eq("hour_bucket", hourBucket.toISOString())
    .maybeSingle();

  if (error) {
    console.error("[rate-limit] Error checking rate:", error);
    return false;
  }

  return (data?.count ?? 0) < RATE_LIMIT_PER_HOUR;
}

async function incrementRateCounter(userId: string): Promise<void> {
  const hourBucket = new Date();
  hourBucket.setMinutes(0, 0, 0);

  await supabase.rpc("increment_rate_tracker", {
    p_user_id: userId,
    p_hour_bucket: hourBucket.toISOString(),
  }).catch(async () => {
    // Fallback: upsert manually
    const { data: existing } = await supabase
      .from("notification_rate_tracker")
      .select("count")
      .eq("user_id", userId)
      .eq("hour_bucket", hourBucket.toISOString())
      .maybeSingle();

    const newCount = (existing?.count ?? 0) + 1;
    await supabase.from("notification_rate_tracker").upsert(
      { user_id: userId, hour_bucket: hourBucket.toISOString(), count: newCount },
      { onConflict: "user_id,hour_bucket" }
    );
  });
}

async function sendWebPush(
  subscription: SubscriptionRow,
  payload: { title: string; body?: string; url?: string; data?: Record<string, unknown> }
): Promise<boolean> {
  if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
    console.warn("[push] VAPID keys not configured — skipping actual push");
    return true; // Soft pass for dev environments
  }

  try {
    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? "/",
      ...payload.data,
    });

    // Build VAPID JWT header
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = btoa(JSON.stringify({ typ: "JWT", alg: "ES256" })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    const jwtPayload = btoa(JSON.stringify({
      aud: new URL(subscription.endpoint).origin,
      exp: now + 12 * 3600,
      sub: VAPID_SUBJECT,
    })).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "TTL": "86400",
        "Authorization": `vapid t=${jwtHeader}.${jwtPayload},k=${VAPID_PUBLIC_KEY}`,
      },
      body,
    });

    if (response.status === 410 || response.status === 404) {
      // Subscription gone — mark inactive
      await supabase
        .from("push_subscriptions")
        .update({ active: false })
        .eq("id", subscription.id);
      return false;
    }

    return response.ok;
  } catch (err) {
    console.error("[push] Send error:", err);
    return false;
  }
}

async function processQueue(): Promise<void> {
  const now = new Date().toISOString();

  // Fetch pending notifications due now
  const { data: notifications, error } = await supabase
    .from("notification_queue")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(100);

  if (error) {
    console.error("[processor] Failed to fetch queue:", error);
    return;
  }

  if (!notifications || notifications.length === 0) {
    console.log("[processor] No pending notifications");
    return;
  }

  console.log(`[processor] Processing ${notifications.length} notifications`);

  for (const notif of notifications as NotificationRow[]) {
    // Check rate limit
    const withinLimit = await checkRateLimit(notif.user_id);

    if (!withinLimit) {
      // Re-queue to next hour
      const nextHour = new Date();
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

      await supabase
        .from("notification_queue")
        .update({
          status: "queued_rate_limit",
          scheduled_for: nextHour.toISOString(),
        })
        .eq("id", notif.id);

      console.log(`[processor] Rate limited user ${notif.user_id} — requeued to ${nextHour.toISOString()}`);
      continue;
    }

    // Get subscription
    let subscription: SubscriptionRow | null = null;

    if (notif.subscription_id) {
      const { data } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth, active")
        .eq("id", notif.subscription_id)
        .eq("active", true)
        .maybeSingle();
      subscription = data;
    } else {
      // Use any active subscription for user
      const { data } = await supabase
        .from("push_subscriptions")
        .select("id, endpoint, p256dh, auth, active")
        .eq("user_id", notif.user_id)
        .eq("active", true)
        .limit(1)
        .maybeSingle();
      subscription = data;
    }

    if (!subscription) {
      // No active subscription — mark failed
      await supabase
        .from("notification_queue")
        .update({ status: "failed", attempts: notif.attempts + 1 })
        .eq("id", notif.id);
      continue;
    }

    const success = await sendWebPush(subscription, {
      title: notif.title,
      body: notif.body ?? undefined,
      data: notif.data ?? undefined,
    });

    if (success) {
      await supabase
        .from("notification_queue")
        .update({
          status: "sent",
          attempts: notif.attempts + 1,
        })
        .eq("id", notif.id);

      // Update last_used_at on subscription
      await supabase
        .from("push_subscriptions")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", subscription.id);

      await incrementRateCounter(notif.user_id);
    } else {
      const newAttempts = notif.attempts + 1;
      await supabase
        .from("notification_queue")
        .update({
          status: newAttempts >= MAX_ATTEMPTS ? "failed" : "pending",
          attempts: newAttempts,
          // Back-off: retry in 15 minutes
          scheduled_for: newAttempts < MAX_ATTEMPTS
            ? new Date(Date.now() + 15 * 60 * 1000).toISOString()
            : notif.scheduled_for,
        })
        .eq("id", notif.id);
    }
  }
}

// Deno.cron — runs every 5 minutes
Deno.cron("notification-processor", "*/5 * * * *", processQueue);

// Also allow direct HTTP invocation (for testing)
Deno.serve(async (req) => {
  if (req.method === "POST") {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${SUPABASE_SERVICE_KEY}`) {
      return new Response("Unauthorized", { status: 401 });
    }
    await processQueue();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response("Method Not Allowed", { status: 405 });
});

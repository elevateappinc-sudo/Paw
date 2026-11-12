// PAW · notification-processor Edge Function
// F-PUSH-NOTIFICATIONS · Sprint 2
// Runs every 5 minutes via Deno.cron

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@paw.app";
// FCM (push nativo Android/iOS). Secrets del proyecto Firebase de Paw.
const FCM_PROJECT_ID = Deno.env.get("FCM_PROJECT_ID");
const FCM_SERVICE_ACCOUNT_JSON = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");

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
  endpoint: string | null;
  p256dh: string | null;
  auth: string | null;
  fcm_token: string | null;
  platform: string | null;
  active: boolean;
}

const SUB_COLS = "id, endpoint, p256dh, auth, fcm_token, platform, active";

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

// --- FCM (push nativo) ---
// Cachea el access token OAuth del service account (vale ~1h) para no re-firmar en cada envío.
let fcmAccessToken: { token: string; exp: number } | null = null;

function b64url(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function getFcmAccessToken(): Promise<string | null> {
  if (!FCM_SERVICE_ACCOUNT_JSON) return null;
  const now = Math.floor(Date.now() / 1000);
  if (fcmAccessToken && fcmAccessToken.exp > now + 60) return fcmAccessToken.token;

  try {
    const sa = JSON.parse(FCM_SERVICE_ACCOUNT_JSON) as { client_email: string; private_key: string };
    const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
    const claim = b64url(new TextEncoder().encode(JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })));
    const unsigned = `${header}.${claim}`;

    // Importar la private key PEM (PKCS8) y firmar RS256.
    const pem = sa.private_key.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s+/g, "");
    const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("pkcs8", der.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned)));
    const jwt = `${unsigned}.${b64url(sig)}`;

    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });
    if (!res.ok) {
      console.error("[fcm] token OAuth falló:", res.status, await res.text());
      return null;
    }
    const body = await res.json() as { access_token: string; expires_in: number };
    fcmAccessToken = { token: body.access_token, exp: now + body.expires_in };
    return body.access_token;
  } catch (err) {
    console.error("[fcm] no se pudo obtener access token:", err);
    return null;
  }
}

async function sendFcm(
  subscription: SubscriptionRow,
  payload: { title: string; body?: string; url?: string; data?: Record<string, unknown> }
): Promise<boolean> {
  if (!FCM_PROJECT_ID || !subscription.fcm_token) {
    if (!FCM_PROJECT_ID) console.warn("[fcm] FCM_PROJECT_ID no configurado — skip");
    return !FCM_PROJECT_ID; // soft-pass si FCM no está configurado (dev)
  }
  const accessToken = await getFcmAccessToken();
  if (!accessToken) return false;

  // Todos los valores de data en FCM deben ser string.
  const data: Record<string, string> = { url: payload.url ?? "/" };
  for (const [k, v] of Object.entries(payload.data ?? {})) data[k] = typeof v === "string" ? v : JSON.stringify(v);

  const message = {
    message: {
      token: subscription.fcm_token,
      notification: { title: payload.title, body: payload.body ?? "" },
      data,
      android: { priority: "HIGH" },
      apns: { payload: { aps: { sound: "default" } } },
    },
  };

  try {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(message),
    });
    if (res.ok) return true;
    // Token inválido/no registrado → desactivar la suscripción.
    if (res.status === 404 || res.status === 400) {
      const txt = await res.text();
      if (/UNREGISTERED|NOT_FOUND|INVALID_ARGUMENT/i.test(txt)) {
        await supabase.from("push_subscriptions").update({ active: false }).eq("id", subscription.id);
      }
      console.error("[fcm] envío falló:", res.status, txt.slice(0, 200));
      return false;
    }
    console.error("[fcm] envío falló:", res.status, (await res.text()).slice(0, 200));
    return false;
  } catch (err) {
    console.error("[fcm] send error:", err);
    return false;
  }
}

// Enruta por tipo de suscripción: nativa (fcm_token) → FCM; web (endpoint) → Web Push/VAPID.
async function sendToSubscription(
  subscription: SubscriptionRow,
  payload: { title: string; body?: string; url?: string; data?: Record<string, unknown> }
): Promise<boolean> {
  if (subscription.fcm_token) return sendFcm(subscription, payload);
  if (subscription.endpoint) return sendWebPush(subscription, payload);
  return false;
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

    // Cargar las suscripciones activas: una concreta, o TODAS las del usuario
    // (web + nativas), para entregar por todos sus dispositivos.
    let subscriptions: SubscriptionRow[] = [];

    if (notif.subscription_id) {
      const { data } = await supabase
        .from("push_subscriptions")
        .select(SUB_COLS)
        .eq("id", notif.subscription_id)
        .eq("active", true)
        .maybeSingle();
      if (data) subscriptions = [data as SubscriptionRow];
    } else {
      const { data } = await supabase
        .from("push_subscriptions")
        .select(SUB_COLS)
        .eq("user_id", notif.user_id)
        .eq("active", true);
      subscriptions = (data ?? []) as SubscriptionRow[];
    }

    if (subscriptions.length === 0) {
      // No active subscription — mark failed
      await supabase
        .from("notification_queue")
        .update({ status: "failed", attempts: notif.attempts + 1 })
        .eq("id", notif.id);
      continue;
    }

    // Enviar a cada dispositivo por su canal (FCM nativo / Web Push). Éxito = al menos uno entregó.
    const results = await Promise.all(
      subscriptions.map((sub) =>
        sendToSubscription(sub, {
          title: notif.title,
          body: notif.body ?? undefined,
          data: notif.data ?? undefined,
        }).then((ok) => ({ sub, ok }))
      )
    );
    const success = results.some((r) => r.ok);

    if (success) {
      await supabase
        .from("notification_queue")
        .update({
          status: "sent",
          attempts: notif.attempts + 1,
        })
        .eq("id", notif.id);

      // Update last_used_at en las suscripciones que entregaron
      const deliveredIds = results.filter((r) => r.ok).map((r) => r.sub.id);
      if (deliveredIds.length > 0) {
        await supabase
          .from("push_subscriptions")
          .update({ last_used_at: new Date().toISOString() })
          .in("id", deliveredIds);
      }

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

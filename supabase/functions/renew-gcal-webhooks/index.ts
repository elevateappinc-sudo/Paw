// PAW · renew-gcal-webhooks Edge Function
// Sprint 3 · T006
// Scheduled every 6 days via pg_cron or Supabase scheduled functions.
// Google Calendar push notification channels expire after 7 days.
// This function renews them before expiry so we receive real-time push events.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { v4 as uuidv4 } from "https://esm.sh/uuid@9";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const GOOGLE_CALENDAR_ENCRYPTION_KEY = Deno.env.get("GOOGLE_CALENDAR_ENCRYPTION_KEY")!;
const NEXT_PUBLIC_URL = Deno.env.get("NEXT_PUBLIC_URL") ?? "https://app.paw.com";

// Webhook receives push notifications at this URL
const WEBHOOK_URL = `${NEXT_PUBLIC_URL}/api/gcal/webhook`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarIntegration {
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  gcal_calendar_id: string;
  sync_enabled: boolean;
  webhook_channel_id?: string;
  webhook_resource_id?: string;
  webhook_expires_at?: string;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

async function decryptToken(encryptedToken: string): Promise<string> {
  try {
    const { data, error } = await supabase.rpc("decrypt_calendar_token", {
      p_token: encryptedToken,
      p_key: GOOGLE_CALENDAR_ENCRYPTION_KEY,
    });
    if (error || !data) return encryptedToken;
    return data as string;
  } catch {
    return encryptedToken;
  }
}

async function getValidAccessToken(
  userId: string,
  integration: CalendarIntegration
): Promise<string> {
  const expiresAt = new Date(integration.token_expires_at);
  const bufferMs = 5 * 60 * 1000;

  const decryptedAccess = await decryptToken(integration.access_token);
  if (Date.now() + bufferMs < expiresAt.getTime()) {
    return decryptedAccess;
  }

  // Refresh
  const decryptedRefresh = await decryptToken(integration.refresh_token);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: decryptedRefresh,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    if (errText.includes("invalid_grant")) {
      await supabase
        .from("calendar_integrations")
        .update({ sync_enabled: false })
        .eq("user_id", userId);
      throw new Error(`Token revoked for user ${userId} — integration disabled`);
    }
    throw new Error(`Token refresh failed: ${errText}`);
  }

  const { access_token, expires_in } = await res.json();
  const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  await supabase
    .from("calendar_integrations")
    .update({ access_token, token_expires_at: newExpiresAt })
    .eq("user_id", userId);

  return access_token;
}

// ─── Stop existing channel ────────────────────────────────────────────────────

async function stopChannel(
  accessToken: string,
  channelId: string,
  resourceId: string
): Promise<void> {
  const res = await fetch("https://www.googleapis.com/calendar/v3/channels/stop", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: channelId, resourceId }),
  });
  // 404 means already expired — not an error
  if (!res.ok && res.status !== 404) {
    console.warn(`stopChannel failed (${res.status}):`, await res.text());
  }
}

// ─── Register new webhook channel ────────────────────────────────────────────

async function watchCalendar(
  accessToken: string,
  calendarId: string
): Promise<{ channelId: string; resourceId: string; expiration: string }> {
  const channelId = uuidv4();
  // 7 days in ms from now
  const expiration = String(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: channelId,
        type: "web_hook",
        address: WEBHOOK_URL,
        expiration,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`watchCalendar failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return {
    channelId: data.id,
    resourceId: data.resourceId,
    expiration: new Date(Number(data.expiration)).toISOString(),
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (_req: Request) => {
  try {
    // Renew webhooks that expire in < 48 hours or have no webhook registered
    const renewBefore = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const { data: integrations, error } = await supabase
      .from("calendar_integrations")
      .select(
        "user_id, access_token, refresh_token, token_expires_at, gcal_calendar_id, sync_enabled, webhook_channel_id, webhook_resource_id, webhook_expires_at"
      )
      .eq("sync_enabled", true)
      .or(`webhook_expires_at.is.null,webhook_expires_at.lt.${renewBefore}`);

    if (error) throw error;
    if (!integrations?.length) {
      return new Response("No webhooks to renew", { status: 200 });
    }

    const results: string[] = [];

    for (const integration of integrations) {
      try {
        const accessToken = await getValidAccessToken(integration.user_id, integration);

        // Stop old channel if exists
        if (integration.webhook_channel_id && integration.webhook_resource_id) {
          await stopChannel(
            accessToken,
            integration.webhook_channel_id,
            integration.webhook_resource_id
          );
        }

        // Register new channel
        const { channelId, resourceId, expiration } = await watchCalendar(
          accessToken,
          integration.gcal_calendar_id
        );

        // Save new webhook info
        await supabase
          .from("calendar_integrations")
          .update({
            webhook_channel_id: channelId,
            webhook_resource_id: resourceId,
            webhook_expires_at: expiration,
          })
          .eq("user_id", integration.user_id);

        results.push(`user=${integration.user_id}: webhook renewed until ${expiration}`);
      } catch (userErr) {
        const msg = userErr instanceof Error ? userErr.message : String(userErr);
        console.error(`renew-gcal-webhooks error for user ${integration.user_id}:`, msg);
        results.push(`user=${integration.user_id}: ERROR ${msg}`);
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("renew-gcal-webhooks fatal error:", err);
    return new Response(`Error: ${err instanceof Error ? err.message : String(err)}`, {
      status: 500,
    });
  }
});

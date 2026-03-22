// PAW · sync-from-gcal Edge Function
// Sprint 3 · T005
// Scheduled every 15 min via pg_cron or Supabase scheduled functions.
// Polls GCal for changes since last sync. PAW is source of truth — GCal changes
// are discarded if the PAW event was recently updated (within 60s of sync).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const GOOGLE_CALENDAR_ENCRYPTION_KEY = Deno.env.get("GOOGLE_CALENDAR_ENCRYPTION_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarIntegration {
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  gcal_calendar_id: string;
  sync_enabled: boolean;
  synced_event_types: string[];
  gcal_sync_token?: string;
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
    // Token revoked (invalid_grant) → disable integration
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

// ─── GCal polling ─────────────────────────────────────────────────────────────

async function listChangedEvents(
  accessToken: string,
  calendarId: string,
  syncToken?: string
): Promise<{ items: GCalEvent[]; nextSyncToken?: string }> {
  const params = new URLSearchParams({ singleEvents: "true" });
  if (syncToken) {
    params.set("syncToken", syncToken);
  } else {
    // Full sync: last 30 days
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    params.set("timeMin", timeMin);
  }

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  // 410 Gone = sync token invalid, need full resync
  if (res.status === 410) {
    return listChangedEvents(accessToken, calendarId, undefined);
  }

  if (!res.ok) {
    throw new Error(`GCal listEvents failed (${res.status}): ${await res.text()}`);
  }

  return res.json();
}

interface GCalEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

// ─── PAW is source of truth — process GCal changes ───────────────────────────

async function processGCalChanges(
  userId: string,
  items: GCalEvent[]
): Promise<void> {
  for (const gcalEvent of items) {
    if (!gcalEvent.id) continue;

    // Find mapping for this GCal event
    const { data: mapping } = await supabase
      .from("calendar_event_mappings")
      .select("paw_event_id, last_synced_at")
      .eq("user_id", userId)
      .eq("gcal_event_id", gcalEvent.id)
      .maybeSingle();

    if (!mapping) continue; // GCal event not managed by PAW — ignore

    // If event was cancelled/deleted in GCal — mark mapping but don't delete PAW event
    // PAW is source of truth
    if (gcalEvent.status === "cancelled") {
      await supabase
        .from("calendar_event_mappings")
        .update({ gcal_deleted: true, last_synced_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("gcal_event_id", gcalEvent.id);
      continue;
    }

    // Check if PAW event was recently modified (within 60s of last sync)
    // If so, PAW wins — skip this GCal change
    const { data: pawEvent } = await supabase
      .from("itinerary_events")
      .select("id, updated_at")
      .eq("id", mapping.paw_event_id)
      .maybeSingle();

    if (!pawEvent) continue;

    const pawUpdatedAt = new Date(pawEvent.updated_at).getTime();
    const lastSynced = new Date(mapping.last_synced_at).getTime();
    const recentlyModifiedByPAW = pawUpdatedAt > lastSynced;

    if (recentlyModifiedByPAW) {
      // PAW is source of truth — GCal change ignored
      continue;
    }

    // Update last_synced_at to acknowledge we saw this GCal change
    await supabase
      .from("calendar_event_mappings")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("gcal_event_id", gcalEvent.id);
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (_req: Request) => {
  try {
    // Fetch all active integrations
    const { data: integrations, error } = await supabase
      .from("calendar_integrations")
      .select(
        "user_id, access_token, refresh_token, token_expires_at, gcal_calendar_id, sync_enabled, synced_event_types, gcal_sync_token"
      )
      .eq("sync_enabled", true);

    if (error) throw error;
    if (!integrations?.length) {
      return new Response("No active integrations", { status: 200 });
    }

    const results: string[] = [];

    for (const integration of integrations) {
      try {
        const accessToken = await getValidAccessToken(integration.user_id, integration);

        const { items, nextSyncToken } = await listChangedEvents(
          accessToken,
          integration.gcal_calendar_id,
          integration.gcal_sync_token
        );

        await processGCalChanges(integration.user_id, items ?? []);

        // Store next sync token for incremental polling
        if (nextSyncToken) {
          await supabase
            .from("calendar_integrations")
            .update({ gcal_sync_token: nextSyncToken })
            .eq("user_id", integration.user_id);
        }

        results.push(`user=${integration.user_id}: synced ${items?.length ?? 0} changes`);
      } catch (userErr) {
        const msg = userErr instanceof Error ? userErr.message : String(userErr);
        console.error(`sync-from-gcal error for user ${integration.user_id}:`, msg);
        results.push(`user=${integration.user_id}: ERROR ${msg}`);
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sync-from-gcal fatal error:", err);
    return new Response(`Error: ${err instanceof Error ? err.message : String(err)}`, {
      status: 500,
    });
  }
});

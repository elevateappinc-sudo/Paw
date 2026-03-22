// PAW · Google Calendar Client
// Sprint 3 · T002

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_CALENDAR_ENCRYPTION_KEY = process.env.GOOGLE_CALENDAR_ENCRYPTION_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export interface GCalEvent {
  summary: string;
  description?: string;
  start: { dateTime: string; timeZone?: string };
  end: { dateTime: string; timeZone?: string };
  id?: string;
}

export interface CalendarIntegrationRow {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  token_expires_at: string;
  gcal_calendar_id: string;
  sync_enabled: boolean;
  synced_event_types: string[];
}

// ─── Token Management ────────────────────────────────────────────────────────

async function decryptToken(encryptedToken: string): Promise<string> {
  const res = await fetch(`${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/decrypt_calendar_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_token: encryptedToken, p_key: GOOGLE_CALENDAR_ENCRYPTION_KEY }),
  });
  if (!res.ok) {
    // Token may be unencrypted in dev/fallback mode
    return encryptedToken;
  }
  const data = await res.json();
  return data ?? encryptedToken;
}

async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token refresh failed: ${err}`);
  }

  return res.json();
}

/**
 * Get a valid (non-expired) access token for the given integration.
 * Auto-refreshes if expired or about to expire (< 5 min remaining).
 */
export async function getAccessToken(
  integration: CalendarIntegrationRow,
  updateTokenCallback?: (newAccessToken: string, expiresAt: string) => Promise<void>
): Promise<string> {
  const expiresAt = new Date(integration.token_expires_at);
  const bufferMs = 5 * 60 * 1000; // 5 minutes buffer

  const decryptedAccess = await decryptToken(integration.access_token);

  if (Date.now() + bufferMs < expiresAt.getTime()) {
    // Token still valid
    return decryptedAccess;
  }

  // Token expired or about to expire — refresh it
  const decryptedRefresh = await decryptToken(integration.refresh_token);
  const { access_token, expires_in } = await refreshAccessToken(decryptedRefresh);
  const newExpiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  if (updateTokenCallback) {
    await updateTokenCallback(access_token, newExpiresAt);
  }

  return access_token;
}

// ─── Calendar API Helpers ─────────────────────────────────────────────────────

async function gcalFetch(
  method: string,
  url: string,
  accessToken: string,
  body?: unknown
): Promise<Response> {
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ─── CRUD Operations ──────────────────────────────────────────────────────────

/**
 * Create a new event in Google Calendar.
 * Returns the created GCal event ID.
 */
export async function createEvent(
  accessToken: string,
  calendarId: string,
  event: GCalEvent
): Promise<string> {
  const res = await gcalFetch(
    "POST",
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    accessToken,
    event
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GCal createEvent failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.id as string;
}

/**
 * Update an existing Google Calendar event.
 */
export async function updateEvent(
  accessToken: string,
  calendarId: string,
  gcalEventId: string,
  event: Partial<GCalEvent>
): Promise<void> {
  const res = await gcalFetch(
    "PATCH",
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(gcalEventId)}`,
    accessToken,
    event
  );

  if (!res.ok) {
    // 404 means the event was already deleted on Google's side — not a hard error
    if (res.status === 404) {
      console.warn(`GCal updateEvent: event ${gcalEventId} not found (already deleted?)`);
      return;
    }
    const err = await res.text();
    throw new Error(`GCal updateEvent failed (${res.status}): ${err}`);
  }
}

/**
 * Delete a Google Calendar event.
 */
export async function deleteEvent(
  accessToken: string,
  calendarId: string,
  gcalEventId: string
): Promise<void> {
  const res = await gcalFetch(
    "DELETE",
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(gcalEventId)}`,
    accessToken
  );

  if (!res.ok && res.status !== 404 && res.status !== 410) {
    const err = await res.text();
    throw new Error(`GCal deleteEvent failed (${res.status}): ${err}`);
  }
}

/**
 * Register a push notification webhook for a calendar.
 * Returns { channelId, resourceId, expiration }
 */
export async function watchCalendar(
  accessToken: string,
  calendarId: string,
  webhookUrl: string,
  channelId: string
): Promise<{ channelId: string; resourceId: string; expiration: string }> {
  const res = await gcalFetch(
    "POST",
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    accessToken,
    {
      id: channelId,
      type: "web_hook",
      address: webhookUrl,
      expiration: String(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in ms
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GCal watchCalendar failed (${res.status}): ${err}`);
  }

  const data = await res.json();
  return {
    channelId: data.id,
    resourceId: data.resourceId,
    expiration: new Date(Number(data.expiration)).toISOString(),
  };
}

/**
 * Stop a push notification webhook channel.
 */
export async function stopChannel(
  accessToken: string,
  channelId: string,
  resourceId: string
): Promise<void> {
  const res = await gcalFetch(
    "POST",
    "https://www.googleapis.com/calendar/v3/channels/stop",
    accessToken,
    { id: channelId, resourceId }
  );

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    throw new Error(`GCal stopChannel failed (${res.status}): ${err}`);
  }
}

/**
 * List changed events since a given syncToken or timeMin.
 */
export async function listEvents(
  accessToken: string,
  calendarId: string,
  options: { syncToken?: string; timeMin?: string; maxResults?: number }
): Promise<{ items: GCalEvent[]; nextSyncToken?: string; nextPageToken?: string }> {
  const params = new URLSearchParams();
  if (options.syncToken) params.set("syncToken", options.syncToken);
  if (options.timeMin) params.set("timeMin", options.timeMin);
  if (options.maxResults) params.set("maxResults", String(options.maxResults));
  params.set("singleEvents", "true");

  const res = await gcalFetch(
    "GET",
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
    accessToken
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GCal listEvents failed (${res.status}): ${err}`);
  }

  return res.json();
}

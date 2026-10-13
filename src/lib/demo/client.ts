/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Cliente de Supabase simulado para el modo demo.
 * Implementa el subconjunto del query builder que usa la app (select/insert/update/
 * upsert/delete con filtros, orden, límite, embeds "rel(cols)"), los RPC que
 * existen en las migraciones, auth con un usuario fijo, storage y functions.
 * Los datos viven en memoria y, en el navegador, se guardan en localStorage.
 */
import { buildDataset, DEMO_USER, type Dataset, type Row } from "./data";
import { DEMO_USER_ID } from "./index";

const LS_KEY = "paw.demo.db";
const DB_VERSION = 3;

let db: Dataset | null = null;

function load(): Dataset {
  if (db) return db;
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { v: number; data: Dataset; day: string };
        if (parsed.v === DB_VERSION && parsed.day === new Date().toDateString()) {
          db = parsed.data;
          return db;
        }
      }
    } catch {
      /* ignore */
    }
  }
  db = buildDataset();
  return db;
}

function persist() {
  if (typeof window === "undefined" || !db) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ v: DB_VERSION, data: db, day: new Date().toDateString() }));
  } catch {
    /* ignore */
  }
}

function newId(prefix = "demo") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

// ── Relaciones para embeds ──────────────────────────────────────────────────
const FK_BY_EMBED: Record<string, string> = {
  businesses: "business_id",
  business_services: "service_id",
  pets: "pet_id",
  users: "user_id",
  care_cycles: "cycle_id",
  marketplace_plans: "plan_id",
  marketplace_listings: "listing_id",
  medications: "medication_id",
  events: "event_id",
  clinical_records: "clinical_record_id",
  training_sessions: "session_id",
  pet_members: "pet_member_id",
  lost_pet_alerts: "alert_id",
};
const FK_OF_TABLE: Record<string, string> = {
  events: "event_id",
  training_sessions: "session_id",
  pet_members: "pet_member_id",
  clinical_records: "clinical_record_id",
  medications: "medication_id",
  businesses: "business_id",
  pets: "pet_id",
  users: "user_id",
  care_cycles: "cycle_id",
  lost_pet_alerts: "alert_id",
  bookings: "booking_id",
};

interface Embed {
  name: string;
  cols: string;
  inner: boolean;
}

function parseSelect(sel: string): { cols: string[]; embeds: Embed[] } {
  const cols: string[] = [];
  const embeds: Embed[] = [];
  let depth = 0;
  let cur = "";
  const flush = () => {
    const t = cur.trim();
    cur = "";
    if (!t) return;
    const m = t.match(/^([a-zA-Z_]+)(!inner)?\(([\s\S]*)\)$/);
    if (m) embeds.push({ name: m[1], inner: !!m[2], cols: m[3] });
    else cols.push(t);
  };
  for (const ch of sel) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) flush();
    else cur += ch;
  }
  flush();
  return { cols, embeds };
}

function pick(row: Row, cols: string): Row {
  const c = cols.trim();
  if (!c || c === "*") return { ...row };
  const out: Row = {};
  for (const k of c.split(",").map((s) => s.trim())) {
    if (k === "*") Object.assign(out, row);
    else if (k in row) out[k] = row[k];
  }
  return out;
}

type Filter = { kind: string; col: string; val: any };

function cmp(a: any, b: any): number {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a) < String(b) ? -1 : 1;
}

function matchOne(row: Row, f: Filter): boolean {
  const v = row[f.col];
  switch (f.kind) {
    case "eq":
      return v === f.val || String(v) === String(f.val);
    case "neq":
      return v !== f.val && String(v) !== String(f.val);
    case "in":
      return (f.val as any[]).some((x) => x === v || String(x) === String(v));
    case "gte":
      return cmp(v, f.val) >= 0;
    case "lte":
      return cmp(v, f.val) <= 0;
    case "gt":
      return cmp(v, f.val) > 0;
    case "lt":
      return cmp(v, f.val) < 0;
    case "is":
      return f.val === null ? v == null : v === f.val;
    case "not_is":
      return f.val === null ? v != null : v !== f.val;
    case "ilike": {
      const pat = String(f.val).toLowerCase().replace(/%/g, "");
      return String(v ?? "").toLowerCase().includes(pat);
    }
    case "contains":
      return Array.isArray(v) && (f.val as any[]).every((x) => v.includes(x));
    case "or":
      return (f.val as Filter[]).some((sub) => matchOne(row, sub));
    default:
      return true;
  }
}

function parseOr(expr: string): Filter[] {
  return expr.split(",").map((part) => {
    const [col, op, ...rest] = part.split(".");
    return { kind: op, col, val: rest.join(".") };
  });
}

class Query implements PromiseLike<{ data: any; error: any; count?: number }> {
  private filters: Filter[] = [];
  private orders: { col: string; asc: boolean }[] = [];
  private lim: number | null = null;
  private mode: "many" | "single" | "maybe" = "many";
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private sel = "*";
  private payload: any = null;
  private onConflict: string | null = null;
  private wantReturn = false;

  constructor(private table: string) {}

  select(cols = "*") {
    this.sel = cols;
    if (this.op !== "select") this.wantReturn = true;
    return this;
  }
  insert(p: any) {
    this.op = "insert";
    this.payload = p;
    return this;
  }
  upsert(p: any, opts?: { onConflict?: string }) {
    this.op = "upsert";
    this.payload = p;
    this.onConflict = opts?.onConflict ?? null;
    return this;
  }
  update(p: any) {
    this.op = "update";
    this.payload = p;
    return this;
  }
  delete() {
    this.op = "delete";
    return this;
  }
  eq(col: string, val: any) {
    this.filters.push({ kind: "eq", col, val });
    return this;
  }
  neq(col: string, val: any) {
    this.filters.push({ kind: "neq", col, val });
    return this;
  }
  in(col: string, val: any[]) {
    this.filters.push({ kind: "in", col, val });
    return this;
  }
  gte(col: string, val: any) {
    this.filters.push({ kind: "gte", col, val });
    return this;
  }
  lte(col: string, val: any) {
    this.filters.push({ kind: "lte", col, val });
    return this;
  }
  gt(col: string, val: any) {
    this.filters.push({ kind: "gt", col, val });
    return this;
  }
  lt(col: string, val: any) {
    this.filters.push({ kind: "lt", col, val });
    return this;
  }
  is(col: string, val: any) {
    this.filters.push({ kind: "is", col, val });
    return this;
  }
  not(col: string, op: string, val: any) {
    this.filters.push({ kind: op === "is" ? "not_is" : "neq", col, val });
    return this;
  }
  ilike(col: string, val: string) {
    this.filters.push({ kind: "ilike", col, val });
    return this;
  }
  like(col: string, val: string) {
    return this.ilike(col, val);
  }
  contains(col: string, val: any) {
    this.filters.push({ kind: "contains", col, val: Array.isArray(val) ? val : [val] });
    return this;
  }
  or(expr: string) {
    this.filters.push({ kind: "or", col: "", val: parseOr(expr) });
    return this;
  }
  match(obj: Record<string, any>) {
    for (const [k, v] of Object.entries(obj)) this.eq(k, v);
    return this;
  }
  filter(col: string, op: string, val: any) {
    this.filters.push({ kind: op, col, val });
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending !== false });
    return this;
  }
  limit(n: number) {
    this.lim = n;
    return this;
  }
  range(from: number, to: number) {
    this.lim = to - from + 1;
    return this;
  }
  single() {
    this.mode = "single";
    return this;
  }
  maybeSingle() {
    this.mode = "maybe";
    return this;
  }
  returns() {
    return this;
  }

  private rows(): Row[] {
    const data = load();
    if (!data[this.table]) data[this.table] = [];
    return data[this.table];
  }

  private applyFilters(rows: Row[]): Row[] {
    // filtros sobre embeds (p. ej. "marketplace_listings.business_id") se resuelven tras embed
    const plain = this.filters.filter((f) => !f.col.includes("."));
    return rows.filter((r) => plain.every((f) => matchOne(r, f)));
  }

  private embed(row: Row, embeds: Embed[]): Row | null {
    const data = load();
    const out: Row = { ...row };
    for (const e of embeds) {
      const fk = FK_BY_EMBED[e.name];
      const rel = data[e.name] ?? [];
      if (fk && fk in row) {
        const found = rel.find((x) => x.id === row[fk]);
        out[e.name] = found ? pick(found, e.cols) : null;
        if (e.inner && !found) return null;
      } else {
        const back = FK_OF_TABLE[this.table];
        const list = back ? rel.filter((x) => x[back] === row.id) : [];
        out[e.name] = list.map((x) => pick(x, e.cols));
        if (e.inner && list.length === 0) return null;
      }
    }
    // filtros con punto sobre embeds
    for (const f of this.filters.filter((x) => x.col.includes("."))) {
      const [rel, col] = f.col.split(".");
      const target = out[rel];
      const ok = Array.isArray(target) ? target.some((t) => matchOne(t as Row, { ...f, col })) : target ? matchOne(target as Row, { ...f, col }) : false;
      if (!ok) return null;
    }
    return out;
  }

  private project(rows: Row[]): Row[] {
    const { cols, embeds } = parseSelect(this.sel);
    const out: Row[] = [];
    for (const r of rows) {
      const withEmbeds = this.embed(r, embeds);
      if (!withEmbeds) continue;
      const base = pick(withEmbeds, cols.length ? cols.join(",") : "*");
      for (const e of embeds) base[e.name] = withEmbeds[e.name];
      out.push(base);
    }
    return out;
  }

  private finish(rows: Row[]) {
    let out = rows;
    for (const o of [...this.orders].reverse()) out = [...out].sort((a, b) => (o.asc ? cmp(a[o.col], b[o.col]) : cmp(b[o.col], a[o.col])));
    if (this.lim != null) out = out.slice(0, this.lim);
    if (this.mode === "single") {
      if (out.length !== 1) return { data: null, error: { code: "PGRST116", message: out.length ? "Multiple rows" : "No rows found" } };
      return { data: out[0], error: null };
    }
    if (this.mode === "maybe") return { data: out[0] ?? null, error: null };
    return { data: out, error: null, count: out.length };
  }

  private exec() {
    const table = this.rows();
    const now = new Date().toISOString();
    if (this.op === "select") {
      return this.finish(this.project(this.applyFilters(table)));
    }
    if (this.op === "insert") {
      const items = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p: Row) => ({ id: newId(), created_at: now, ...p }));
      table.push(...items);
      persist();
      return this.finish(this.project(items));
    }
    if (this.op === "upsert") {
      const items = Array.isArray(this.payload) ? this.payload : [this.payload];
      const keys = (this.onConflict ?? "id").split(",").map((s) => s.trim());
      const out: Row[] = [];
      for (const p of items as Row[]) {
        const idx = table.findIndex((r) => keys.every((k) => k in p && r[k] === p[k]));
        if (idx >= 0) {
          table[idx] = { ...table[idx], ...p, updated_at: now };
          out.push(table[idx]);
        } else {
          const row = { id: newId(), created_at: now, ...p };
          table.push(row);
          out.push(row);
        }
      }
      persist();
      return this.finish(this.project(out));
    }
    if (this.op === "update") {
      const targets = this.applyFilters(table);
      for (const t of targets) Object.assign(t, this.payload, { updated_at: now });
      persist();
      return this.finish(this.project(targets));
    }
    if (this.op === "delete") {
      const targets = new Set(this.applyFilters(table));
      const data = load();
      data[this.table] = table.filter((r) => !targets.has(r));
      persist();
      return this.finish(this.project([...targets]));
    }
    return { data: null, error: null };
  }

  then<T1 = any, T2 = never>(onfulfilled?: ((v: { data: any; error: any; count?: number }) => T1 | PromiseLike<T1>) | null, onrejected?: ((e: any) => T2 | PromiseLike<T2>) | null): PromiseLike<T1 | T2> {
    let res;
    try {
      res = this.exec();
    } catch (e) {
      return Promise.resolve({ data: null, error: { message: String(e) } }).then(onfulfilled as any, onrejected);
    }
    return Promise.resolve(res).then(onfulfilled as any, onrejected);
  }
}

// ── RPC ────────────────────────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function isOpen(hours: any, emergency: boolean): boolean {
  if (emergency) return true;
  if (!hours) return false;
  const now = new Date();
  const key = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][now.getDay()];
  const slots = hours[key] as [string, string][] | undefined;
  if (!slots) return false;
  const t = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return slots.some(([a, b]) => t >= a && t <= b);
}

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function rpc(name: string, args: Record<string, any> = {}) {
  const data = load();
  try {
    switch (name) {
      case "nearby_businesses": {
        const { p_lat, p_lng, p_radius_m = 2000, p_categories = null, p_open_now = false, p_min_rating = null, p_limit = 50 } = args;
        const rows = data.businesses
          .filter((b) => b.active && b.lat != null)
          .map((b) => ({ ...(b as Row), distance_m: haversine(p_lat, p_lng, b.lat as number, b.lng as number), is_open: isOpen(b.hours, !!b.emergency_24h) }) as Row & { distance_m: number; is_open: boolean })
          .filter((b) => b.distance_m <= p_radius_m)
          .filter((b) => !p_categories || (b.categories as string[]).some((c) => p_categories.includes(c)))
          .filter((b) => p_min_rating == null || (b.rating_avg as number) >= p_min_rating)
          .filter((b) => !p_open_now || b.is_open)
          .sort((a, b) => a.distance_m - b.distance_m)
          .slice(0, p_limit);
        return { data: rows, error: null };
      }
      case "nearest_emergency": {
        const { p_lat, p_lng, p_limit = 3 } = args;
        const rows = data.businesses
          .filter((b) => b.active && (b.emergency_24h || (b.categories as string[]).includes("urgencias")))
          .map((b) => ({ ...b, distance_m: haversine(p_lat, p_lng, b.lat as number, b.lng as number) }))
          .sort((a, b) => a.distance_m - b.distance_m)
          .slice(0, p_limit);
        return { data: rows, error: null };
      }
      case "complete_care_cycle": {
        const cycle = data.care_cycles.find((c) => c.id === args.p_cycle_id);
        if (!cycle) return { data: null, error: { message: "cycle not found" } };
        const done = args.p_done_at ?? localToday();
        const id = newId("cl");
        data.care_cycle_logs.push({ id, cycle_id: cycle.id, pet_id: cycle.pet_id, user_id: DEMO_USER_ID, done_at: done, product: args.p_product ?? null, dose: args.p_dose ?? null, cost: args.p_cost ?? null, business_id: args.p_business_id ?? null, booking_id: null, photo_url: null, notes: args.p_notes ?? null, created_at: new Date().toISOString() });
        const [y, m, d] = String(done).split("-").map(Number);
        const next = new Date(y, m - 1, d + (cycle.interval_days as number));
        cycle.last_done_at = done;
        cycle.next_due_at = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
        if (args.p_product) cycle.product = args.p_product;
        if (args.p_cost) data.expenses.push({ id: newId("ex"), pet_id: cycle.pet_id, user_id: DEMO_USER_ID, monto: args.p_cost, fecha: done, categoria: "Salud", descripcion: cycle.name, quien_pago: "Yo", created_at: new Date().toISOString() });
        persist();
        return { data: id, error: null };
      }
      case "generate_care_cycles_for_pet": {
        const pet = data.pets.find((p) => p.id === args.p_pet_id);
        if (!pet) return { data: 0, error: null };
        const existing = data.care_cycles.filter((c) => c.pet_id === pet.id);
        if (existing.length) return { data: 0, error: null };
        const base: [string, string, number, number][] = pet.species === "gato"
          ? [["deworm_internal", "Desparasitación interna", 15, 1], ["vaccine", "Triple felina", 21, 6], ["deworm_external", "Antipulgas", 30, 8], ["weight", "Control de peso", 7, 3], ["nails", "Uñas", 21, 10], ["dental", "Dientes", 1, 0], ["checkup", "Control veterinario", 90, 23], ["vaccine", "Antirrábica", 365, 40]]
          : [["vaccine", "Polivalente (múltiple)", 365, 30], ["vaccine", "Antirrábica", 365, 30], ["deworm_internal", "Desparasitación interna", 90, 7], ["deworm_external", "Antipulgas y garrapatas", 30, 3], ["weight", "Control de peso", 30, 7], ["bath", "Baño", 21, 7], ["nails", "Uñas", 21, 7], ["ears", "Oídos", 7, 2], ["dental", "Dientes", 1, 0], ["checkup", "Control veterinario", 365, 60]];
        const today = new Date();
        for (const [kind, name, interval, offset] of base) {
          const next = new Date(today);
          next.setDate(next.getDate() + offset);
          data.care_cycles.push({ id: newId("cy"), pet_id: pet.id, user_id: pet.user_id, kind, name, interval_days: interval, interval_value: interval, interval_unit: "days", last_done_at: null, next_due_at: `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`, product: null, dose: null, notes: null, source: "catalog", protocol_id: null, active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        }
        persist();
        return { data: base.length, error: null };
      }
      case "nearby_lost_pets": {
        const { p_lat, p_lng, p_radius_m = 5000 } = args;
        const rows = data.lost_pet_alerts
          .filter((a) => a.status === "active" && a.lat != null)
          .map((a) => {
            const pet = data.pets.find((p) => p.id === a.pet_id);
            return { id: a.id, pet_id: a.pet_id, pet_name: pet?.name ?? "Mascota", species: pet?.species ?? "perro", breed: pet?.breed ?? null, photo_url: a.photo_url ?? pet?.photo_url ?? null, message: a.message, contact_phone: a.contact_phone, last_seen_at: a.last_seen_at, address: a.address, lat: a.lat, lng: a.lng, distance_m: haversine(p_lat, p_lng, a.lat as number, a.lng as number), reward: a.reward };
          })
          .filter((a) => a.distance_m <= p_radius_m)
          .sort((a, b) => a.distance_m - b.distance_m);
        return { data: rows, error: null };
      }
      case "pet_emergency_card": {
        const t = data.share_tokens.find((s) => s.token === args.p_token);
        const pet = t && data.pets.find((p) => p.id === t.pet_id);
        if (!pet) return { data: [], error: null };
        const owner = data.users.find((u) => u.id === pet.user_id);
        const meds = data.medications.filter((m) => m.pet_id === pet.id && m.active).map((m) => ({ name: m.name, dose: `${m.dose_amount} ${m.dose_unit}`, frequency: `${m.frequency_value} ${m.frequency_unit}` }));
        const vacc = data.care_cycles.filter((c) => c.pet_id === pet.id && c.kind === "vaccine" && c.active).map((c) => ({ name: c.name, last: c.last_done_at, next: c.next_due_at }));
        const lost = data.lost_pet_alerts.find((a) => a.pet_id === pet.id && a.status === "active") ?? null;
        return { data: [{ pet_name: pet.name, species: pet.species, breed: pet.breed, sex: pet.sex, neutered: pet.neutered, birth_date: pet.birth_date, weight: pet.weight, photo_url: pet.photo_url, microchip: pet.microchip, allergies: pet.allergies, conditions: pet.conditions, blood_type: pet.blood_type, emergency_contact: pet.emergency_contact, owner_name: owner?.display_name ?? null, active_medications: meds, last_vaccines: vacc, lost_alert: lost }], error: null };
      }
      case "track_listing_event":
        return { data: null, error: null };
      default:
        return { data: null, error: { code: "PGRST202", message: `rpc ${name} no disponible en demo` } };
    }
  } catch (e) {
    return { data: null, error: { message: String(e) } };
  }
}

// ── Auth / storage / functions ─────────────────────────────────────────────
const session = { user: DEMO_USER, access_token: "demo", refresh_token: "demo", expires_in: 3600, token_type: "bearer" };

function demoImageFor(path: string): string {
  const data = load();
  const photo = data.pet_photos.find((p) => p.storage_path === path);
  if (photo) return photo.photo_url as string;
  const doc = data.clinical_documents.find((d) => d.storage_path === path);
  if (doc) return doc.file_url as string;
  return `https://loremflickr.com/800/800/dog?lock=${Math.abs(path.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % 500}`;
}

const auth = {
  getSession: async () => ({ data: { session }, error: null }),
  getUser: async () => ({ data: { user: DEMO_USER }, error: null }),
  onAuthStateChange: (_cb: any) => ({ data: { subscription: { unsubscribe() {} } } }),
  signOut: async () => {
    const { disableDemoCookie } = await import("./index");
    disableDemoCookie();
    return { error: null };
  },
  signInWithOAuth: async () => ({ data: null, error: { message: "No disponible en la demo" } }),
  signInWithPassword: async () => ({ data: { session, user: DEMO_USER }, error: null }),
  signUp: async () => ({ data: { session, user: DEMO_USER }, error: null }),
  updateUser: async (attrs: any) => {
    Object.assign(DEMO_USER.user_metadata, attrs?.data ?? {});
    return { data: { user: DEMO_USER }, error: null };
  },
  getUserIdentities: async () => ({ data: { identities: [] }, error: null }),
  linkIdentity: async () => ({ data: null, error: { message: "No disponible en la demo" } }),
  unlinkIdentity: async () => ({ data: null, error: { message: "No disponible en la demo" } }),
  exchangeCodeForSession: async () => ({ data: { session }, error: null }),
};

const storage = {
  from: (_bucket: string) => ({
    upload: async (path: string) => ({ data: { path }, error: null }),
    getPublicUrl: (path: string) => ({ data: { publicUrl: demoImageFor(path) } }),
    createSignedUrl: async (path: string) => ({ data: { signedUrl: demoImageFor(path) }, error: null }),
    createSignedUrls: async (paths: string[]) => ({ data: paths.map((p) => ({ path: p, signedUrl: demoImageFor(p) })), error: null }),
    remove: async () => ({ data: [], error: null }),
    list: async () => ({ data: [], error: null }),
  }),
};

const functions = {
  invoke: async (name: string) => ({ data: name === "lost-pet-broadcast" ? { queued: 14 } : { ok: true }, error: null }),
};

export function createDemoClient(): any {
  return {
    from: (table: string) => new Query(table),
    rpc,
    auth,
    storage,
    functions,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }), subscribe: () => ({}) }),
    removeChannel: () => {},
  };
}

/** Reinicia los datos de ejemplo (botón en Ajustes) */
export function resetDemoData() {
  db = null;
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  }
}

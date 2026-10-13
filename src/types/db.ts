/**
 * Tipos de las tablas nuevas (Fases 1 a 3). Nombres en inglés, como las columnas.
 * Se mantienen a mano hasta poder ejecutar `supabase gen types` contra el proyecto.
 */

export type Species = "perro" | "gato" | "ave" | "conejo" | "otro";
export type Sex = "male" | "female" | "unknown";
export type LifeStage = "puppy" | "adult" | "senior";
export type ActivityLevel = "low" | "medium" | "high";

export type IntervalUnit = "days" | "weeks" | "months";

export type CareCycleKind =
  | "vaccine"
  | "deworm_internal"
  | "deworm_external"
  | "bath"
  | "grooming"
  | "nails"
  | "ears"
  | "dental"
  | "food_restock"
  | "checkup"
  | "weight"
  | "other";

export const CARE_KIND_LABEL: Record<CareCycleKind, string> = {
  vaccine: "Vacuna",
  deworm_internal: "Desparasitación",
  deworm_external: "Antipulgas",
  bath: "Baño",
  grooming: "Corte",
  nails: "Uñas",
  ears: "Oídos",
  dental: "Dientes",
  food_restock: "Recompra de alimento",
  checkup: "Control veterinario",
  weight: "Peso",
  other: "Seguimiento",
};

/** Grupos de ciclo para las pantallas */
export const HEALTH_KINDS: CareCycleKind[] = ["vaccine", "deworm_internal", "deworm_external", "checkup", "weight"];
export const HYGIENE_KINDS: CareCycleKind[] = ["bath", "grooming", "nails", "ears", "dental"];

export interface PetMeal {
  time: string; // "08:00"
  grams: number;
}

export interface PetFood {
  brand?: string;
  product?: string;
  bag_kg?: number;
  opened_at?: string; // YYYY-MM-DD
  grams_per_day?: number;
  meals?: PetMeal[];
  snacks_per_day?: number;
  notes?: string;
  changes?: { date: string; from?: string; to?: string; reason?: string }[];
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

export interface PetRow {
  id: string;
  user_id: string;
  name: string;
  species: Species;
  breed: string | null;
  birth_date: string | null;
  weight: number | null;
  emoji: string | null;
  color: string | null;
  avatar_config: unknown | null;
  sex: Sex;
  neutered: boolean;
  microchip: string | null;
  allergies: string[];
  conditions: string[];
  blood_type: string | null;
  emergency_contact: EmergencyContact | null;
  photo_url: string | null;
  activity_level: ActivityLevel;
  food: PetFood | null;
  reproductive: { last_heat_at?: string; pregnant_since?: string; due_at?: string; litter_size?: number } | null;
  created_at: string;
  updated_at: string;
}

export interface WeightLog {
  id: string;
  pet_id: string;
  user_id: string;
  weight_kg: number;
  measured_at: string;
  notes: string | null;
  created_at: string;
}

export interface CareProtocol {
  id: string;
  species: Species;
  stage: LifeStage;
  kind: CareCycleKind;
  name: string;
  interval_days: number;
  start_age_days: number;
  end_age_days: number | null;
  first_due_offset_days: number;
  notes: string | null;
  sort: number;
}

export interface CareCycle {
  id: string;
  pet_id: string;
  user_id: string;
  kind: CareCycleKind;
  name: string;
  interval_days: number;
  interval_value: number | null;
  interval_unit: IntervalUnit;
  last_done_at: string | null;
  next_due_at: string;
  product: string | null;
  dose: string | null;
  notes: string | null;
  source: "manual" | "catalog" | "business" | "legacy";
  protocol_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CareCycleLog {
  id: string;
  cycle_id: string;
  pet_id: string;
  user_id: string;
  done_at: string;
  product: string | null;
  dose: string | null;
  cost: number | null;
  business_id: string | null;
  booking_id: string | null;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export type BusinessCategory =
  | "veterinaria"
  | "urgencias"
  | "peluqueria"
  | "tienda"
  | "farmacia"
  | "entrenador"
  | "paseador"
  | "guarderia"
  | "pet_friendly"
  | "funeraria"
  | "otro";

export const BUSINESS_CATEGORY_LABEL: Record<BusinessCategory, string> = {
  veterinaria: "Veterinaria",
  urgencias: "Urgencias 24 h",
  peluqueria: "Peluquería",
  tienda: "Tienda",
  farmacia: "Farmacia",
  entrenador: "Entrenador",
  paseador: "Paseador",
  guarderia: "Guardería",
  pet_friendly: "Pet friendly",
  funeraria: "Funeraria",
  otro: "Otro",
};

/** {"mon":[["08:00","20:00"]], ...} */
export type BusinessHours = Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", [string, string][]>>;

export interface Business {
  id: string;
  owner_user_id: string | null;
  name: string;
  type: BusinessCategory;
  categories: BusinessCategory[];
  description: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  hours: BusinessHours | null;
  emergency_24h: boolean;
  price_level: number | null;
  price_from: number | null;
  claimed: boolean;
  verified: boolean;
  rating_avg: number;
  rating_count: number;
  logo_url: string | null;
  cover_url: string | null;
  photos: string[];
  writes_history: boolean;
  promo_text: string | null;
  active: boolean;
  qr_code: string;
  created_at: string;
}

/** Fila devuelta por nearby_businesses */
export interface NearbyBusiness {
  id: string;
  name: string;
  type: BusinessCategory;
  categories: BusinessCategory[];
  description: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  lat: number;
  lng: number;
  distance_m: number;
  rating_avg: number;
  rating_count: number;
  price_from: number | null;
  price_level: number | null;
  verified: boolean;
  emergency_24h: boolean;
  writes_history: boolean;
  cover_url: string | null;
  logo_url: string | null;
  hours: BusinessHours | null;
  promo_text: string | null;
  whatsapp: string | null;
  phone: string | null;
  is_open: boolean;
}

export interface BusinessService {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number | null;
  duration_min: number | null;
  care_cycle_kind: CareCycleKind | null;
  care_cycle_name: string | null;
  active: boolean;
  sort: number;
}

export interface Review {
  id: string;
  business_id: string;
  user_id: string;
  pet_id: string | null;
  rating: number;
  body: string | null;
  reply: string | null;
  replied_at: string | null;
  created_at: string;
  /** join opcional */
  users?: { display_name: string | null } | null;
  pets?: { name: string; breed: string | null } | null;
}

export type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled" | "no_show";

export interface Booking {
  id: string;
  business_id: string;
  service_id: string | null;
  pet_id: string;
  user_id: string;
  starts_at: string;
  ends_at: string | null;
  status: BookingStatus;
  price: number | null;
  notes: string | null;
  business_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  businesses?: Pick<Business, "id" | "name" | "address" | "cover_url" | "logo_url" | "whatsapp" | "phone" | "lat" | "lng"> | null;
  business_services?: Pick<BusinessService, "id" | "name" | "duration_min" | "price" | "care_cycle_kind"> | null;
  pets?: { id: string; name: string; avatar_config?: unknown } | null;
}

export type EventCategory = "adopcion" | "clase" | "carrera" | "feria" | "salud" | "social" | "otro";

export interface PetEvent {
  id: string;
  business_id: string | null;
  created_by: string | null;
  organizer_name: string | null;
  title: string;
  description: string | null;
  category: EventCategory;
  starts_at: string;
  ends_at: string | null;
  address: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  price: number;
  capacity: number | null;
  cover_url: string | null;
  species: Species[];
  active: boolean;
  created_at: string;
  /** agregados opcionales */
  going_count?: number;
  my_status?: "going" | "interested" | "cancelled" | null;
}

export interface LostPetAlert {
  id: string;
  pet_id: string;
  user_id: string;
  status: "active" | "found" | "cancelled";
  last_seen_at: string;
  lat: number | null;
  lng: number | null;
  radius_m: number;
  address: string | null;
  message: string | null;
  contact_phone: string | null;
  photo_url: string | null;
  reward: number | null;
  resolved_at: string | null;
  created_at: string;
}

export interface NearbyLostPet {
  id: string;
  pet_id: string;
  pet_name: string;
  species: Species;
  breed: string | null;
  photo_url: string | null;
  message: string | null;
  contact_phone: string | null;
  last_seen_at: string;
  address: string | null;
  lat: number;
  lng: number;
  distance_m: number;
  reward: number | null;
}

export interface AssistantMessage {
  id: string;
  user_id: string;
  pet_id: string | null;
  role: "user" | "assistant";
  content: string;
  actions: AssistantAction[] | null;
  created_at: string;
}

export type AssistantAction =
  | { type: "remind"; cycle_id: string; label: string }
  | { type: "book"; category: BusinessCategory; label: string }
  | { type: "log"; kind: CareCycleKind; label: string; note?: string }
  | { type: "sos"; label: string };

export interface EmergencyCard {
  pet_name: string;
  species: Species;
  breed: string | null;
  sex: Sex;
  neutered: boolean;
  birth_date: string | null;
  weight: number | null;
  photo_url: string | null;
  microchip: string | null;
  allergies: string[];
  conditions: string[];
  blood_type: string | null;
  emergency_contact: EmergencyContact | null;
  owner_name: string | null;
  active_medications: { name: string; dose: string; frequency: string }[];
  last_vaccines: { name: string; last: string | null; next: string }[];
  lost_alert: LostPetAlert | null;
}

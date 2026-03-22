export type TaskStatus = "pendiente" | "en_progreso" | "completado";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

export interface AvatarConfig {
  style: "adventurer" | "adventurer-neutral" | "fun-emoji" | "lorelei" | "bottts";
  seed: string;
}

export interface Pet {
  id: string;
  ownerId: string;
  sharedWith: string[];
  name: string;
  species: "perro" | "gato" | "ave" | "conejo" | "otro";
  breed?: string;
  birthDate?: string;
  weight?: number;
  emoji: string;
  color: string;
  photos: string[];   // base64 data URLs
  avatar_config?: AvatarConfig | null;
  createdAt: string;
}

export interface Gasto {
  id: string;
  petId: string;
  concepto: string;
  monto: number;
  fecha: string;
  quien: string;
  notas?: string;
  createdAt: string;
}

export interface TareaEntrenamiento {
  id: string;
  descripcion: string;
  estado: TaskStatus;
}

export interface ClaseEntrenamiento {
  id: string;
  petId: string;
  fecha: string;
  entrenador?: string;
  temas: string;
  ejercicios: string;
  avances: string;
  tareas: TareaEntrenamiento[];
  createdAt: string;
}

export interface Vacuna {
  id: string;
  petId: string;
  nombre: string;
  fecha: string;
  proximaFecha?: string;
  veterinario?: string;
  notas?: string;
  createdAt: string;
}

// Itinerario
export interface ItinerarioItem {
  id: string;
  petId: string;
  tipo: "comida" | "salida";
  nombre: string;
  hora: string;         // "08:00"
  dias: number[];       // 0=Dom, 1=Lun … 6=Sáb
  cantidad?: string;    // e.g. "1 taza", "30 min"
  notas?: string;
  createdAt: string;
}

export interface RegistroItinerario {
  id: string;
  petId: string;
  itemId: string;
  fecha: string;        // YYYY-MM-DD
  completado: boolean;
  completadoPor?: string; // userId
  createdAt: string;
}

// Notificaciones
export interface Notificacion {
  id: string;
  petId: string;
  autorId: string;
  tipo: "nota" | "alerta" | "logro";
  titulo: string;
  mensaje?: string;
  leida: boolean;
  createdAt: string;
}

// Clinical Records (F3)
export type VisitType =
  | "consulta_general"
  | "emergencia"
  | "cirugia"
  | "control_rutina"
  | "peluqueria"
  | "otro";

export interface ClinicalRecord {
  id: string;
  pet_id: string;
  user_id: string;
  created_by_role: string;
  visit_date: string;          // YYYY-MM-DD
  visit_type: VisitType;
  vet_name?: string;
  clinic_name?: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  vaccine_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ClinicalDocument {
  id: string;
  clinical_record_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  storage_path: string;
  file_size_bytes?: number;
  created_at: string;
}

export type ActiveModule =
  | "dashboard"
  | "gastos"
  | "entrenamiento"
  | "vacunas"
  | "itinerario"
  | "notificaciones"
  | "medicamentos"
  | "info"
  | "marketplace";

export type AppScreen = "auth" | "pets" | "app";

"use client";
/**
 * PhotoGallery — Galería cronológica con lazy loading, filtros y contexto de eventos.
 * Sprint 3 · PAW
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Camera } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useStore } from "@/store";
import { uploadPetPhoto } from "@/lib/storage/uploadPhoto";
import { PhotoMonth, type MonthGroup } from "./PhotoMonth";
import { PhotoFullscreen } from "./PhotoFullscreen";
import type { PhotoCardPhoto, ContextualBadge } from "./PhotoCard";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const INITIAL_MONTHS = 3;

type FilterType = "all" | "vacuna" | "vet" | "medicamento" | "cumple";
const FILTERS: { id: FilterType; label: string; icon: string }[] = [
  { id: "all",         label: "Todos",        icon: "📷" },
  { id: "vacuna",      label: "Vacunas",      icon: "💉" },
  { id: "vet",         label: "Vet",          icon: "🏥" },
  { id: "medicamento", label: "Medicamentos", icon: "💊" },
  { id: "cumple",      label: "Cumpleaños",   icon: "🎂" },
];

interface BadgeCache {
  [photoId: string]: ContextualBadge[];
}


export function PhotoGallery() {
  const { user } = useAuthContext();
  const { selectedPetId, pets } = useStore();
  const pet = pets.find((p) => p.id === selectedPetId);
  const accentColor = pet?.color ?? "#0a84ff";

  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);
  const [unknownPhotos, setUnknownPhotos] = useState<PhotoCardPhoto[]>([]);
  const [visibleMonths, setVisibleMonths] = useState(INITIAL_MONTHS);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [badgeCache, setBadgeCache] = useState<BadgeCache>({});
  const [fullscreen, setFullscreen] = useState<{ photo: PhotoCardPhoto; group: MonthGroup } | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // ----- Fetch grouped data -----
  const fetchPhotos = useCallback(async () => {
    if (!user || !selectedPetId) return;
    setLoading(true);

    const supabase = createClient();

    // Raw query via RPC or manual SQL — use direct select + group client-side
    const { data: rows, error } = await supabase
      .from("pet_photos")
      .select("id, photo_url, storage_path, created_at")
      .eq("pet_id", selectedPetId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !rows) { setLoading(false); return; }

    // Separate photos with / without date
    const withDate: PhotoCardPhoto[] = [];
    const withoutDate: PhotoCardPhoto[] = [];

    for (const r of rows as PhotoCardPhoto[]) {
      if (r.created_at) withDate.push(r);
      else withoutDate.push(r);
    }

    // Group by month
    const grouped = new Map<string, MonthGroup>();
    for (const photo of withDate) {
      const d = new Date(photo.created_at!);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });

      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, { month_key: monthKey, month_label: monthLabel, photo_count: 0, photos: [] });
      }
      const grp = grouped.get(monthKey)!;
      grp.photos.push(photo);
      grp.photo_count++;
    }

    // Sort desc
    const sorted = Array.from(grouped.values()).sort((a, b) => b.month_key.localeCompare(a.month_key));

    setMonthGroups(sorted);
    setUnknownPhotos(withoutDate);
    setLoading(false);

    // Generate signed URLs for first INITIAL_MONTHS months
    void generateSignedUrls(sorted.slice(0, INITIAL_MONTHS).flatMap((g) => g.photos).concat(withoutDate), supabase);
  }, [user, selectedPetId]);

  async function generateSignedUrls(photos: PhotoCardPhoto[], supabase: ReturnType<typeof createClient>) {
    const paths = photos
      .filter((p) => p.storage_path && !signedUrls[p.id])
      .map((p) => p.storage_path!);

    if (paths.length === 0) return;

    // Batch signed URLs
    const newUrls: Record<string, string> = {};
    for (const photo of photos) {
      if (!photo.storage_path || signedUrls[photo.id]) continue;
      const { data } = await supabase.storage
        .from("paw-photos")
        .createSignedUrl(photo.storage_path, 3600);
      if (data?.signedUrl) newUrls[photo.id] = data.signedUrl;
    }

    setSignedUrls((prev) => ({ ...prev, ...newUrls }));
  }

  // ----- Load badges for visible photos -----
  const loadBadgesForPhotos = useCallback(async (photos: PhotoCardPhoto[]) => {
    if (!selectedPetId) return;
    const uncached = photos.filter((p) => !(p.id in badgeCache) && p.created_at);
    if (uncached.length === 0) return;

    const supabase = createClient();
    const newCache: BadgeCache = {};

    // Batch by unique dates
    const dateToPhotos = new Map<string, string[]>();
    for (const p of uncached) {
      const date = p.created_at!.split("T")[0];
      if (!dateToPhotos.has(date)) dateToPhotos.set(date, []);
      dateToPhotos.get(date)!.push(p.id);
    }

    for (const [date, photoIds] of dateToPhotos) {
      const badges: ContextualBadge[] = [];

      const [{ data: vacs }, { data: clin }, { data: meds }] = await Promise.all([
        supabase.from("vaccines").select("nombre").eq("pet_id", selectedPetId).eq("fecha_aplicacion", date),
        supabase.from("clinical_records").select("diagnosis").eq("pet_id", selectedPetId).eq("visit_date", date),
        supabase.from("medications").select("name").eq("pet_id", selectedPetId).eq("start_date", date),
      ]);

      if (vacs && vacs.length > 0)   badges.push({ icon: "💉", label: "Vacuna" });
      if (clin && clin.length > 0)  badges.push({ icon: "🏥", label: "Visita veterinaria" });
      if (meds && meds.length > 0)  badges.push({ icon: "💊", label: "Medicamento" });

      // Birthday
      if (pet?.birthDate) {
        const birth = pet.birthDate.slice(5, 10);
        if (date.slice(5, 10) === birth) badges.push({ icon: "🎂", label: "Cumpleaños" });
      }

      for (const id of photoIds) newCache[id] = badges;
    }

    // Photos with no date get no badges
    for (const p of uncached.filter((p) => !p.created_at)) {
      newCache[p.id] = [];
    }

    setBadgeCache((prev) => ({ ...prev, ...newCache }));
  }, [selectedPetId, pet?.birthDate, badgeCache]);

  useEffect(() => { void fetchPhotos(); }, [fetchPhotos]);

  // Load badges for visible months
  useEffect(() => {
    const visiblePhotos = monthGroups
      .slice(0, visibleMonths)
      .flatMap((g) => g.photos)
      .concat(unknownPhotos);
    void loadBadgesForPhotos(visiblePhotos);
  }, [monthGroups, visibleMonths, unknownPhotos, loadBadgesForPhotos]);

  // Load more on scroll (Intersection Observer)
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleMonths((v) => v + 2);
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [monthGroups]);

  // Load signed URLs for newly visible months
  useEffect(() => {
    if (!selectedPetId) return;
    const supabase = createClient();
    const newPhotos = monthGroups.slice(0, visibleMonths).flatMap((g) => g.photos);
    void generateSignedUrls(newPhotos, supabase);
  }, [visibleMonths, monthGroups, selectedPetId]);

  // ----- Upload -----
  async function handleFileUpload(files: FileList | null) {
    if (!files || !user || !selectedPetId) return;
    setUploading(true);
    setUploadMessage(null);

    for (const file of Array.from(files)) {
      try {
        await uploadPetPhoto(file, selectedPetId, user.id);
      } catch {
        // continue
      }
    }

    setUploading(false);
    setUploadMessage("Foto agregada a la galería 📸");
    setTimeout(() => setUploadMessage(null), 3000);
    void fetchPhotos();
  }

  // ----- Badge getter -----
  function getBadges(photo: PhotoCardPhoto): ContextualBadge[] {
    return badgeCache[photo.id] ?? [];
  }

  // ----- Filter logic -----
  const iconToFilter: Record<string, FilterType> = {
    "💉": "vacuna",
    "🏥": "vet",
    "💊": "medicamento",
    "🎂": "cumple",
  };

  function photoMatchesFilter(photo: PhotoCardPhoto): boolean {
    if (filter === "all") return true;
    const badges = getBadges(photo);
    return badges.some((b) => iconToFilter[b.icon] === filter);
  }

  const visibleGroups = useMemo(() => {
    return monthGroups.slice(0, visibleMonths).map((g) => ({
      ...g,
      photos: filter === "all" ? g.photos : g.photos.filter(photoMatchesFilter),
    })).filter((g) => g.photos.length > 0);
  }, [monthGroups, visibleMonths, filter, badgeCache]);

  const filteredUnknown = useMemo(() => {
    return filter === "all" ? unknownPhotos : unknownPhotos.filter(photoMatchesFilter);
  }, [unknownPhotos, filter, badgeCache]);

  const totalVisible = visibleGroups.reduce((s, g) => s + g.photos.length, 0) + filteredUnknown.length;

  // Enhance photos with signed URLs
  function withSignedUrl(photos: PhotoCardPhoto[]): PhotoCardPhoto[] {
    return photos.map((p) => ({ ...p, signedUrl: signedUrls[p.id] }));
  }

  const enhancedGroups = useMemo(() =>
    visibleGroups.map((g) => ({ ...g, photos: withSignedUrl(g.photos) })),
    [visibleGroups, signedUrls]
  );

  const unknownGroup: MonthGroup = {
    month_key: "0000-00",
    month_label: "Fecha desconocida",
    photo_count: filteredUnknown.length,
    photos: withSignedUrl(filteredUnknown),
  };

  // ----- Render -----
  if (loading) {
    return (
      <div style={{ padding: "20px 20px 40px", fontFamily: FONT }}>
        <div style={{ height: 28, borderRadius: 8, background: "#1c1c1e", marginBottom: 20, width: 140 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ aspectRatio: "1", borderRadius: 10, background: "#1c1c1e", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.5} }`}</style>
      </div>
    );
  }

  const hasPhotos = monthGroups.length > 0 || unknownPhotos.length > 0;

  return (
    <div style={{ padding: "20px 20px 100px", fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#fff" }}>📷 Galería</h1>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px",
            borderRadius: 20,
            background: accentColor,
            border: "none",
            cursor: uploading ? "not-allowed" : "pointer",
            opacity: uploading ? 0.7 : 1,
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            fontFamily: FONT,
          }}
        >
          <Camera size={15} />
          {uploading ? "Subiendo..." : "Agregar foto"}
        </button>
      </div>

      {/* Upload success message */}
      {uploadMessage && (
        <div
          style={{
            background: "rgba(52,199,89,0.15)",
            border: "1px solid rgba(52,199,89,0.3)",
            borderRadius: 10,
            padding: "10px 14px",
            marginBottom: 16,
            fontSize: 14,
            color: "#34c759",
            fontFamily: FONT,
          }}
        >
          {uploadMessage}
        </div>
      )}

      {/* Filters */}
      {hasPhotos && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", marginBottom: 20, paddingBottom: 4 }}>
          <style>{`.filters-row::-webkit-scrollbar { display: none; }`}</style>
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="filters-row"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "6px 12px",
                borderRadius: 20,
                border: `1px solid ${filter === f.id ? accentColor : "rgba(255,255,255,0.12)"}`,
                background: filter === f.id ? `${accentColor}22` : "transparent",
                color: filter === f.id ? accentColor : "rgba(235,235,245,0.5)",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: FONT,
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!hasPhotos && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: `${accentColor}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
            }}
          >
            📸
          </div>
          <p
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "rgba(235,235,245,0.7)",
              margin: 0,
              fontFamily: FONT,
            }}
          >
            Aún no hay fotos de {pet?.name ?? "tu mascota"}.{" "}
            ¡Empieza a crear su historia! 📸
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              marginTop: 8,
              padding: "12px 24px",
              borderRadius: 20,
              background: accentColor,
              border: "none",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              color: "#fff",
              fontFamily: FONT,
            }}
          >
            Agregar primera foto
          </button>
        </div>
      )}

      {/* Filtered empty */}
      {hasPhotos && filter !== "all" && totalVisible === 0 && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "rgba(235,235,245,0.4)", fontSize: 14, fontFamily: FONT }}>
          No hay fotos con este filtro
        </div>
      )}

      {/* Month groups */}
      {enhancedGroups.map((group) => (
        <PhotoMonth
          key={group.month_key}
          group={group}
          getBadges={getBadges}
          onPhotoClick={(photo, grp) => setFullscreen({ photo, group: grp })}
        />
      ))}

      {/* Unknown date section */}
      {filteredUnknown.length > 0 && (
        <PhotoMonth
          group={unknownGroup}
          getBadges={getBadges}
          onPhotoClick={(photo) => setFullscreen({ photo, group: unknownGroup })}
        />
      )}

      {/* Load more sentinel */}
      {visibleMonths < monthGroups.length && (
        <div ref={loadMoreRef} style={{ height: 1 }} />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => { void handleFileUpload(e.target.files); }}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
      />

      {/* Fullscreen lightbox */}
      {fullscreen && (
        <PhotoFullscreen
          photo={fullscreen.photo}
          group={fullscreen.group}
          petId={selectedPetId!}
          userId={user!.id}
          petBirthDate={pet?.birthDate}
          accentColor={accentColor}
          onClose={() => setFullscreen(null)}
          onDeleted={(id) => {
            void fetchPhotos();
            setFullscreen(null);
          }}
        />
      )}
    </div>
  );
}

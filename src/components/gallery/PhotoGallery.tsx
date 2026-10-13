"use client";
/**
 * PhotoGallery — Galería cronológica con carga progresiva, filtros y contexto de eventos.
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Camera, Clapperboard, Images, PlayCircle, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useActivePet } from "@/hooks/useActivePet";
import { uploadPetPhoto } from "@/lib/storage/uploadPhoto";
import { Button, Chip, ChipRow, EmptyState, PageHeader, ProgressBar, SectionTitle, Skeleton, showToast } from "@/components/ui";
import { PhotoMonth, type MonthGroup } from "./PhotoMonth";
import { PhotoFullscreen } from "./PhotoFullscreen";
import { VideoFullscreen } from "./VideoFullscreen";
import { GallerySkeleton } from "./GallerySkeleton";
import { BADGE_ICON, BADGE_LABEL, type BadgeKind, type ContextualBadge } from "./badges";
import { useVideoUpload, type VideoEntry } from "@/hooks/useVideoUpload";
import type { PhotoCardPhoto } from "./PhotoCard";

const INITIAL_MONTHS = 3;

type FilterType = "all" | BadgeKind;
const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "vacuna", label: "Vacunas" },
  { id: "vet", label: "Veterinario" },
  { id: "medicamento", label: "Medicamentos" },
  { id: "cumple", label: "Cumpleaños" },
];

interface BadgeCache {
  [photoId: string]: ContextualBadge[];
}

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function PhotoGallery({ initialSection = "fotos" }: { initialSection?: "fotos" | "videos" }) {
  const { user } = useAuthContext();
  const { pet } = useActivePet();
  const selectedPetId = pet?.id ?? null;

  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);
  const [unknownPhotos, setUnknownPhotos] = useState<PhotoCardPhoto[]>([]);
  const [visibleMonths, setVisibleMonths] = useState(INITIAL_MONTHS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [badgeCache, setBadgeCache] = useState<BadgeCache>({});
  const [fullscreen, setFullscreen] = useState<{ photo: PhotoCardPhoto; group: MonthGroup } | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [fullscreenVideo, setFullscreenVideo] = useState<VideoEntry | null>(null);
  const { upload: uploadVideo, progress: videoProgress, isUploading: videoUploading, error: videoError } = useVideoUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const videosRef = useRef<HTMLDivElement>(null);

  // ----- Fotos agrupadas por mes -----
  const fetchPhotos = useCallback(async () => {
    if (!user || !selectedPetId) return;
    setLoading(true);
    setLoadError(false);

    const supabase = createClient();
    const { data: rows, error } = await supabase
      .from("pet_photos")
      .select("id, photo_url, storage_path, created_at")
      .eq("pet_id", selectedPetId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error || !rows) {
      setLoading(false);
      setLoadError(true);
      return;
    }

    const withDate: PhotoCardPhoto[] = [];
    const withoutDate: PhotoCardPhoto[] = [];
    for (const r of rows as PhotoCardPhoto[]) {
      if (r.created_at) withDate.push(r);
      else withoutDate.push(r);
    }

    const grouped = new Map<string, MonthGroup>();
    for (const photo of withDate) {
      const d = new Date(photo.created_at!);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const monthLabel = d.toLocaleDateString("es-ES", { month: "long", year: "numeric" });
      if (!grouped.has(monthKey)) grouped.set(monthKey, { month_key: monthKey, month_label: monthLabel, photo_count: 0, photos: [] });
      const grp = grouped.get(monthKey)!;
      grp.photos.push(photo);
      grp.photo_count++;
    }

    const sorted = Array.from(grouped.values()).sort((a, b) => b.month_key.localeCompare(a.month_key));
    setMonthGroups(sorted);
    setUnknownPhotos(withoutDate);
    setLoading(false);

    void generateSignedUrls(sorted.slice(0, INITIAL_MONTHS).flatMap((g) => g.photos).concat(withoutDate), supabase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedPetId]);

  async function generateSignedUrls(photos: PhotoCardPhoto[], supabase: ReturnType<typeof createClient>) {
    const pending = photos.filter((p) => p.storage_path && !signedUrls[p.id]);
    if (pending.length === 0) return;
    const newUrls: Record<string, string> = {};
    for (const photo of pending) {
      const { data } = await supabase.storage.from("paw-photos").createSignedUrl(photo.storage_path!, 3600);
      if (data?.signedUrl) newUrls[photo.id] = data.signedUrl;
    }
    setSignedUrls((prev) => ({ ...prev, ...newUrls }));
  }

  // ----- Insignias de contexto -----
  const loadBadgesForPhotos = useCallback(
    async (photos: PhotoCardPhoto[]) => {
      if (!selectedPetId) return;
      const uncached = photos.filter((p) => !(p.id in badgeCache) && p.created_at);
      if (uncached.length === 0) return;

      const supabase = createClient();
      const newCache: BadgeCache = {};
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
        if (vacs && vacs.length > 0) badges.push({ kind: "vacuna", label: BADGE_LABEL.vacuna });
        if (clin && clin.length > 0) badges.push({ kind: "vet", label: BADGE_LABEL.vet });
        if (meds && meds.length > 0) badges.push({ kind: "medicamento", label: BADGE_LABEL.medicamento });
        if (pet?.birthDate && date.slice(5, 10) === pet.birthDate.slice(5, 10)) badges.push({ kind: "cumple", label: BADGE_LABEL.cumple });
        for (const id of photoIds) newCache[id] = badges;
      }
      for (const p of uncached.filter((p) => !p.created_at)) newCache[p.id] = [];
      setBadgeCache((prev) => ({ ...prev, ...newCache }));
    },
    [selectedPetId, pet?.birthDate, badgeCache]
  );

  useEffect(() => {
    void fetchPhotos();
  }, [fetchPhotos]);

  useEffect(() => {
    const visiblePhotos = monthGroups.slice(0, visibleMonths).flatMap((g) => g.photos).concat(unknownPhotos);
    void loadBadgesForPhotos(visiblePhotos);
  }, [monthGroups, visibleMonths, unknownPhotos, loadBadgesForPhotos]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setVisibleMonths((v) => v + 2);
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [monthGroups]);

  useEffect(() => {
    if (!selectedPetId) return;
    const supabase = createClient();
    void generateSignedUrls(monthGroups.slice(0, visibleMonths).flatMap((g) => g.photos), supabase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMonths, monthGroups, selectedPetId]);

  // ----- Videos -----
  const fetchVideos = useCallback(async () => {
    if (!user || !selectedPetId) return;
    setVideosLoading(true);
    const supabase = createClient();
    const { data: rows, error } = await supabase
      .from("pet_videos")
      .select("id, pet_id, user_id, video_url, storage_path, file_size_bytes, duration_seconds, created_at")
      .eq("pet_id", selectedPetId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!error && rows) {
      const vids = (
        rows as Array<{
          id: string;
          pet_id: string;
          user_id: string;
          video_url: string;
          storage_path: string;
          file_size_bytes: number;
          duration_seconds?: number;
          created_at: string;
        }>
      ).map((r) => ({
        id: r.id,
        petId: r.pet_id,
        userId: r.user_id,
        videoUrl: r.video_url,
        storagePath: r.storage_path,
        fileSizeBytes: r.file_size_bytes,
        durationSeconds: r.duration_seconds,
        createdAt: r.created_at,
      }));
      setVideos(vids);
    }
    setVideosLoading(false);
  }, [user, selectedPetId]);

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    if (videoError) showToast(videoError, undefined, "error");
  }, [videoError]);

  // /videos abre la galería desplazada a la sección de videos
  useEffect(() => {
    if (initialSection === "videos" && !loading) videosRef.current?.scrollIntoView({ block: "start" });
  }, [initialSection, loading]);

  async function handleVideoUpload(files: FileList | null) {
    if (!files || !user || !selectedPetId) return;
    const file = files[0];
    if (!file) return;
    const result = await uploadVideo(file, {
      petId: selectedPetId,
      userId: user.id,
      onWarning: (msg) => showToast(msg),
    });
    if (result) {
      showToast("Video subido", undefined, "success");
      void fetchVideos();
    }
  }

  async function handleFileUpload(files: FileList | null) {
    if (!files || !user || !selectedPetId) return;
    setUploading(true);
    let failed = 0;
    for (const file of Array.from(files)) {
      try {
        await uploadPetPhoto(file, selectedPetId, user.id);
      } catch {
        failed++;
      }
    }
    setUploading(false);
    if (failed === files.length) showToast("No se pudo subir la foto", undefined, "error");
    else showToast(files.length > 1 ? "Fotos agregadas a la galería" : "Foto agregada a la galería", undefined, "success");
    void fetchPhotos();
  }

  function getBadges(photo: PhotoCardPhoto): ContextualBadge[] {
    return badgeCache[photo.id] ?? [];
  }

  function photoMatchesFilter(photo: PhotoCardPhoto): boolean {
    if (filter === "all") return true;
    return getBadges(photo).some((b) => b.kind === filter);
  }

  const visibleGroups = useMemo(() => {
    return monthGroups
      .slice(0, visibleMonths)
      .map((g) => ({ ...g, photos: filter === "all" ? g.photos : g.photos.filter(photoMatchesFilter) }))
      .filter((g) => g.photos.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthGroups, visibleMonths, filter, badgeCache]);

  const filteredUnknown = useMemo(() => {
    return filter === "all" ? unknownPhotos : unknownPhotos.filter(photoMatchesFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unknownPhotos, filter, badgeCache]);

  const totalVisible = visibleGroups.reduce((s, g) => s + g.photos.length, 0) + filteredUnknown.length;

  function withSignedUrl(photos: PhotoCardPhoto[]): PhotoCardPhoto[] {
    return photos.map((p) => ({ ...p, signedUrl: signedUrls[p.id] }));
  }

  const enhancedGroups = useMemo(
    () => visibleGroups.map((g) => ({ ...g, photos: withSignedUrl(g.photos) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleGroups, signedUrls]
  );

  const unknownGroup: MonthGroup = {
    month_key: "0000-00",
    month_label: "Fecha desconocida",
    photo_count: filteredUnknown.length,
    photos: withSignedUrl(filteredUnknown),
  };

  if (loading) return <GallerySkeleton />;

  const hasPhotos = monthGroups.length > 0 || unknownPhotos.length > 0;
  const petName = pet?.name ?? "tu mascota";

  return (
    <div className="pb-10">
      <PageHeader
        title={initialSection === "videos" ? "Videos" : "Galería"}
        eyebrow={pet?.name}
        back
        actions={
          <Button size="icon" variant="tonal" onClick={() => fileInputRef.current?.click()} loading={uploading} aria-label="Agregar foto">
            <Camera size={20} />
          </Button>
        }
      />

      {hasPhotos && (
        <div className="px-4 py-2">
          <ChipRow>
            {FILTERS.map((f) => {
              const Icon = f.id === "all" ? Images : BADGE_ICON[f.id];
              return (
                <Chip key={f.id} selected={filter === f.id} onClick={() => setFilter(f.id)} leading={<Icon size={14} />}>
                  {f.label}
                </Chip>
              );
            })}
          </ChipRow>
        </div>
      )}

      <div className="px-4 pt-2">
        {loadError && !hasPhotos && (
          <EmptyState
            tone="danger"
            icon={<Images size={24} />}
            title="No pudimos cargar las fotos"
            description="Revisa tu conexión e inténtalo otra vez."
            action={<Button full onClick={() => void fetchPhotos()}>Reintentar</Button>}
          />
        )}

        {!loadError && !hasPhotos && (
          <EmptyState
            title={`Aún no hay fotos de ${petName}`}
            description="Empieza a crear su historia subiendo la primera foto."
            action={
              <Button full leading={<Camera size={18} />} onClick={() => fileInputRef.current?.click()} loading={uploading}>
                Agregar primera foto
              </Button>
            }
          />
        )}

        {hasPhotos && filter !== "all" && totalVisible === 0 && (
          <EmptyState compact tone="neutral" icon={<Images size={22} />} title="Sin fotos con este filtro" description="Prueba con otro filtro o muestra todas." />
        )}

        {enhancedGroups.map((group) => (
          <PhotoMonth key={group.month_key} group={group} getBadges={getBadges} onPhotoClick={(photo, grp) => setFullscreen({ photo, group: grp })} />
        ))}

        {filteredUnknown.length > 0 && <PhotoMonth group={unknownGroup} getBadges={getBadges} onPhotoClick={(photo) => setFullscreen({ photo, group: unknownGroup })} />}

        {visibleMonths < monthGroups.length && <div ref={loadMoreRef} className="h-px" aria-hidden="true" />}

        {/* ── Videos ── */}
        <section ref={videosRef} className="mt-6 scroll-mt-4 flex flex-col gap-3" aria-label="Videos">
          <SectionTitle
            action={
              <Button size="sm" variant="tonal" leading={<Upload size={14} />} onClick={() => videoInputRef.current?.click()} loading={videoUploading}>
                {videoUploading ? `Subiendo ${videoProgress}%` : "Subir video"}
              </Button>
            }
          >
            Videos
          </SectionTitle>

          {videoUploading && <ProgressBar value={videoProgress / 100} />}

          {videosLoading ? (
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="aspect-[9/16] rounded-card" />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <EmptyState compact tone="neutral" icon={<Clapperboard size={22} />} title="Aún no hay videos" description="Captura los mejores momentos en video (MP4, hasta 3 minutos)." />
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {videos.map((vid) => (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => setFullscreenVideo(vid)}
                  aria-label={`Reproducir video${vid.durationSeconds != null ? ` de ${formatDuration(vid.durationSeconds)}` : ""}`}
                  className="relative aspect-[9/16] overflow-hidden rounded-card bg-surface-3 transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <div className="absolute inset-0 flex items-center justify-center text-on-variant">
                    <PlayCircle size={36} aria-hidden="true" />
                  </div>
                  {vid.durationSeconds !== undefined && vid.durationSeconds !== null && (
                    <span className="absolute right-1.5 bottom-1.5 rounded-full bg-on/75 px-1.5 py-0.5 text-[11px] font-bold text-bg">{formatDuration(vid.durationSeconds)}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => void handleFileUpload(e.target.files)}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => void handleVideoUpload(e.target.files)}
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
      />

      {fullscreen && selectedPetId && user && (
        <PhotoFullscreen
          photo={fullscreen.photo}
          group={fullscreen.group}
          petId={selectedPetId}
          userId={user.id}
          petBirthDate={pet?.birthDate}
          onClose={() => setFullscreen(null)}
          onDeleted={() => {
            void fetchPhotos();
            setFullscreen(null);
          }}
        />
      )}

      {fullscreenVideo && (
        <VideoFullscreen
          video={fullscreenVideo}
          onClose={() => setFullscreenVideo(null)}
          onDeleted={(id) => {
            setVideos((prev) => prev.filter((v) => v.id !== id));
            setFullscreenVideo(null);
          }}
        />
      )}
    </div>
  );
}

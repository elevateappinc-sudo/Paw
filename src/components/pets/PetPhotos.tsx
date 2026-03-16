"use client";
import { useRef, useState } from "react";
import { useStore } from "@/store";
import { Camera, X, ChevronLeft, ChevronRight, Trash2, ImagePlus } from "lucide-react";

const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif";
const MAX_PHOTOS = 20;
const MAX_PX = 1200;
const QUALITY = 0.82;

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > MAX_PX || height > MAX_PX) {
          if (width > height) { height = Math.round(height * MAX_PX / width); width = MAX_PX; }
          else { width = Math.round(width * MAX_PX / height); height = MAX_PX; }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      img.onerror = reject;
      img.src = e.target!.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface PetPhotosProps {
  petId: string;
  photos: string[];
  accentColor: string;
  canEdit: boolean;
}

export function PetPhotos({ petId, photos, accentColor, canEdit }: PetPhotosProps) {
  const { addPetPhoto, deletePetPhoto } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [viewer, setViewer] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    setLoading(true);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (photos.length >= MAX_PHOTOS) break;
      try {
        const dataUrl = await compressImage(file);
        addPetPhoto(petId, dataUrl);
      } catch {
        // skip bad files
      }
    }
    setLoading(false);
  }

  function prev() { setViewer((v) => (v !== null && v > 0 ? v - 1 : photos.length - 1)); }
  function next() { setViewer((v) => (v !== null && v < photos.length - 1 ? v + 1 : 0)); }

  return (
    <>
      {/* Grid */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 3,
      }}>
        {photos.map((src, i) => (
          <div key={i} style={{ position: "relative", aspectRatio: "1", overflow: "hidden", borderRadius: 10, cursor: "pointer" }}
            onClick={() => setViewer(i)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            {canEdit && (
              <button
                onClick={(e) => { e.stopPropagation(); deletePetPhoto(petId, i); }}
                style={{ position: "absolute", top: 5, right: 5, width: 22, height: 22, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={12} color="#fff" />
              </button>
            )}
          </div>
        ))}

        {/* Add button */}
        {canEdit && photos.length < MAX_PHOTOS && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            style={{
              aspectRatio: "1", borderRadius: 10, border: `2px dashed rgba(255,255,255,0.15)`,
              background: "rgba(255,255,255,0.04)", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6,
              opacity: loading ? 0.5 : 1,
            }}>
            {loading
              ? <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${accentColor}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
              : <ImagePlus size={22} color={accentColor} />}
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(235,235,245,0.4)", fontFamily: FONT }}>
              {loading ? "..." : "Agregar"}
            </span>
          </button>
        )}
      </div>

      {/* Empty state with upload CTA */}
      {photos.length === 0 && canEdit && (
        <button
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          style={{
            width: "100%", padding: "32px 20px", borderRadius: 14,
            border: `2px dashed rgba(255,255,255,0.1)`, background: "rgba(255,255,255,0.03)",
            cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `${accentColor}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Camera size={24} color={accentColor} />
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, fontFamily: FONT }}>Agregar fotos</p>
            <p style={{ fontSize: 13, color: "rgba(235,235,245,0.4)", margin: "4px 0 0", fontFamily: FONT }}>
              Toca para seleccionar desde tu galería
            </p>
          </div>
        </button>
      )}

      {photos.length === 0 && !canEdit && (
        <p style={{ textAlign: "center", padding: "32px 0", fontSize: 14, color: "rgba(235,235,245,0.3)", fontFamily: FONT }}>
          Sin fotos aún
        </p>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef} type="file" accept="image/*" multiple
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
        onClick={(e) => { (e.target as HTMLInputElement).value = ""; }}
      />

      {/* Fullscreen viewer */}
      {viewer !== null && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setViewer(null)}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* Header */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)" }}
            onClick={(e) => e.stopPropagation()}>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: FONT }}>
              {viewer + 1} / {photos.length}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              {canEdit && (
                <button onClick={() => { deletePetPhoto(petId, viewer); setViewer(photos.length > 1 ? Math.min(viewer, photos.length - 2) : null); }}
                  style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,69,58,0.2)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={16} color="#ff453a" />
                </button>
              )}
              <button onClick={() => setViewer(null)}
                style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={18} color="#fff" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div style={{ maxWidth: "100vw", maxHeight: "80dvh", padding: "0 60px" }} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[viewer]} alt="" style={{ maxWidth: "100%", maxHeight: "80dvh", objectFit: "contain", borderRadius: 12 }} />
          </div>

          {/* Prev / Next */}
          {photos.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); prev(); }}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronLeft size={22} color="#fff" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); next(); }}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ChevronRight size={22} color="#fff" />
              </button>
            </>
          )}

          {/* Dot indicators */}
          {photos.length > 1 && photos.length <= 12 && (
            <div style={{ position: "absolute", bottom: 24, display: "flex", gap: 6 }}>
              {photos.map((_, i) => (
                <div key={i} onClick={(e) => { e.stopPropagation(); setViewer(i); }}
                  style={{ width: viewer === i ? 18 : 7, height: 7, borderRadius: 999, background: viewer === i ? "#fff" : "rgba(255,255,255,0.3)", cursor: "pointer", transition: "all 0.2s" }} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

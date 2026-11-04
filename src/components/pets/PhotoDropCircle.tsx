"use client";
import { useRef, useState, type DragEvent } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { showToast } from "@/components/ui";

const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

/**
 * Círculo de foto de mascota: toca para elegir, arrastra una imagen para soltarla
 * o pega desde el portapapeles. Valida tipo y tamaño antes de entregar el archivo.
 */
export function PhotoDropCircle({ preview, onFile, size = "md", label }: { preview: string | null; onFile: (f: File) => void; size?: "md" | "lg"; label?: string }) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [over, setOver] = useState(false);

  function accept(file: File | undefined | null) {
    if (!file) return;
    if (!ACCEPT.includes(file.type)) return showToast("Solo JPG, PNG o WebP", undefined, "error");
    if (file.size > 10 * 1024 * 1024) return showToast("La foto pesa más de 10 MB", undefined, "error");
    onFile(file);
  }
  function onDrop(e: DragEvent) {
    e.preventDefault();
    setOver(false);
    accept(e.dataTransfer.files?.[0]);
  }
  function onDrag(e: DragEvent, state: boolean) {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) setOver(state);
  }

  const dim = size === "lg" ? "h-28 w-28" : "h-20 w-20";
  const icon = size === "lg" ? 30 : 24;
  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        onDragEnter={(e) => onDrag(e, true)}
        onDragOver={(e) => onDrag(e, true)}
        onDragLeave={(e) => onDrag(e, false)}
        onDrop={onDrop}
        onPaste={(e) => accept(Array.from(e.clipboardData.files)[0])}
        aria-label={label ?? (preview ? "Cambiar foto" : "Añadir foto")}
        className={`flex ${dim} shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed bg-surface-elevated text-text-secondary transition-[border-color,transform,box-shadow] active:scale-95 ${over ? "scale-105 border-primary text-primary-text ring-4 ring-primary/20" : "border-text-secondary"}`}
      >
        {over ? (
          <ImagePlus size={icon} aria-hidden="true" />
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="pointer-events-none h-full w-full object-cover" />
        ) : (
          <Camera size={icon} aria-hidden="true" />
        )}
      </button>
      <input ref={fileRef} type="file" accept={ACCEPT.join(",")} className="sr-only" onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ""; }} />
    </>
  );
}

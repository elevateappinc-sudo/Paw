"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { createListing } from "@/app/actions/marketplace";

interface CreateListingFormProps {
  businessId: string;
  planName?: string;
  maxImages?: number;
  onSuccess?: (listingId: string) => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  { value: "alimentos",     label: "🦴 Alimentos" },
  { value: "accesorios",    label: "🎾 Accesorios" },
  { value: "servicios_vet", label: "🏥 Veterinaria" },
  { value: "peluqueria",    label: "✂️ Peluquería" },
  { value: "paseos",        label: "🦮 Paseos" },
  { value: "guarderia",     label: "🏠 Guardería" },
];

export function CreateListingForm({
  businessId,
  planName = "free",
  maxImages = 3,
  onSuccess,
  onCancel,
}: CreateListingFormProps) {
  const [form, setForm] = useState({
    type: "product" as "product" | "service",
    title: "",
    description: "",
    price: "",
    price_unit: "",
    category: "accesorios" as string,
    contact_whatsapp: "",
    contact_email: "",
    is_featured: false,
    images: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const set = (field: string, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = "El título es obligatorio.";
    if (!form.contact_whatsapp && !form.contact_email)
      errs.contact = "Debes indicar al menos WhatsApp o email.";
    if (form.images.length > maxImages)
      errs.images = `Máximo ${maxImages} imágenes en tu plan ${planName}.`;
    return errs;
  };

  const handleImageAdd = () => {
    const url = prompt("URL de la imagen:");
    if (url) {
      if (form.images.length >= maxImages) {
        setErrors((e) => ({ ...e, images: `Máximo ${maxImages} imágenes en tu plan ${planName}.` }));
        return;
      }
      set("images", [...form.images, url]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    setGlobalError("");

    const result = await createListing({
      business_id: businessId,
      type: form.type,
      title: form.title,
      description: form.description || undefined,
      price: form.price ? parseFloat(form.price) : undefined,
      price_unit: form.price_unit || undefined,
      category: form.category as "alimentos" | "accesorios" | "servicios_vet" | "peluqueria" | "paseos" | "guarderia",
      images: form.images,
      contact_whatsapp: form.contact_whatsapp || undefined,
      contact_email: form.contact_email || undefined,
      is_featured: form.is_featured,
    });

    setLoading(false);
    if (result.success && result.listing) {
      onSuccess?.(result.listing.id);
    } else {
      setGlobalError(result.error ?? "Error desconocido.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {globalError && (
        <div style={{ background: "rgba(255,59,48,0.1)", border: "1px solid rgba(255,59,48,0.3)", borderRadius: 10, padding: "10px 14px", color: "#ff453a", fontSize: 13 }}>
          {globalError}
        </div>
      )}

      {/* Type */}
      <div style={{ display: "flex", gap: 10 }}>
        {(["product", "service"] as const).map((t) => (
          <button type="button" key={t}
            onClick={() => set("type", t)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13,
              background: form.type === t ? "rgba(10,132,255,0.2)" : "rgba(255,255,255,0.06)",
              color: form.type === t ? "#0a84ff" : "rgba(235,235,245,0.5)",
              outline: form.type === t ? "1px solid rgba(10,132,255,0.4)" : "none",
            }}
          >
            {t === "product" ? "📦 Producto" : "🛎️ Servicio"}
          </button>
        ))}
      </div>

      <Input
        label="Título *"
        value={form.title}
        onChange={e => set("title", e.target.value)}
        placeholder="Ej: Comida premium para perros"
        error={errors.title}
      />

      <Textarea
        label="Descripción"
        value={form.description}
        onChange={e => set("description", e.target.value)}
        placeholder="Describe tu producto o servicio..."
        rows={3}
      />

      <div style={{ display: "flex", gap: 12 }}>
        <Input
          label="Precio"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={e => set("price", e.target.value)}
          placeholder="0.00"
        />
        <Input
          label="Unidad"
          value={form.price_unit}
          onChange={e => set("price_unit", e.target.value)}
          placeholder="kg, hora, mes..."
        />
      </div>

      <Select
        label="Categoría *"
        value={form.category}
        onChange={e => set("category", e.target.value)}
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </Select>

      {/* Contact */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(235,235,245,0.6)" }}>Contacto *</div>
        {errors.contact && (
          <div style={{ fontSize: 12, color: "#ff453a" }}>{errors.contact}</div>
        )}
        <Input
          placeholder="WhatsApp (ej: 5491112345678)"
          value={form.contact_whatsapp}
          onChange={e => set("contact_whatsapp", e.target.value)}
        />
        <Input
          type="email"
          placeholder="Email de contacto"
          value={form.contact_email}
          onChange={e => set("contact_email", e.target.value)}
        />
      </div>

      {/* Images */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(235,235,245,0.6)", marginBottom: 8 }}>
          Imágenes ({form.images.length}/{maxImages})
        </div>
        {errors.images && <div style={{ fontSize: 12, color: "#ff453a", marginBottom: 6 }}>{errors.images}</div>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {form.images.map((img, i) => (
            <div key={i} style={{ width: 72, height: 72, borderRadius: 10, overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.1)" }}>
              <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button type="button"
                onClick={() => set("images", form.images.filter((_, idx) => idx !== i))}
                style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(255,59,48,0.9)", border: "none", color: "white", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>
          ))}
          {form.images.length < maxImages && (
            <button type="button" onClick={handleImageAdd}
              style={{ width: 72, height: 72, borderRadius: 10, border: "1.5px dashed rgba(255,255,255,0.2)", background: "transparent", color: "rgba(235,235,245,0.4)", cursor: "pointer", fontSize: 22 }}
            >+</button>
          )}
        </div>
      </div>

      {/* Featured — business only */}
      {planName === "business" && (
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input type="checkbox" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} />
          <span style={{ fontSize: 13, color: "rgba(235,235,245,0.7)" }}>⭐ Marcar como destacado</span>
        </label>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} style={{ flex: 1 }}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={loading} style={{ flex: 2 }}>
          {loading ? "Publicando..." : "Publicar listado"}
        </Button>
      </div>
    </form>
  );
}

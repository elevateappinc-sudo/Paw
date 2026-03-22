"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ListingCard, type Listing } from "./ListingCard";
import { CreateListingForm } from "./CreateListingForm";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getMarketplaceListings, trackListingEvent } from "@/app/actions/marketplace";
import { ShoppingBag, Plus, RefreshCw } from "lucide-react";

const CATEGORIES = [
  { value: "all",          label: "Todos" },
  { value: "alimentos",     label: "🦴 Alimentos" },
  { value: "accesorios",    label: "🎾 Accesorios" },
  { value: "servicios_vet", label: "🏥 Veterinaria" },
  { value: "peluqueria",    label: "✂️ Peluquería" },
  { value: "paseos",        label: "🦮 Paseos" },
  { value: "guarderia",     label: "🏠 Guardería" },
];

interface MarketplaceModuleProps {
  businessId?: string;
  planName?: string;
  maxImages?: number;
}

export function MarketplaceModule({ businessId, planName = "free", maxImages = 3 }: MarketplaceModuleProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const trackedRef = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMarketplaceListings(category === "all" ? undefined : category);
      setListings(data as Listing[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { void load(); }, [load]);

  // IntersectionObserver for view tracking
  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = (entry.target as HTMLElement).dataset.listingId;
            if (id && !trackedRef.current.has(id)) {
              trackedRef.current.add(id);
              void trackListingEvent(id, "view");
              observerRef.current?.unobserve(entry.target);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    const cards = document.querySelectorAll("[data-listing-id]");
    cards.forEach((card) => observerRef.current?.observe(card));

    return () => observerRef.current?.disconnect();
  }, [listings]);

  return (
    <div style={{ padding: "24px 16px", minHeight: "100dvh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(10,132,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShoppingBag size={20} color="#0a84ff" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "rgba(235,235,245,0.95)" }}>Marketplace</div>
            <div style={{ fontSize: 12, color: "rgba(235,235,245,0.4)" }}>Productos y servicios para tu mascota</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={load} title="Recargar"
            style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RefreshCw size={15} color="rgba(235,235,245,0.4)" />
          </button>
          {businessId && (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Publicar
            </Button>
          )}
        </div>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4, marginBottom: 20 }}>
        <style>{`.cat-scroll::-webkit-scrollbar { display: none; }`}</style>
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setCategory(c.value)}
            style={{
              flexShrink: 0, padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer",
              fontSize: 12, fontWeight: 600,
              background: category === c.value ? "#0a84ff" : "rgba(255,255,255,0.07)",
              color: category === c.value ? "white" : "rgba(235,235,245,0.5)",
              transition: "all 0.15s",
            }}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60, color: "rgba(235,235,245,0.3)" }}>
          Cargando...
        </div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(235,235,245,0.35)" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Sin publicaciones todavía</div>
          {businessId && (
            <div style={{ marginTop: 16 }}>
              <Button onClick={() => setShowCreate(true)}>
                <Plus size={14} /> Ser el primero en publicar
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Featured row */}
          {listings.some(l => l.is_featured) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#ff9500", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                ⭐ Destacados
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {listings.filter(l => l.is_featured).map(l => (
                  <div key={l.id} data-listing-id={l.id}>
                    <ListingCard listing={l} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular listings */}
          {listings.some(l => !l.is_featured) && (
            <div>
              {listings.some(l => l.is_featured) && (
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(235,235,245,0.4)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>
                  Todos los listados
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {listings.filter(l => !l.is_featured).map(l => (
                  <div key={l.id} data-listing-id={l.id}>
                    <ListingCard listing={l} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create modal */}
      <Modal
        open={showCreate}
        title="Publicar en Marketplace"
        onClose={() => setShowCreate(false)}
      >
        {businessId && (
          <CreateListingForm
            businessId={businessId}
            planName={planName}
            maxImages={maxImages}
            onSuccess={() => {
              setShowCreate(false);
              void load();
            }}
            onCancel={() => setShowCreate(false)}
          />
        )}
      </Modal>
    </div>
  );
}

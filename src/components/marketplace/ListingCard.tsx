"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { trackListingEvent } from "@/app/actions/marketplace";

export interface Listing {
  id: string;
  title: string;
  description?: string | null;
  price?: number | null;
  price_unit?: string | null;
  category: string;
  images: string[];
  contact_whatsapp?: string | null;
  contact_email?: string | null;
  is_featured: boolean;
  businesses?: { name: string; verified: boolean } | null;
}

interface ListingCardProps {
  listing: Listing;
}

const CATEGORY_LABELS: Record<string, string> = {
  alimentos: "Alimentos",
  accesorios: "Accesorios",
  servicios_vet: "Veterinaria",
  peluqueria: "Peluquería",
  paseos: "Paseos",
  guarderia: "Guardería",
};

export function ListingCard({ listing }: ListingCardProps) {
  const [imgError, setImgError] = useState(false);
  const hasImage = listing.images?.length > 0 && !imgError;

  const handleWhatsApp = async () => {
    await trackListingEvent(listing.id, "click_whatsapp");
    const number = listing.contact_whatsapp!.replace(/\D/g, "");
    window.open(`https://wa.me/${number}`, "_blank");
  };

  const handleEmail = async () => {
    await trackListingEvent(listing.id, "click_email");
    window.open(`mailto:${listing.contact_email}`, "_blank");
  };

  return (
    <div style={{
      background: "#111",
      borderRadius: 16,
      overflow: "hidden",
      border: listing.is_featured ? "1px solid rgba(255,149,0,0.4)" : "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      flexDirection: "column",
      transition: "transform 0.15s, box-shadow 0.15s",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
      }}
    >
      {/* Image */}
      <div style={{ height: 160, background: "#1a1a1a", position: "relative", overflow: "hidden" }}>
        {hasImage ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>
            🐾
          </div>
        )}
        {/* Badges overlay */}
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 6 }}>
          {listing.is_featured && (
            <span style={{
              background: "#ff9500",
              color: "white",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
              letterSpacing: 0.5,
            }}>
              ⭐ DESTACADO
            </span>
          )}
          {listing.businesses?.verified && (
            <span style={{
              background: "rgba(0,200,100,0.2)",
              color: "#30d158",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
              border: "1px solid rgba(48,209,88,0.3)",
            }}>
              ✅ Verificado
            </span>
          )}
        </div>
        {/* Category */}
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          <span style={{
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            color: "rgba(235,235,245,0.7)",
            fontSize: 10,
            padding: "2px 8px",
            borderRadius: 20,
          }}>
            {CATEGORY_LABELS[listing.category] ?? listing.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        {listing.businesses?.name && (
          <div style={{ fontSize: 11, color: "rgba(235,235,245,0.4)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {listing.businesses.name}
          </div>
        )}
        <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(235,235,245,0.9)", lineHeight: 1.3 }}>
          {listing.title}
        </div>
        {listing.description && (
          <div style={{ fontSize: 13, color: "rgba(235,235,245,0.5)", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {listing.description}
          </div>
        )}
        {listing.price != null && (
          <div style={{ fontSize: 18, fontWeight: 800, color: "#30d158", marginTop: 2 }}>
            ${listing.price.toLocaleString("es-AR")}
            {listing.price_unit && (
              <span style={{ fontSize: 12, fontWeight: 500, color: "rgba(235,235,245,0.4)", marginLeft: 4 }}>/{listing.price_unit}</span>
            )}
          </div>
        )}

        {/* Contact buttons */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 10 }}>
          {listing.contact_whatsapp && (
            <button
              onClick={handleWhatsApp}
              style={{
                flex: 1, padding: "8px 0", background: "#25d366", color: "white",
                border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}
            >
              <span>💬</span> WhatsApp
            </button>
          )}
          {listing.contact_email && (
            <button
              onClick={handleEmail}
              style={{
                flex: 1, padding: "8px 0", background: "rgba(10,132,255,0.15)", color: "#0a84ff",
                border: "1px solid rgba(10,132,255,0.3)", borderRadius: 10, fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}
            >
              <span>✉️</span> Email
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

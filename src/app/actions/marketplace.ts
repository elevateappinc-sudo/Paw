"use server";

import { createClient } from "@/lib/supabase/server";

export interface CreateListingInput {
  business_id: string;
  type: "product" | "service";
  title: string;
  description?: string;
  price?: number;
  price_unit?: string;
  category: "alimentos" | "accesorios" | "servicios_vet" | "peluqueria" | "paseos" | "guarderia";
  images?: string[];
  contact_whatsapp?: string;
  contact_email?: string;
  is_featured?: boolean;
}

export interface CreateListingResult {
  success: boolean;
  listing?: { id: string };
  error?: string;
}

export async function createListing(input: CreateListingInput): Promise<CreateListingResult> {
  const supabase = await createClient();

  // Validate contact
  if (!input.contact_whatsapp && !input.contact_email) {
    return { success: false, error: "Debe proporcionar al menos un método de contacto (WhatsApp o email)." };
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "No autenticado." };

  // Get business subscription and plan
  const { data: sub } = await supabase
    .from("business_subscriptions")
    .select("status, marketplace_plans(name, max_listings, max_images, has_featured)")
    .eq("business_id", input.business_id)
    .eq("status", "active")
    .single();

  // Default to free plan
  const plan = (sub?.marketplace_plans as { name: string; max_listings: number | null; max_images: number; has_featured: boolean } | null) ?? {
    name: "free",
    max_listings: 1,
    max_images: 3,
    has_featured: false,
  };

  // Featured only for business plan
  if (input.is_featured && plan.name !== "business") {
    return { success: false, error: "Los listados destacados solo están disponibles en el plan Business." };
  }

  // Max listings check (free plan: max 1)
  if (plan.max_listings !== null) {
    const { count } = await supabase
      .from("marketplace_listings")
      .select("id", { count: "exact", head: true })
      .eq("business_id", input.business_id)
      .eq("active", true);

    if ((count ?? 0) >= plan.max_listings) {
      return {
        success: false,
        error: `Tu plan ${plan.name} solo permite ${plan.max_listings} listado(s) activo(s). Actualiza tu plan para publicar más.`,
      };
    }
  }

  // Validate images count
  const maxImages = plan.max_images ?? 3;
  const images = input.images ?? [];
  if (images.length > maxImages) {
    return { success: false, error: `Tu plan solo permite ${maxImages} imágenes por listado.` };
  }

  const { data, error } = await supabase
    .from("marketplace_listings")
    .insert({
      business_id: input.business_id,
      type: input.type,
      title: input.title.trim(),
      description: input.description?.trim() ?? null,
      price: input.price ?? null,
      price_unit: input.price_unit?.trim() ?? null,
      category: input.category,
      images: images,
      contact_whatsapp: input.contact_whatsapp?.trim() ?? null,
      contact_email: input.contact_email?.trim() ?? null,
      active: true,
      is_featured: input.is_featured ?? false,
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, listing: { id: data.id } };
}

export async function trackListingEvent(
  listingId: string,
  eventType: "view" | "click_whatsapp" | "click_email"
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("listing_analytics").insert({ listing_id: listingId, event_type: eventType });
}

export async function getMarketplaceListings(category?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("marketplace_listings")
    .select(`
      *,
      businesses(name, verified)
    `)
    .eq("active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getListingAnalytics(businessId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("marketplace_listings")
    .select(`
      id, title, listing_analytics(event_type, created_at)
    `)
    .eq("business_id", businessId)
    .eq("active", true);

  if (error) throw error;
  return data ?? [];
}

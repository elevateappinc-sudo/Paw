import { createClient } from "@/lib/supabase/client";

/** Cookie que guarda la invitación mientras la persona se registra o inicia sesión */
export const INVITE_COOKIE = "paw_invite";

export function rememberInvite(token: string) {
  document.cookie = `${INVITE_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}
export function pendingInvite(): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${INVITE_COOKIE}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}
export function forgetInvite() {
  document.cookie = `${INVITE_COOKIE}=; path=/; max-age=0`;
}

export interface InvitePreview {
  pet_name: string;
  species: string;
  photo_url: string | null;
  inviter_name: string | null;
  status: "pending" | "accepted" | "revoked";
  expired: boolean;
}

export async function fetchInvite(token: string): Promise<InvitePreview | null> {
  const { data, error } = await createClient().rpc("get_pet_invitation", { p_token: token });
  if (error) throw error;
  return ((data as InvitePreview[] | null) ?? [])[0] ?? null;
}

export type AcceptError = "invalid" | "expired" | "used" | "own_pet" | "auth_required" | "unknown";

export async function acceptInvite(token: string): Promise<{ petId: string } | { error: AcceptError }> {
  const { data, error } = await createClient().rpc("accept_pet_invitation", { p_token: token });
  if (error) {
    const known: AcceptError[] = ["invalid", "expired", "used", "own_pet", "auth_required"];
    return { error: known.find((k) => error.message.includes(k)) ?? "unknown" };
  }
  return { petId: data as string };
}

export async function createShareLink(petId: string): Promise<string> {
  const res = await fetch(`/api/pets/${petId}/share`, { method: "POST" });
  const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !json.url) throw new Error(json.error ?? "No pudimos crear el enlace");
  return json.url;
}

export interface MemberProfile {
  member_id: string | null;
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string;
  status: "pending" | "active" | "revoked";
  is_owner: boolean;
}

export async function fetchMemberProfiles(petId: string): Promise<MemberProfile[]> {
  const { data, error } = await createClient().rpc("pet_member_profiles", { p_pet_id: petId });
  if (error) throw error;
  return (data as MemberProfile[] | null) ?? [];
}

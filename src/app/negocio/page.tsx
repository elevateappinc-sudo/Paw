import type { Metadata } from "next";
import { NegocioScreen } from "@/components/negocio/NegocioScreen";

export const metadata: Metadata = { title: "Mi negocio" };

export default function NegocioPage() {
  return <NegocioScreen />;
}

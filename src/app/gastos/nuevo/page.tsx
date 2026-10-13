"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GastosSkeleton } from "@/components/gastos/GastosSkeleton";

export default function NuevoGastoPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/gastos?nuevo=1");
  }, [router]);
  return <GastosSkeleton />;
}

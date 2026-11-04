import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE, DEMO_DEFAULT_LATENCY, DEMO_LATENCY_COOKIE } from "@/lib/demo";

/**
 * /demo activa el modo demo (cookie) y lleva al inicio.
 * /demo?off=1 lo desactiva y vuelve al login.
 * Cada consulta simula ~900 ms de red para que se vean skeletons y loaders;
 * /demo?lento=0 la quita y /demo?lento=2000 la ajusta (ms).
 */
export function GET(request: NextRequest) {
  const off = request.nextUrl.searchParams.get("off") === "1";
  const res = NextResponse.redirect(new URL(off ? "/login" : "/home", request.url));
  if (off) {
    res.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
    res.cookies.set(DEMO_LATENCY_COOKIE, "", { path: "/", maxAge: 0 });
  } else {
    res.cookies.set(DEMO_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
    const lento = Number(request.nextUrl.searchParams.get("lento") ?? DEMO_DEFAULT_LATENCY);
    const latency = Number.isFinite(lento) ? Math.max(0, Math.min(5000, Math.round(lento))) : DEMO_DEFAULT_LATENCY;
    res.cookies.set(DEMO_LATENCY_COOKIE, String(latency), { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
  }
  return res;
}

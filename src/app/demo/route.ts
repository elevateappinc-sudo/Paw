import { NextResponse, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "@/lib/demo";

/**
 * /demo activa el modo demo (cookie) y lleva al inicio.
 * /demo?off=1 lo desactiva y vuelve al login.
 */
export function GET(request: NextRequest) {
  const off = request.nextUrl.searchParams.get("off") === "1";
  const res = NextResponse.redirect(new URL(off ? "/login" : "/home", request.url));
  if (off) {
    res.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
  } else {
    res.cookies.set(DEMO_COOKIE, "1", { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax" });
  }
  return res;
}

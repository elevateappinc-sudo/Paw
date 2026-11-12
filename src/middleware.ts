import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (static metadata)
     * - .well-known/* (App Links / Universal Links: deben responder 200 sin redirect ni auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|js|css|woff2?|txt|map)$).*)",
  ],
};

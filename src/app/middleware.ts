import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATHS = ["/login", "/register", "/reset-password"];
const PUBLIC_PREFIXES = [
  "/_next", "/favicon.ico", "/icons", "/images", "/assets", "/api/auth",
];

function isPublic(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (AUTH_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export function middleware(req: NextRequest) {
  const { pathname, origin } = req.nextUrl;

  // 1) Publiczne ścieżki: omijamy
  if (isPublic(req)) return NextResponse.next();

  // 2) Sprawdzamy cookie z JWT (nazwa taka jak w backendzie)
  const token = req.cookies.get("access_token")?.value;

  if (!token) {
    // Brak tokenu → redirect do loginu z paramem next
    const url = new URL("/login", origin);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // 3) (Opcjonalnie) walidacja po stronie BE:
  // - szybki ping na /api/auth/session (200 OK = token aktywny)
  // Uwaga: middleware działa na Edge Runtime – tylko fetch bez custom libs.
  // if (pathname !== "/api/auth/session") { ... fetch ... }

  return NextResponse.next();
}

// Matcher: middleware dla wszystkich ścieżek poza statyką (tu nadmiarowo,
// ale pokazuje intencję; możesz uprościć do ["/*"])
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons|images|assets).*)",
  ],
};

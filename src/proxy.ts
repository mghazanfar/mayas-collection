import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// English is served from the root (/products/x); Roman Urdu and Urdu keep their
// /roman and /ur prefixes. Internally every page lives under app/(shop)/[lang].
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const first = pathname.split("/")[1];

  if (first === "roman" || first === "ur") return NextResponse.next();

  // /en/... would duplicate the root URLs for search engines.
  if (first === "en") {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(3) || "/";
    return NextResponse.redirect(url, 308);
  }

  const url = request.nextUrl.clone();
  url.pathname = `/en${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  // Skip Next internals, API routes, the admin area and anything with a file extension.
  matcher: ["/((?!_next|api|admin|.*\\..*).*)"],
};

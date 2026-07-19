import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { resolvePlatformAccess } from "@/lib/platform-access";
import { ipAllowlistOk, rateLimitOk } from "@/lib/security";

function withSecurityHeaders(res: NextResponse) {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  if (!ipAllowlistOk(request)) {
    return withSecurityHeaders(
      new NextResponse("Forbidden — IP não autorizado", { status: 403 }),
    );
  }

  if (!rateLimitOk(request)) {
    return withSecurityHeaders(
      new NextResponse("Too Many Requests", { status: 429 }),
    );
  }

  const { user, supabaseResponse } = await updateSession(request);
  withSecurityHeaders(supabaseResponse);

  if (pathname === "/login") {
    if (user?.email) {
      const access = await resolvePlatformAccess(user.email);
      if (access.ok) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return withSecurityHeaders(NextResponse.redirect(url));
      }
    }
    return supabaseResponse;
  }

  if (pathname === "/unauthorized") {
    return supabaseResponse;
  }

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  const access = await resolvePlatformAccess(user.email);
  if (!access.ok) {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return withSecurityHeaders(NextResponse.redirect(url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};

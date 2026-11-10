import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "zoh_admin_session";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET || "default_zoh_session_secret_change_me_32char";
  return new TextEncoder().encode(secret.padEnd(32, "!"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/manage") ||
    pathname.startsWith("/api/admin");

  const isLoginPage = pathname === "/login";

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let isValid = false;

  if (sessionToken) {
    try {
      const key = getSecretKey();
      const { payload } = await jwtVerify(sessionToken, key, {
        algorithms: ["HS256"],
      });
      isValid = payload.role === "admin";
    } catch {
      isValid = false;
    }
  }

  // If trying to access protected route without valid session
  if (isProtectedRoute && !isValid) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and visiting /login, redirect to /dashboard
  if (isLoginPage && isValid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};


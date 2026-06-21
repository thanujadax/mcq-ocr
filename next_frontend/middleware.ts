import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface TokenData {
  sub: string;
  user_id: string;
  role: string;
  faculty_id: string;
  verify_status: string;
}

// Middleware runs server-side (Node/Edge runtime inside the container), so
// localhost:8000 wouldn't reach the backend container. Prefer the internal
// network hostname (set via INTERNAL_BACKEND_URL in compose) and fall back
// to the public URL only when the internal one isn't provided.
const BACKEND_URL =
  process.env.INTERNAL_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

if (!BACKEND_URL) {
  throw new Error(
    "Neither INTERNAL_BACKEND_URL nor NEXT_PUBLIC_BACKEND_URL is set."
  );
}

/**
 * Fetches user information from the backend using the access token
 * @param accessToken - The access token from cookies
 * @returns Promise<TokenData> - User information from the backend
 * @throws Error if the request fails
 */
async function fetchUserInfo(accessToken: string): Promise<TokenData> {
  const meResponse = await fetch(`${BACKEND_URL}/api/auth/me`, {
    headers: {
      cookie: `access_token=${accessToken}`,
    },
    credentials: "include",
  });

  if (!meResponse.ok) {
    throw new Error("Failed to fetch user info");
  }

  return (await meResponse.json()) as TokenData;
}

/**
 * Refreshes the access token using the refresh token
 * @param refreshToken - The refresh token from cookies
 * @returns Promise<NextResponse | null> - Response with new cookies or null if refresh failed
 */
async function refreshAccessToken(
  refreshToken: string
): Promise<NextResponse | null> {
  const refreshResponse = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { cookie: `refresh_token=${refreshToken}` },
  });

  if (refreshResponse.ok) {
    // Extract access_token and refresh_token and their config directly from backend response
    const setCookieString = refreshResponse.headers.get("set-cookie") || "";
    const cookies = setCookieString.split(/,(?=\s*\w+=)/); // split in case of multiple cookies

    const response = NextResponse.next();

    for (const cookieString of cookies) {
      if (
        /access_token=/.test(cookieString) ||
        /refresh_token=/.test(cookieString)
      ) {
        // Parse cookie name, value, and attributes
        const [cookiePair, ...attrPairs] = cookieString
          .split(";")
          .map((s) => s.trim());
        const [cookieName, cookieValue] = cookiePair.split("=");
        // Prepare options
        const options: any = {};
        attrPairs.forEach((attr) => {
          const [k, v] = attr.split("=");
          switch (k.toLowerCase()) {
            case "path":
              options.path = v || "/";
              break;
            case "secure":
              options.secure = true;
              break;
            case "httponly":
              options.httpOnly = true;
              break;
            case "samesite":
              options.sameSite = (v || "lax").toLowerCase();
              break;
            case "max-age":
              options.maxAge = parseInt(v);
              break;
            case "expires":
              options.expires = new Date(v);
              break;
          }
        });
        response.cookies.set(cookieName, cookieValue, options);
      }
    }

    if (/access_token=|refresh_token=/.test(setCookieString)) {
      return response;
    }
  }

  return null;
}

const protectedRoutes = [
  "/dashboard",
  "/generate-template",
  "/marking-jobs",
  "/templates",
  "/users",
  "/settings",
  "/auth/not-verified",
];
const publicRoutes = ["/auth/signin", "/auth/register"];

const facultyAdminNotAllowedRoutes = ["/settings"];
const basicUserNotAllowedRoutes = facultyAdminNotAllowedRoutes.concat([
  "/users",
]);
const superAdminNotAllowedRoutes = ["/marking-jobs", "/templates"];

function checkAccess(
  pathname: string,
  payload: TokenData
): { allowed: boolean; redirect?: string } {
  // If payload is a string, we can't inspect claims; fail closed (deny)
  if (typeof payload === "string")
    return { allowed: false, redirect: "/auth/signin" };

  const role = (payload.role as string) ?? "";
  const verifyStatus = (payload.verify_status as string) ?? "none";

  const isAdminVerified = verifyStatus === "admin_verified";

  // If user isn't admin-verified, only allow not-verified page
  if (!isAdminVerified) {
    if (pathname.startsWith("/auth/not-verified")) return { allowed: true };
    return { allowed: false, redirect: "/auth/not-verified" };
  }

  // Role-based route restrictions
  const notAllowedMap: Record<string, string[]> = {
    "Super User": superAdminNotAllowedRoutes,
    "Faculty Admin": facultyAdminNotAllowedRoutes,
    "Basic User": basicUserNotAllowedRoutes,
  };

  const disallowed = (notAllowedMap[role] ?? []).some((route) =>
    pathname.startsWith(route)
  );

  if (disallowed) return { allowed: false, redirect: "/" };

  return { allowed: true };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;

  // If public route and already logged in
  if (publicRoutes.includes(pathname) && accessToken) {
    try {
      return NextResponse.redirect(new URL("/", req.url));
    } catch {
      // token expired — still redirect to dashboard after refresh
    }
  }

  // If protected route
  if (
    pathname === "/" ||
    protectedRoutes.some((route) => pathname.startsWith(route))
  ) {
    if (!accessToken && !refreshToken) {
      return NextResponse.redirect(new URL("/auth/signin", req.url));
    }
    if (accessToken) {
      try {
        // Use the reusable function to fetch user info
        const payload = await fetchUserInfo(accessToken);
        const { allowed, redirect } = checkAccess(pathname, payload);
        if (allowed) return NextResponse.next();
        return NextResponse.redirect(new URL(redirect ?? "/", req.url));
      } catch {
        const res = await refreshAccessToken(refreshToken!);
        if (res) {
          const payload = await fetchUserInfo(accessToken);
          const { allowed, redirect } = checkAccess(pathname, payload);
          if (allowed) return res;
        }
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }
    }
  }

  // Default
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"], // apply to all routes except assets
};

import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

  const isPublicRoute =
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/_next") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg");

  if (isPublicRoute) {
    if (session?.user && (pathname === "/" || pathname === "/login" || pathname === "/signup")) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      if (profile?.role === "teacher") {
        return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
      }
      if (profile?.role === "parent") {
        return NextResponse.redirect(new URL("/parent/dashboard", request.url));
      }
    }
    return response;
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .eq("is_active", true)
    .single();

  if (!profile) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const roleRedirectMap: Record<string, string> = {
    admin: "/admin/dashboard",
    teacher: "/teacher/dashboard",
    parent: "/parent/dashboard",
  };

  if (pathname.startsWith("/admin") && profile.role !== "admin") {
    return NextResponse.redirect(new URL(roleRedirectMap[profile.role] || "/login", request.url));
  }

  if (pathname.startsWith("/teacher") && profile.role !== "teacher") {
    return NextResponse.redirect(new URL(roleRedirectMap[profile.role] || "/login", request.url));
  }

  if (pathname.startsWith("/parent") && profile.role !== "parent") {
    return NextResponse.redirect(new URL(roleRedirectMap[profile.role] || "/login", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
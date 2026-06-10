import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isAuthPage = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isOrganizerRoute = nextUrl.pathname.startsWith("/organizer");
  const isParticipantRoute = nextUrl.pathname.startsWith("/participant");

  // 1. If user is on an auth page (/login or /register) and is already logged in,
  // redirect them to their respective dashboard.
  if (isAuthPage && isLoggedIn) {
    if (userRole === "participant") {
      return Response.redirect(new URL("/participant/dashboard", nextUrl));
    }
    if (userRole === "organizer") {
      return Response.redirect(new URL("/organizer/dashboard", nextUrl));
    }
    if (userRole === "admin" || userRole === "superuser") {
      return Response.redirect(new URL("/admin/dashboard", nextUrl));
    }
    // Fallback if role is not set
    return Response.redirect(new URL("/participant/dashboard", nextUrl));
  }

  // 2. If user is accessing protected routes and is NOT logged in, redirect to login
  if ((isAdminRoute || isOrganizerRoute || isParticipantRoute) && !isLoggedIn) {
    let from = nextUrl.pathname;
    if (nextUrl.search) {
      from += nextUrl.search;
    }
    return Response.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(from)}`, nextUrl)
    );
  }

  // 3. If logged in, enforce role boundaries
  if (isLoggedIn) {
    if (isAdminRoute && userRole !== "admin" && userRole !== "superuser") {
      if (userRole === "organizer") {
        return Response.redirect(new URL("/organizer/dashboard", nextUrl));
      }
      return Response.redirect(new URL("/participant/dashboard", nextUrl));
    }

    if (isOrganizerRoute && userRole !== "organizer") {
      if (userRole === "admin" || userRole === "superuser") {
        return Response.redirect(new URL("/admin/dashboard", nextUrl));
      }
      return Response.redirect(new URL("/participant/dashboard", nextUrl));
    }

    if (isParticipantRoute && userRole !== "participant") {
      if (userRole === "admin" || userRole === "superuser") {
        return Response.redirect(new URL("/admin/dashboard", nextUrl));
      }
      if (userRole === "organizer") {
        return Response.redirect(new URL("/organizer/dashboard", nextUrl));
      }
    }

    // 4. If profile is incomplete, force redirect to profile setup page
    if (req.auth?.user?.isProfileComplete === false) {
      if (userRole === "participant" && nextUrl.pathname !== "/participant/profile") {
        return Response.redirect(new URL("/participant/profile", nextUrl));
      }
      if (userRole === "organizer" && nextUrl.pathname !== "/organizer/profile") {
        return Response.redirect(new URL("/organizer/profile", nextUrl));
      }
    }
  }
});

export const config = {
  matcher: [
    "/login",
    "/register",
    "/admin/:path*",
    "/organizer/:path*",
    "/participant/:path*",
  ],
};

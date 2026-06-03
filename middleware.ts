import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Role-based route protection. Unauthenticated users are sent to /login;
// authenticated users hitting a section that doesn't match their role are
// redirected to their own home.
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    const home =
      role === "ADMIN"
        ? "/admin"
        : role === "INSTRUCTOR"
          ? "/instructor"
          : "/dashboard";

    if (pathname.startsWith("/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL(home, req.url));
    }
    if (pathname.startsWith("/instructor") && role !== "INSTRUCTOR") {
      return NextResponse.redirect(new URL(home, req.url));
    }
    if (
      (pathname.startsWith("/dashboard") || pathname.startsWith("/learn")) &&
      role !== "STUDENT"
    ) {
      return NextResponse.redirect(new URL(home, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/learn/:path*",
    "/instructor/:path*",
    "/admin/:path*",
  ],
};

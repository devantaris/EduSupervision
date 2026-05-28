import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, importSPKI } from "jose";

// Standard development public key (SubjectPublicKeyInfo PEM)
// In production, this is loaded from process.env.JWT_PUBLIC_KEY
const DEV_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApFHEBA3Zd2KUAuu8wwKV
4ovkVMlP3am9XSG/zs61p4NczhH4vsPARYCyNInnbTKY91fEowMD8gJky9UrIKoQ
9KwNXGjW3MjMEjav9rgX/kqApk9IMK9KDI+gsg7BSeh7MKnabnha/4fa9H+ZZNnS
xGwmjrXBjYxlS2gfkr8FTXSM9+W5xQ9mozQrGPWDvHbuRBb43O+Eji5mofuIE2t3
Mlikn2bKRLQpi4nfm71OO5SHlTUwOgpRsHc+/dCy9TveG7xk5fV5b/SKrY6PBJqG
87pCH/ApIZ4ZFDP2CIgAtxDXk4zexVDfRfgNYuLsedhyfmXr/wz7RtPTe+sQUmwt
bQIDAQAB
-----END PUBLIC KEY-----`;

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("refresh_token")?.value;
  const { pathname } = request.nextUrl;

  // 1. Redirect if token is missing
  if (!token) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/teacher")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  try {
    // Import the public key PEM to CryptoKey
    let pem = process.env.JWT_PUBLIC_KEY || DEV_PUBLIC_KEY_PEM;
    pem = pem.replace(/\\n/g, "\n");
    const publicKey = await importSPKI(pem, "RS256");

    // Verify refresh token signature & claims
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ["RS256"],
    });

    // 2. Safeguard admin paths
    if (pathname.startsWith("/admin")) {
      if (payload.role !== "InstitutionAdmin" && payload.role !== "SuperAdmin") {
        return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
      }
    }

    // 3. Safeguard teacher paths
    if (pathname.startsWith("/teacher")) {
      if (payload.role !== "Teacher") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }

    // 4. Redirect logged-in users away from auth pages
    if (pathname === "/login" || pathname.startsWith("/register")) {
      if (payload.role === "Teacher") {
        return NextResponse.redirect(new URL("/teacher/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
    }

    // Pass claims as downstream request headers for API consumption
    const response = NextResponse.next();
    response.headers.set("X-User-Id", payload.sub || "");
    response.headers.set("X-User-Role", (payload.role as string) || "");
    return response;
  } catch (error) {
    console.error("Next.js Edge Auth Validation Failed:", error);
    
    // Clear cookie on invalid/expired session and redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("refresh_token");
    return response;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/login",
    "/register/:path*",
  ],
};

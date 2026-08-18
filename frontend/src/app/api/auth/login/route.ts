import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Proxy request to the backend FastAPI server
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
    
    let fastapiRes: Response;
    try {
      fastapiRes = await fetch(`${backendUrl}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000), // 8-second timeout to prevent infinite hang
      });
    } catch (networkErr: unknown) {
      const isTimeout = networkErr instanceof Error && networkErr.name === "TimeoutError";
      return NextResponse.json(
        {
          error: isTimeout
            ? "Backend connection timed out. Please verify that the backend server is running and BACKEND_INTERNAL_URL is set in Vercel settings."
            : "Cannot reach backend API server. Please ensure the backend is deployed and BACKEND_INTERNAL_URL is configured in Vercel.",
        },
        { status: 503 }
      );
    }

    if (!fastapiRes.ok) {
      const errorData = await fastapiRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Authentication failed" },
        { status: fastapiRes.status }
      );
    }

    const { access_token, refresh_token, expires_in, user } = await fastapiRes.json();

    // Setup client response
    const response = NextResponse.json({ access_token, expires_in, user });

    // Set refresh token as secure HttpOnly cookie
    response.cookies.set("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (error) {
    console.error("Login Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

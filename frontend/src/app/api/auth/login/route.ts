import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Proxy request to the backend FastAPI server
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
    const fastapiRes = await fetch(`${backendUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

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

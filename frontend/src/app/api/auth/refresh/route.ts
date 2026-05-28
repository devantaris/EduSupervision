import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Session expired or missing refresh token" },
        { status: 401 }
      );
    }

    // Call FastAPI refresh endpoint
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
    const fastapiRes = await fetch(`${backendUrl}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!fastapiRes.ok) {
      const errorData = await fastapiRes.json().catch(() => ({}));
      
      // Clear cookies if token rotation failed
      const response = NextResponse.json(
        { error: errorData.detail || "Failed to refresh token" },
        { status: fastapiRes.status }
      );
      response.cookies.delete("refresh_token");
      return response;
    }

    const { access_token, refresh_token, expires_in, user } = await fastapiRes.json();

    const response = NextResponse.json({ access_token, expires_in, user });

    // Reset HttpOnly cookie with rotated refresh token
    response.cookies.set("refresh_token", refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth/refresh",
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    return response;
  } catch (error) {
    console.error("Refresh Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

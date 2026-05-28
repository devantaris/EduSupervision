import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (refreshToken) {
      // Invalidate on FastAPI backend
      const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
      await fetch(`${backendUrl}/api/v1/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      }).catch((err) => {
        console.error("Failed to notify backend logout:", err);
      });
    }

    const response = NextResponse.json({ message: "Logged out successfully" });
    
    // Delete session cookies on browser client
    response.cookies.delete("refresh_token");

    return response;
  } catch (error) {
    console.error("Logout Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, first_name, last_name, employee_id, password } = body;

    if (!token) {
      return NextResponse.json(
        { error: "Registration token is required" },
        { status: 400 }
      );
    }
    
    // Proxy request to the backend FastAPI server
    const backendUrl = process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:8000";
    let fastapiRes: Response;
    try {
      fastapiRes = await fetch(`${backendUrl}/api/v1/teachers/register/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ first_name, last_name, employee_id, password }),
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      return NextResponse.json(
        { error: "Cannot reach backend server. Please verify BACKEND_INTERNAL_URL." },
        { status: 503 }
      );
    }

    if (!fastapiRes.ok) {
      const errorData = await fastapiRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Registration failed" },
        { status: fastapiRes.status }
      );
    }

    const data = await fastapiRes.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Register Proxy Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

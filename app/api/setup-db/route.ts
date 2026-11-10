import { NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";

export async function POST() {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const success = await initDatabase();
    if (success) {
      return NextResponse.json({
        success: true,
        message: "Database schema (urls table & index) initialized successfully.",
      });
    } else {
      return NextResponse.json(
        {
          error:
            "Failed to initialize database. Ensure DATABASE_URL is configured in .env.local",
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}


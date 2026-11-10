import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    return NextResponse.json(
      {
        status: "NOT_CONFIGURED",
        message:
          "DATABASE_URL environment variable is missing in this environment (e.g. Netlify).",
        has_database_url: false,
      },
      { status: 200 }
    );
  }

  const sql = getDb();
  if (!sql) {
    return NextResponse.json(
      {
        status: "INVALID_FORMAT",
        message:
          "DATABASE_URL is defined, but format is invalid or contains placeholders (YOUR_PASSWORD).",
        has_database_url: true,
      },
      { status: 200 }
    );
  }

  try {
    // Test basic query
    await sql`SELECT 1 as ping;`;

    // Check table rows count
    let urlsCount = 0;
    try {
      const countRes = (await sql`SELECT count(*)::int as count FROM urls;`) as unknown as { count: number }[];
      urlsCount = countRes[0]?.count || 0;
    } catch {
      // Table might not exist yet
    }

    // Mask URL host for safe display
    const masked = rawUrl.replace(/:[^:@]+@/, ":***@").replace(/\?.*/, "");

    return NextResponse.json({
      status: "CONNECTED",
      message: "Neon PostgreSQL Database is connected and operational!",
      connection_endpoint: masked,
      urls_stored_in_db: urlsCount,
      environment: process.env.NODE_ENV || "unknown",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "CONNECTION_FAILED",
        error_message: error?.message || "Unknown database error",
        message:
          "DATABASE_URL is set, but Neon PostgreSQL rejected the connection. Check credentials and sslmode in Netlify.",
      },
      { status: 500 }
    );
  }
}


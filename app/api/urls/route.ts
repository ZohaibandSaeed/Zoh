import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import {
  isSlugAvailable,
  createUrl,
  getAllUrls,
} from "@/lib/db";
import {
  isValidUrl,
  normalizeUrl,
  sanitizeSlug,
  isReservedSlug,
} from "@/lib/validation";

// GET /api/urls
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const checkSlugParam = searchParams.get("checkSlug");

  // Slug availability check
  if (checkSlugParam) {
    const cleaned = sanitizeSlug(checkSlugParam);
    if (!cleaned) {
      return NextResponse.json({ available: false, reason: "Invalid slug" });
    }
    if (isReservedSlug(cleaned)) {
      return NextResponse.json({
        available: false,
        reason: "Reserved system slug",
      });
    }
    const available = await isSlugAvailable(cleaned);
    return NextResponse.json({
      available,
      slug: cleaned,
      reason: available ? "Available" : "Already taken",
    });
  }

  // Fetch all URLs
  try {
    const urls = await getAllUrls();
    return NextResponse.json({ urls });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to fetch URLs" },
      { status: 500 }
    );
  }
}

// POST /api/urls (Protected: Create Short URL)
export async function POST(request: Request) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json(
      { error: "Unauthorized. Please login with your 6-digit PIN." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { original_url, slug } = body;

    if (!original_url || typeof original_url !== "string") {
      return NextResponse.json(
        { error: "Destination URL is required." },
        { status: 400 }
      );
    }

    const normalizedUrl = normalizeUrl(original_url);
    if (!isValidUrl(normalizedUrl)) {
      return NextResponse.json(
        { error: "Please enter a valid HTTP or HTTPS destination URL." },
        { status: 400 }
      );
    }

    if (!slug || typeof slug !== "string") {
      return NextResponse.json(
        { error: "Custom short slug is required." },
        { status: 400 }
      );
    }

    const cleanedSlug = sanitizeSlug(slug);

    if (cleanedSlug.length < 2) {
      return NextResponse.json(
        { error: "Custom slug must be at least 2 characters long." },
        { status: 400 }
      );
    }

    if (cleanedSlug.length > 80) {
      return NextResponse.json(
        { error: "Custom slug cannot exceed 80 characters." },
        { status: 400 }
      );
    }

    if (isReservedSlug(cleanedSlug)) {
      return NextResponse.json(
        {
          error: `The slug "${cleanedSlug}" is reserved by the system. Please choose a different name.`,
        },
        { status: 400 }
      );
    }

    const available = await isSlugAvailable(cleanedSlug);
    if (!available) {
      return NextResponse.json(
        {
          error: `The short URL "zinks.netlify.app/${cleanedSlug}" already exists in the database. Please pick another name.`,
        },
        { status: 409 }
      );
    }

    const created = await createUrl(normalizedUrl, cleanedSlug);

    return NextResponse.json(
      {
        success: true,
        message: "Short URL created successfully!",
        url: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create URL error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create short URL." },
      { status: 500 }
    );
  }
}


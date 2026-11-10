import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getUrlById, updateUrl, deleteUrl, isSlugAvailable } from "@/lib/db";
import {
  isValidUrl,
  normalizeUrl,
  sanitizeSlug,
  isReservedSlug,
} from "@/lib/validation";

interface RouteParams {
  params: {
    id: string;
  };
}

// PATCH /api/urls/[id] - Update URL (slug or destination)
export async function PATCH(request: Request, { params }: RouteParams) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid URL ID" }, { status: 400 });
  }

  const existing = await getUrlById(id);
  if (!existing) {
    return NextResponse.json({ error: "URL not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { original_url, slug } = body;

    const updatePayload: { original_url?: string; slug?: string } = {};

    // Validate original_url if provided
    if (original_url !== undefined) {
      const normalized = normalizeUrl(original_url);
      if (!isValidUrl(normalized)) {
        return NextResponse.json(
          { error: "Please enter a valid destination HTTP/HTTPS URL." },
          { status: 400 }
        );
      }
      updatePayload.original_url = normalized;
    }

    // Validate slug if provided
    if (slug !== undefined) {
      const cleaned = sanitizeSlug(slug);
      if (cleaned.length < 2) {
        return NextResponse.json(
          { error: "Short slug must be at least 2 characters long." },
          { status: 400 }
        );
      }

      if (isReservedSlug(cleaned)) {
        return NextResponse.json(
          { error: `The slug "${cleaned}" is reserved by the system.` },
          { status: 400 }
        );
      }

      // If slug actually changed, check uniqueness
      if (cleaned.toLowerCase() !== existing.slug.toLowerCase()) {
        const available = await isSlugAvailable(cleaned);
        if (!available) {
          return NextResponse.json(
            { error: `The short slug "${cleaned}" is already taken.` },
            { status: 409 }
          );
        }
      }

      updatePayload.slug = cleaned;
    }

    const updated = await updateUrl(id, updatePayload);
    if (!updated) {
      return NextResponse.json(
        { error: "Failed to update URL in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Short link updated successfully",
      url: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/urls/[id] - Delete URL
export async function DELETE(request: Request, { params }: RouteParams) {
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid URL ID" }, { status: 400 });
  }

  const existing = await getUrlById(id);
  if (!existing) {
    return NextResponse.json({ error: "URL not found" }, { status: 404 });
  }

  const success = await deleteUrl(id);
  if (!success) {
    return NextResponse.json(
      { error: "Failed to delete URL from database." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Short URL deleted successfully",
  });
}


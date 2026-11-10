import { notFound, redirect } from "next/navigation";
import { getUrlBySlug, incrementClicks } from "@/lib/db";
import { sanitizeSlug, isReservedSlug } from "@/lib/validation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: {
    slug: string;
  };
}

export default async function SlugRedirectPage({ params }: PageProps) {
  const rawSlug = params.slug;

  if (!rawSlug) {
    notFound();
  }

  const cleanedSlug = sanitizeSlug(rawSlug);

  if (isReservedSlug(cleanedSlug)) {
    notFound();
  }

  const record = await getUrlBySlug(cleanedSlug);

  if (!record || !record.original_url) {
    notFound();
  }

  // Increment click count in database and wait for it before redirecting
  try {
    await incrementClicks(cleanedSlug);
  } catch (err) {
    console.error("Failed to increment clicks:", err);
  }

  // Redirect to destination
  redirect(record.original_url);
}


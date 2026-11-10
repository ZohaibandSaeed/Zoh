import { neon } from "@neondatabase/serverless";
import type { UrlRecord } from "./types";
export type { UrlRecord } from "./types";

const connectionString = process.env.DATABASE_URL;

export const isDbReady = Boolean(
  connectionString &&
  !connectionString.includes("YOUR_PASSWORD") &&
  connectionString.startsWith("postgres")
);

// Fallback in-memory store for development/preview when Neon DB credentials are not yet configured
interface InMemoryUrl {
  id: number;
  original_url: string;
  slug: string;
  clicks: number;
  created_at: string;
  updated_at: string;
}

const globalForUrls = globalThis as unknown as {
  inMemoryUrls?: InMemoryUrl[];
  inMemorySettings?: Record<string, string>;
  idCounter?: number;
};

if (!globalForUrls.inMemoryUrls) {
  globalForUrls.inMemoryUrls = [];
  globalForUrls.inMemorySettings = {
    admin_pin: process.env.ADMIN_PIN || "123456",
  };
  globalForUrls.idCounter = 1;
}

export const sql = isDbReady
  ? neon(connectionString!)
  : (async () => {
    throw new Error(
      "DATABASE_URL is not set or contains placeholders. Please set your Neon DB connection string."
    );
  }) as unknown as ReturnType<typeof neon>;

/**
 * Initializes the database tables if they do not already exist.
 */
export async function initDatabase(): Promise<boolean> {
  if (!isDbReady) return false;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        original_url TEXT NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        clicks INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_urls_slug ON urls(slug);
    `;
    // Create settings table for dynamic admin configuration (e.g. admin_pin)
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    const defaultPin = (process.env.ADMIN_PIN || "123456").trim();
    await sql`
      INSERT INTO settings (key, value)
      VALUES ('admin_pin', ${defaultPin})
      ON CONFLICT (key) DO NOTHING;
    `;
    return true;
  } catch (error) {
    console.error("Failed to initialize database tables:", error);
    return false;
  }
}

/**
 * Fetch a setting value from DB (or fallback store)
 */
export async function getSetting(key: string): Promise<string | null> {
  if (isDbReady) {
    try {
      await initDatabase();
      const rows = (await sql`
        SELECT value FROM settings WHERE key = ${key} LIMIT 1;
      `) as unknown as { value: string }[];
      return rows && rows.length > 0 ? rows[0].value : null;
    } catch (err) {
      console.error(`Error reading setting "${key}" from DB:`, err);
      return null;
    }
  }

  return globalForUrls.inMemorySettings?.[key] || null;
}

/**
 * Update or insert a setting in DB (or fallback store)
 */
export async function setSetting(key: string, value: string): Promise<boolean> {
  if (isDbReady) {
    try {
      await initDatabase();
      await sql`
        INSERT INTO settings (key, value, updated_at)
        VALUES (${key}, ${value}, NOW())
        ON CONFLICT (key)
        DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();
      `;
      return true;
    } catch (err) {
      console.error(`Error saving setting "${key}" in DB:`, err);
      return false;
    }
  }

  if (!globalForUrls.inMemorySettings) {
    globalForUrls.inMemorySettings = {};
  }
  globalForUrls.inMemorySettings[key] = value;
  return true;
}

/**
 * Check if a slug already exists in DB
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  if (isDbReady) {
    try {
      await initDatabase();
      const records = (await sql`
        SELECT id FROM urls WHERE LOWER(slug) = LOWER(${slug}) LIMIT 1;
      `) as unknown as any[];
      return Array.isArray(records) && records.length === 0;
    } catch (err) {
      console.error("Error checking slug in DB:", err);
      return false;
    }
  }

  // Fallback to in-memory store
  const match = globalForUrls.inMemoryUrls?.find(
    (u) => u.slug.toLowerCase() === slug.toLowerCase()
  );
  return !match;
}

/**
 * Create a new short URL entry
 */
export async function createUrl(
  originalUrl: string,
  slug: string
): Promise<UrlRecord> {
  if (isDbReady) {
    await initDatabase();
    const rows = (await sql`
      INSERT INTO urls (original_url, slug)
      VALUES (${originalUrl}, ${slug})
      RETURNING id, original_url, slug, clicks, created_at, updated_at;
    `) as unknown as UrlRecord[];
    return rows[0];
  }

  // Fallback to in-memory store
  const record: InMemoryUrl = {
    id: (globalForUrls.idCounter = (globalForUrls.idCounter || 0) + 1),
    original_url: originalUrl,
    slug: slug,
    clicks: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  globalForUrls.inMemoryUrls?.unshift(record);
  return record as UrlRecord;
}

/**
 * Fetch a URL record by slug
 */
export async function getUrlBySlug(slug: string): Promise<UrlRecord | null> {
  if (isDbReady) {
    try {
      const rows = (await sql`
        SELECT id, original_url, slug, clicks, created_at, updated_at
        FROM urls
        WHERE LOWER(slug) = LOWER(${slug})
        LIMIT 1;
      `) as unknown as UrlRecord[];
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error("Error fetching slug from DB:", err);
      return null;
    }
  }

  const match = globalForUrls.inMemoryUrls?.find(
    (u) => u.slug.toLowerCase() === slug.toLowerCase()
  );
  return (match as UrlRecord) || null;
}

/**
 * Increment click count for a given slug
 */
export async function incrementClicks(slug: string): Promise<void> {
  if (isDbReady) {
    try {
      await sql`
        UPDATE urls
        SET clicks = clicks + 1, updated_at = NOW()
        WHERE LOWER(slug) = LOWER(${slug});
      `;
    } catch (err) {
      console.error("Error incrementing click count in DB:", err);
    }
    return;
  }

  const match = globalForUrls.inMemoryUrls?.find(
    (u) => u.slug.toLowerCase() === slug.toLowerCase()
  );
  if (match) {
    match.clicks += 1;
    match.updated_at = new Date().toISOString();
  }
}

/**
 * Fetch all URLs (sorted by newest first)
 */
export async function getAllUrls(): Promise<UrlRecord[]> {
  if (isDbReady) {
    try {
      await initDatabase();
      const rows = (await sql`
        SELECT id, original_url, slug, clicks, created_at, updated_at
        FROM urls
        ORDER BY created_at DESC;
      `) as unknown as UrlRecord[];
      return rows || [];
    } catch (err) {
      console.error("Error fetching all URLs from DB:", err);
      return [];
    }
  }

  return (globalForUrls.inMemoryUrls || []) as UrlRecord[];
}

/**
 * Fetch a URL by its numeric ID
 */
export async function getUrlById(id: number): Promise<UrlRecord | null> {
  if (isDbReady) {
    try {
      const rows = (await sql`
        SELECT id, original_url, slug, clicks, created_at, updated_at
        FROM urls
        WHERE id = ${id}
        LIMIT 1;
      `) as unknown as UrlRecord[];
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error("Error fetching URL by id:", err);
      return null;
    }
  }

  const match = globalForUrls.inMemoryUrls?.find((u) => u.id === id);
  return (match as UrlRecord) || null;
}

/**
 * Update an existing URL (rename slug or destination URL)
 */
export async function updateUrl(
  id: number,
  data: { original_url?: string; slug?: string }
): Promise<UrlRecord | null> {
  if (isDbReady) {
    try {
      const existing = await getUrlById(id);
      if (!existing) return null;

      const newUrl = data.original_url || existing.original_url;
      const newSlug = data.slug || existing.slug;

      const rows = (await sql`
        UPDATE urls
        SET original_url = ${newUrl}, slug = ${newSlug}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, original_url, slug, clicks, created_at, updated_at;
      `) as unknown as UrlRecord[];

      return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error("Error updating URL in DB:", err);
      return null;
    }
  }

  const match = globalForUrls.inMemoryUrls?.find((u) => u.id === id);
  if (match) {
    if (data.original_url) match.original_url = data.original_url;
    if (data.slug) match.slug = data.slug;
    match.updated_at = new Date().toISOString();
    return match as UrlRecord;
  }
  return null;
}

/**
 * Delete a URL by ID
 */
export async function deleteUrl(id: number): Promise<boolean> {
  if (isDbReady) {
    try {
      await sql`
        DELETE FROM urls WHERE id = ${id};
      `;
      return true;
    } catch (err) {
      console.error("Error deleting URL from DB:", err);
      return false;
    }
  }

  const idx = globalForUrls.inMemoryUrls?.findIndex((u) => u.id === id);
  if (idx !== undefined && idx !== -1) {
    globalForUrls.inMemoryUrls?.splice(idx, 1);
    return true;
  }
  return false;
}

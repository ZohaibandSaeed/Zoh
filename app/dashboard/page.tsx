"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Link2,
  ExternalLink,
  Copy,
  Check,
  PlusCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  Globe,
  Settings,
  AlertTriangle,
  Database,
} from "lucide-react";
import { sanitizeSlug, isValidUrl, normalizeUrl, isReservedSlug } from "@/lib/validation";

interface CreatedUrlResult {
  id: number;
  original_url: string;
  slug: string;
  created_at: string;
}

export default function DashboardPage() {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [slugStatus, setSlugStatus] = useState<"idle" | "checking" | "available" | "taken" | "reserved">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<CreatedUrlResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [dbStatus, setDbStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  // App base URL for display
  const [displayHost, setDisplayHost] = useState("zinks.netlify.app");

  useEffect(() => {
    // Check live database connection status
    fetch("/api/db-status")
      .then((res) => res.json())
      .then((data) => {
        setDbStatus(data.status === "CONNECTED" ? "connected" : "disconnected");
      })
      .catch(() => setDbStatus("disconnected"));

    if (typeof window !== "undefined") {
      // If running on netlify or localhost, adapt display domain
      const host = window.location.host;
      if (host.includes("localhost")) {
        setDisplayHost(host);
      } else {
        setDisplayHost("zinks.netlify.app");
      }
    }
  }, []);

  // Real-time debounce check for slug availability
  useEffect(() => {
    const cleaned = sanitizeSlug(customSlug);
    if (!cleaned) {
      setSlugStatus("idle");
      return;
    }

    if (isReservedSlug(cleaned)) {
      setSlugStatus("reserved");
      return;
    }

    setSlugStatus("checking");
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(`/api/urls?checkSlug=${encodeURIComponent(cleaned)}`);
        if (res.ok) {
          const data = await res.json();
          setSlugStatus(data.available ? "available" : "taken");
        } else {
          setSlugStatus("idle");
        }
      } catch {
        setSlugStatus("idle");
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [customSlug]);

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Live sanitize characters (spaces to dashes, lowercased)
    const raw = e.target.value;
    const cleaned = raw.toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "");
    setCustomSlug(cleaned);
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = normalizeUrl(originalUrl);
    if (!isValidUrl(normalized)) {
      setError("Please provide a valid destination URL (e.g. https://google.com).");
      return;
    }

    const cleaned = sanitizeSlug(customSlug);
    if (!cleaned || cleaned.length < 2) {
      setError("Custom short slug must be at least 2 characters long.");
      return;
    }

    if (slugStatus === "reserved") {
      setError(`The slug "${cleaned}" is a system reserved path. Please choose another.`);
      return;
    }

    if (slugStatus === "taken") {
      setError(`The short URL "${displayHost}/${cleaned}" is already taken in the database.`);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/urls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_url: normalized,
          slug: cleaned,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create short URL.");
      } else {
        setCreatedUrl(data.url);
        setOriginalUrl("");
        setCustomSlug("");
        setSlugStatus("idle");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-6 py-6 sm:py-10">
      {/* Header section */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] sm:text-xs font-semibold border border-blue-200/60">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Shortener Studio</span>
            </div>

            {dbStatus === "connected" && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] sm:text-xs font-semibold border border-emerald-200/60">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Neon DB Live</span>
              </div>
            )}
            {dbStatus === "disconnected" && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] sm:text-xs font-semibold border border-amber-200/60">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span>DB Not Connected in Netlify</span>
              </div>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Custom Short Link
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Specify your destination and pick your exact custom slug.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/list"
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
          >
            Public List
          </Link>
          <Link
            href="/manage"
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Manage URLs</span>
          </Link>
        </div>
      </div>

      {/* Disconnected Database Alert */}
      {dbStatus === "disconnected" && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3 shadow-sm">
          <Database className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">Database Connection Required in Netlify</p>
            <p className="mt-1 text-amber-800 leading-relaxed">
              Your Neon Database URL is not detected by Netlify. To save links permanently to your database, add{" "}
              <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono font-semibold">DATABASE_URL</code> in{" "}
              <strong>Netlify Dashboard &rarr; Site configuration &rarr; Environment variables</strong>, then trigger a deploy.
            </p>
          </div>
        </div>
      )}

      {/* Success Notification Banner */}
      {createdUrl && (
        <div className="mb-6 sm:mb-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-xl shadow-emerald-500/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
                <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Link Generated!</span>
              </div>
              <h2 className="text-lg sm:text-2xl font-black font-mono tracking-tight break-all">
                {displayHost}/{createdUrl.slug}
              </h2>
              <p className="text-emerald-100 text-xs mt-1 truncate max-w-lg">
                Redirects to: {createdUrl.original_url}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <button
                onClick={() =>
                  copyToClipboard(`${typeof window !== "undefined" ? window.location.origin : ""}/${createdUrl.slug}`)
                }
                className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>

              <a
                href={`/${createdUrl.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 sm:p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all"
                title="Test Redirect"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                onClick={() => setCreatedUrl(null)}
                className="px-3 py-2 sm:px-3 sm:py-2.5 rounded-xl bg-emerald-700/50 hover:bg-emerald-700 text-xs text-white transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shorten Form Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-sm">
        <form onSubmit={handleCreate} className="space-y-4 sm:space-y-6">
          {/* Destination URL Input */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 sm:mb-2">
              Destination URL <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type="text"
                required
                value={originalUrl}
                onChange={(e) => {
                  setOriginalUrl(e.target.value);
                  setError(null);
                }}
                placeholder="https://example.com/my-long-link"
                className="w-full pl-9 sm:pl-11 pr-3 sm:pr-4 py-3 sm:py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs sm:text-sm focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all font-mono placeholder:font-sans"
              />
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 sm:mt-1.5">
              The full webpage URL that people will be redirected to.
            </p>
          </div>

          {/* Custom Slug Input */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 sm:mb-2">
              Custom Short Slug <span className="text-rose-500">*</span>
            </label>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-2 sm:focus-within:ring-4 focus-within:ring-blue-100 transition-all overflow-hidden">
              <span className="inline-flex items-center px-2.5 sm:px-4 border-r border-slate-200 bg-slate-100 text-slate-600 text-xs sm:text-sm font-mono select-none flex-shrink-0">
                <span className="inline sm:hidden">zinks/</span>
                <span className="hidden sm:inline">{displayHost}/</span>
              </span>
              <input
                type="text"
                required
                value={customSlug}
                onChange={handleSlugChange}
                placeholder="my-custom-name"
                className="w-full px-3 sm:px-4 py-3 sm:py-3.5 bg-transparent text-slate-900 text-xs sm:text-sm font-mono focus:outline-none placeholder:font-sans"
              />
            </div>

            {/* Slug status preview indicator */}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs gap-1">
              <span className="text-slate-400">
                Alphanumeric characters and hyphens allowed.
              </span>

              {customSlug.length >= 2 && (
                <div>
                  {slugStatus === "checking" && (
                    <span className="inline-flex items-center gap-1 text-slate-500">
                      <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-spin" />
                      Checking availability...
                    </span>
                  )}
                  {slugStatus === "available" && (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                      <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Slug is available!
                    </span>
                  )}
                  {slugStatus === "taken" && (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                      <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      Already taken in database
                    </span>
                  )}
                  {slugStatus === "reserved" && (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold">
                      <AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      System reserved keyword
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              loading ||
              !originalUrl.trim() ||
              !customSlug.trim() ||
              slugStatus === "taken" ||
              slugStatus === "reserved"
            }
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Checking Database &amp; Creating...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5" />
                <span>Generate Short URL</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

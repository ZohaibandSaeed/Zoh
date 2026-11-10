"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ListOrdered,
  Search,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Link2,
  TrendingUp,
  LogIn,
  Loader2,
  Globe2,
} from "lucide-react";
import { UrlRecord } from "@/lib/types";

export default function PublicListPage() {
  const [urls, setUrls] = useState<UrlRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [displayHost, setDisplayHost] = useState("zinks.netlify.app");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.host;
      if (host.includes("localhost")) {
        setDisplayHost(host);
      } else {
        setDisplayHost("zinks.netlify.app");
      }
    }
    fetchPublicUrls();
  }, []);

  const fetchPublicUrls = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/urls");
      if (res.ok) {
        const data = await res.json();
        setUrls(data.urls || []);
      }
    } catch (err) {
      console.error("Failed to fetch public URLs:", err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (id: number, slug: string) => {
    const fullUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/${slug}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const filteredUrls = urls.filter(
    (u) =>
      u.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.original_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClicks = urls.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 py-5 sm:py-8">
      {/* Clean Minimal Header */}
      <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] sm:text-xs font-semibold border border-blue-200/60 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Public Directory</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Short Links Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Browse and redirect to links created across <code className="text-blue-600 font-mono font-medium">{displayHost}</code>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Create Short Link</span>
          </Link>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by slug or destination URL..."
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all shadow-sm"
          />
        </div>

        <div className="text-[11px] sm:text-xs text-slate-500 font-medium flex items-center gap-1 self-end sm:self-center">
          <span>Showing</span>
          <strong className="text-slate-900">{filteredUrls.length}</strong>
          <span>of {urls.length} links</span>
        </div>
      </div>

      {/* URLs Grid / List */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-20 text-center shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading public links directory...</p>
        </div>
      ) : filteredUrls.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
            <Link2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {searchTerm ? "No short URLs match your search" : "No links in directory yet"}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {searchTerm
              ? "Try searching for a different keyword or domain."
              : "Login with your admin passcode to create the first short link."}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Admin Login</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredUrls.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200/80 hover:border-blue-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: Slug & Click Count */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <a
                    href={`/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-mono font-bold text-lg text-blue-600 hover:text-blue-800 transition-colors group-hover:underline"
                    title={`Visit /${item.slug}`}
                  >
                    <span>/{item.slug}</span>
                    <ExternalLink className="w-4 h-4 text-blue-400" />
                  </a>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                    <TrendingUp className="w-3 h-3 text-slate-400" />
                    <span>{item.clicks || 0} clicks</span>
                  </span>
                </div>

                {/* Destination URL */}
                <div className="flex items-start gap-1.5 text-xs text-slate-500 font-mono mb-4 break-all line-clamp-2">
                  <Globe2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <a
                    href={item.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-slate-800 hover:underline"
                    title={item.original_url}
                  >
                    {item.original_url}
                  </a>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>
                  {new Date(item.created_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>

                <div className="flex items-center gap-2">
                  {/* Copy Link Button */}
                  <button
                    onClick={() => copyToClipboard(item.id, item.slug)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  {/* Visit Link Button */}
                  <a
                    href={`/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Redirect</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

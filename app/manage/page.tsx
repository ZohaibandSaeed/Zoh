"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Link2,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Edit3,
  Search,
  PlusCircle,
  BarChart3,
  Loader2,
  AlertTriangle,
  X,
  Sparkles,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { UrlRecord } from "@/lib/types";
import { sanitizeSlug, isValidUrl, normalizeUrl } from "@/lib/validation";

export default function ManageUrlsPage() {
  const [urls, setUrls] = useState<UrlRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Edit Modal State
  const [editingUrl, setEditingUrl] = useState<UrlRecord | null>(null);
  const [editSlug, setEditSlug] = useState("");
  const [editDestination, setEditDestination] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete Dialog State
  const [deletingUrl, setDeletingUrl] = useState<UrlRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Change PIN Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);

  // Hostname
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
    fetchUrls();
  }, []);

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/urls");
      if (res.ok) {
        const data = await res.json();
        setUrls(data.urls || []);
      }
    } catch (err) {
      console.error("Failed to fetch URLs:", err);
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

  // Open Edit Modal
  const openEditModal = (item: UrlRecord) => {
    setEditingUrl(item);
    setEditSlug(item.slug);
    setEditDestination(item.original_url);
    setEditError(null);
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUrl) return;

    const cleanedSlug = sanitizeSlug(editSlug);
    const normalizedDest = normalizeUrl(editDestination);

    if (!isValidUrl(normalizedDest)) {
      setEditError("Please enter a valid HTTP/HTTPS destination URL.");
      return;
    }

    if (cleanedSlug.length < 2) {
      setEditError("Slug must be at least 2 characters long.");
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/urls/${editingUrl.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_url: normalizedDest,
          slug: cleanedSlug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Failed to update URL.");
      } else {
        // Update local state
        setUrls((prev) =>
          prev.map((item) => (item.id === editingUrl.id ? data.url : item))
        );
        setEditingUrl(null);
      }
    } catch {
      setEditError("Network error. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deletingUrl) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/urls/${deletingUrl.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUrls((prev) => prev.filter((item) => item.id !== deletingUrl.id));
        setDeletingUrl(null);
      } else {
        alert("Failed to delete link.");
      }
    } catch {
      alert("Network error.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Change PIN Action
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setPinError("New passcode must be exactly 6 numeric digits.");
      return;
    }

    if (newPin !== confirmPin) {
      setPinError("New passcodes do not match. Please re-enter.");
      return;
    }

    setPinLoading(true);

    try {
      const res = await fetch("/api/auth/change-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPin,
          newPin,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPinError(data.error || "Failed to update passcode.");
      } else {
        setPinSuccess("Passcode updated successfully in database!");
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
        setTimeout(() => {
          setIsPinModalOpen(false);
          setPinSuccess(null);
        }, 1800);
      }
    } catch {
      setPinError("Network error. Please try again.");
    } finally {
      setPinLoading(false);
    }
  };

  // Filtered URLs
  const filteredUrls = urls.filter(
    (u) =>
      u.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.original_url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalClicks = urls.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  return (
    <div className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-6 py-6 sm:py-10">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] sm:text-xs font-semibold border border-blue-200/60 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admin URL Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manage Short URLs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Rename, update destination, track clicks, or delete links.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => {
              setIsPinModalOpen(true);
              setPinError(null);
              setPinSuccess(null);
              setCurrentPin("");
              setNewPin("");
              setConfirmPin("");
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold shadow-sm transition-all"
          >
            <KeyRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            <span>Change Passcode</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-blue-500/20 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>New Link</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Short URLs
          </span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{urls.length}</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Clicks
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-2xl sm:text-3xl font-black text-blue-600">{totalClicks}</p>
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
            Production Domain
          </span>
          <p className="text-base sm:text-lg font-mono font-bold text-slate-700 mt-1 truncate">
            {displayHost}
          </p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by slug or destination URL..."
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all"
          />
        </div>
      </div>

      {/* URLs Table / Cards */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 sm:p-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
          <p className="text-xs sm:text-sm text-slate-500">Loading your short links...</p>
        </div>
      ) : filteredUrls.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-12 sm:p-16 text-center shadow-sm">
          <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
            <Link2 className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {searchTerm ? "No matching links found" : "No short links created yet"}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
            {searchTerm
              ? "Try adjusting your search keywords."
              : "Create your first custom short link to start redirecting."}
          </p>
          {!searchTerm && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Link Now</span>
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Cards (visible on mobile < sm) */}
          <div className="block sm:hidden space-y-3">
            {filteredUrls.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <a
                    href={`/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-bold text-base text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    <span>/{item.slug}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                    {item.clicks || 0} clicks
                  </span>
                </div>

                <p className="text-xs font-mono text-slate-500 truncate" title={item.original_url}>
                  {item.original_url}
                </p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => copyToClipboard(item.id, item.slug)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1"
                  >
                    {copiedId === item.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setDeletingUrl(item)}
                    className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (hidden on mobile, visible on sm+) */}
          <div className="hidden sm:block bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Short Link</th>
                    <th className="py-3.5 px-4 sm:px-6">Destination</th>
                    <th className="py-3.5 px-4 sm:px-6 text-center">Clicks</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredUrls.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Short Link */}
                      <td className="py-4 px-4 sm:px-6 font-mono font-bold text-blue-600 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <a
                            href={`/${item.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline flex items-center gap-1 text-slate-900 group-hover:text-blue-600"
                          >
                            <span>/{item.slug}</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500" />
                          </a>
                        </div>
                      </td>

                      {/* Destination */}
                      <td className="py-4 px-4 sm:px-6 max-w-xs sm:max-w-md truncate text-slate-600 text-xs font-mono">
                        <a
                          href={item.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-slate-900 hover:underline"
                          title={item.original_url}
                        >
                          {item.original_url}
                        </a>
                      </td>

                      {/* Clicks */}
                      <td className="py-4 px-4 sm:px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                          {item.clicks || 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy Link Button */}
                          <button
                            onClick={() => copyToClipboard(item.id, item.slug)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                            title="Copy short link"
                          >
                            {copiedId === item.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Rename slug or update destination"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeletingUrl(item)}
                            className="p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                            title="Delete short link"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit Modal */}
      {editingUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  Edit Short URL
                </h3>
              </div>
              <button
                onClick={() => setEditingUrl(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Destination URL
                </label>
                <input
                  type="text"
                  required
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Custom Slug
                </label>
                <div className="flex rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-100 overflow-hidden">
                  <span className="inline-flex items-center px-3.5 border-r border-slate-200 bg-slate-100 text-slate-500 text-xs font-mono">
                    {displayHost}/
                  </span>
                  <input
                    type="text"
                    required
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full px-3.5 py-3 bg-transparent text-sm font-mono text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
                  {editError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUrl(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              Delete Short Link?
            </h3>
            <p className="text-sm text-slate-500 mt-2 mb-6 leading-relaxed">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900 font-mono">
                /{deletingUrl.slug}
              </strong>
              ? Anyone who visits this link will receive a 404 error.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingUrl(null)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Keep Link
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteConfirm}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Yes, Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Passcode Modal */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Update Admin Passcode
                </h3>
              </div>
              <button
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Passcode
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={currentPin}
                  onChange={(e) =>
                    setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter current 6 digits"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono tracking-widest text-center focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New 6-Digit Passcode
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={newPin}
                  onChange={(e) =>
                    setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Enter new 6 digits"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono tracking-widest text-center focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Passcode
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) =>
                    setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="Re-enter new 6 digits"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-mono tracking-widest text-center focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium text-center">
                  {pinError}
                </div>
              )}

              {pinSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    pinLoading ||
                    currentPin.length !== 6 ||
                    newPin.length !== 6 ||
                    confirmPin.length !== 6
                  }
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {pinLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Database...</span>
                    </>
                  ) : (
                    <span>Save to Database</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


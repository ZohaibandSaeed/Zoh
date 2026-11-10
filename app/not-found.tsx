"use client";

import Link from "next/link";
import { Link2Off, ArrowLeft, ListOrdered, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl shadow-slate-200/50">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-5 shadow-inner">
          <Link2Off className="w-8 h-8" />
        </div>

        <span className="text-xs font-bold uppercase tracking-wider text-rose-600 px-3 py-1 bg-rose-50 rounded-full border border-rose-200">
          Link Not Found &bull; 404
        </span>

        <h1 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">
          Short Link Missing
        </h1>

        <p className="text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
          The short URL you followed doesn&apos;t exist on <strong>Zoh</strong> or may have been deleted by its owner.
        </p>

        <div className="flex flex-col gap-2.5">
          <Link
            href="/list"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Browse Public Links</span>
          </Link>
          <Link
            href="/"
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Back to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


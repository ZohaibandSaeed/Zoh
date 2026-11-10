import Link from "next/link";
import { Link2, ArrowRight, Shield, Zap, Sparkles, Globe2, ListOrdered } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-sm">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Minimalist &bull; Lightning Fast &bull; Custom Slugs</span>
      </div>

      {/* Main Heading */}
      <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-center text-slate-900 max-w-3xl leading-[1.1]">
        Shorten, Brand &amp; Share with{" "}
        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
          Zoh
        </span>
      </h1>

      <p className="mt-4 text-slate-600 text-base sm:text-lg text-center max-w-xl">
        A lightweight URL shortener built for speed. Secure 6-digit admin control, custom short links, and a public directory.
      </p>

      {/* Call to Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs sm:max-w-none justify-center">
        <Link
          href="/login"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
        >
          <span>Admin Portal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/list"
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-all"
        >
          <ListOrdered className="w-4 h-4 text-slate-500" />
          <span>Browse Public Links</span>
        </Link>
      </div>

      {/* Features Grid */}
      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full">
        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Zap className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-slate-900 text-base">Instant Redirection</h2>
          <p className="text-xs text-slate-500 mt-1">
            Optimized serverless routing delivers low-latency HTTP 307 redirects.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <Globe2 className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-slate-900 text-base">100% Custom Slugs</h2>
          <p className="text-xs text-slate-500 mt-1">
            Choose your exact short link name. No random unmemorable strings.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200/80 rounded-2xl shadow-sm text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="font-bold text-slate-900 text-base">6-Digit Passcode</h2>
          <p className="text-xs text-slate-500 mt-1">
            Simple and secure access control without complicated sign-up forms.
          </p>
        </div>
      </div>
    </div>
  );
}


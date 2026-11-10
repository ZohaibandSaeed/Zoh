"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Link2,
  LogIn,
  LogOut,
  PlusCircle,
  ListOrdered,
  Settings,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setIsLoggedIn(data.authenticated);
        }
      } catch {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsLoggedIn(false);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm sm:shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="flex items-center">
            <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
              Zoh
            </span>
            <span className="hidden md:inline-block ml-1.5 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              Shortener
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-1">
          {/* Public List link */}
          <Link
            href="/list"
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
              pathname === "/list"
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
            <span className="inline sm:hidden">List</span>
            <span className="hidden sm:inline">Public List</span>
          </Link>

          {isLoggedIn ? (
            <>
              {/* Dashboard / Create link */}
              <Link
                href="/dashboard"
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                  pathname === "/dashboard"
                    ? "bg-blue-600 text-white font-semibold shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="inline sm:hidden">New</span>
                <span className="hidden sm:inline">Create Link</span>
              </Link>

              {/* Manage link */}
              <Link
                href="/manage"
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 ${
                  pathname.startsWith("/manage")
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                <span>Manage</span>
              </Link>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 flex-shrink-0 ml-0.5"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex-shrink-0 ${
                pathname === "/login"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="inline sm:hidden">Login</span>
              <span className="hidden sm:inline">Admin Login</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

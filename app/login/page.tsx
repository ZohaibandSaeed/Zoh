"use client";

import { useState, useRef, useEffect, Suspense, KeyboardEvent, ClipboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, Loader2, KeyRound } from "lucide-react";

function LoginForm() {
  const [pin, setPin] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get("from") || "/dashboard";

  useEffect(() => {
    // Auto-focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, val: string) => {
    // Only accept numeric digit
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const nextPin = [...pin];
      nextPin[index] = "";
      setPin(nextPin);
      return;
    }

    const digit = cleaned[cleaned.length - 1];
    const nextPin = [...pin];
    nextPin[index] = digit;
    setPin(nextPin);
    setError(null);

    // Auto-focus next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else {
      // If 6th digit filled, automatically submit
      const fullPin = nextPin.join("");
      if (fullPin.length === 6) {
        submitPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const nextPin = [...pin];
    for (let i = 0; i < pasteData.length; i++) {
      nextPin[i] = pasteData[i];
    }
    setPin(nextPin);

    const focusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[focusIndex]?.focus();

    if (pasteData.length === 6) {
      submitPin(pasteData);
    }
  };

  const submitPin = async (fullPinString?: string) => {
    const finalPin = fullPinString || pin.join("");
    if (finalPin.length !== 6) {
      setError("Please enter the complete 6-digit passcode.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: finalPin }),
      });

      const data = await res.json();

      if (!res.ok) {
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setError(data.error || "Incorrect passcode. Please try again.");
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        router.push(redirectTarget);
        router.refresh();
      }
    } catch {
      setError("Unable to connect to server. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`w-full max-w-md bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 transition-all ${
        shake ? "animate-bounce" : ""
      }`}
    >
      <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white mb-3 sm:mb-4 shadow-lg shadow-blue-500/25">
          <Lock className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Admin Verification
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Enter your 6-digit passcode to access the URL dashboard
        </p>
      </div>

      {/* 6-box PIN Input */}
      <div className="flex justify-between gap-1.5 sm:gap-3 mb-6">
        {pin.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={loading}
            className="w-10 h-12 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-lg sm:rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-50"
          />
        ))}
      </div>

      {error && (
        <div className="p-3 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm text-center font-medium">
          {error}
        </div>
      )}

      <button
        onClick={() => submitPin()}
        disabled={loading || pin.join("").length !== 6}
        className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Verifying Passcode...</span>
          </>
        ) : (
          <>
            <span>Unlock Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
        <KeyRound className="w-4 h-4" />
        <span>Default Local PIN: 123456 (Set in .env.local)</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}


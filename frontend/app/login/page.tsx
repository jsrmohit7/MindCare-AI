"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { LogIn, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      console.error(err);
      const apiError = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        apiError.response?.data?.detail || 
        apiError.message || 
        "Incorrect email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-white/[0.05] bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 blur-3xl rounded-full" />

        <div className="flex flex-col items-center justify-center text-center relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/10">
            <LogIn className="h-5 w-5" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-white">
            Welcome Back
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            Sign in to access your mental health dashboard
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2.5 rounded-2xl bg-red-500/10 p-4 text-xs text-red-400 border border-red-500/20 relative z-10 animate-fadeIn">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-2xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 block w-full rounded-2xl border border-white/[0.08] bg-slate-950 px-4 py-3 text-xs text-white placeholder-slate-500 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 px-4 py-3.5 text-xs font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-indigo-500/10 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-xs relative z-10">
          <span className="text-slate-400">Don&apos;t have an account? </span>
          <Link
            href="/register"
            className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
          >
            Create one now
          </Link>
        </div>
      </div>
    </div>
  );
}

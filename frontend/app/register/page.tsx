"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserPlus, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "patient",
    age: "",
    gender: "",
    phone: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : undefined,
        gender: formData.gender || undefined,
        phone: formData.phone || undefined,
      };
      await register(payload);
    } catch (err) {
      console.error(err);
      const apiError = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(
        apiError.response?.data?.detail || 
        apiError.message || 
        "Failed to register. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-lg space-y-8 rounded-3xl border border-white/[0.05] bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 blur-3xl rounded-full" />

        <div className="flex flex-col items-center justify-center text-center relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/10">
            <UserPlus className="h-5 w-5" />
          </div>
          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-white">
            Create Account
          </h2>
          <p className="mt-1.5 text-xs text-slate-400">
            Get started with MindCare AI in seconds
          </p>
        </div>

        {error && (
          <div className="flex items-center space-x-2.5 rounded-2xl bg-red-500/10 p-4 text-xs text-red-400 border border-red-500/20 relative z-10 animate-fadeIn">
            <AlertCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-8 space-y-4 relative z-10" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="full_name" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Full Name *
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-2xl border border-white/[0.08] bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                placeholder="John Doe"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="email" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-2xl border border-white/[0.08] bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                placeholder="you@example.com"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="password" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Password * (minimum 8 characters)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-2xl border border-white/[0.08] bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="role" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Account Type *
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-2xl border border-white/[0.08] bg-slate-950 px-4 py-2.5 text-xs text-slate-300 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
              >
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label htmlFor="age" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Age
              </label>
              <input
                id="age"
                name="age"
                type="number"
                min={0}
                max={120}
                value={formData.age}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-2xl border border-white/[0.08] bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                placeholder="e.g. 25"
              />
            </div>

            <div>
              <label htmlFor="gender" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-2xl border border-white/[0.08] bg-slate-950 px-4 py-2.5 text-xs text-slate-300 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label htmlFor="phone" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1.5 block w-full rounded-2xl border border-white/[0.08] bg-slate-950 px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-2xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/30 px-4 py-3.5 text-xs font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md shadow-indigo-500/10 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-xs relative z-10">
          <span className="text-slate-400">Already have an account? </span>
          <Link
            href="/login"
            className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors duration-200"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

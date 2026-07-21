"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { User, Mail, Calendar, ShieldCheck, Phone, CheckCircle2, UserCheck } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  const details = [
    {
      label: "Full Name",
      value: user?.full_name,
      icon: User,
    },
    {
      label: "Email Address",
      value: user?.email,
      icon: Mail,
    },
    {
      label: "Role",
      value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : undefined,
      icon: UserCheck,
    },
    {
      label: "Age",
      value: user?.age ? `${user.age} years old` : "Not provided",
      icon: Calendar,
    },
    {
      label: "Gender",
      value: user?.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : "Not provided",
      icon: ShieldCheck,
    },
    {
      label: "Phone Number",
      value: user?.phone || "Not provided",
      icon: Phone,
    },
    {
      label: "Member Since",
      value: user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }) : "Not available",
      icon: CheckCircle2,
    },
  ];

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-xl py-6 px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/[0.05] bg-slate-900/40 p-8 shadow-2xl backdrop-blur-xl space-y-8">
          
          {/* Header */}
          <div className="flex flex-col items-center justify-center text-center space-y-4 pb-6 border-b border-white/[0.04]">
            <div className="flex h-18 w-18 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/10 text-2xl font-bold">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-white">{user?.full_name}</h2>
              <p className="text-xs font-semibold text-slate-400">Account Profile details & info</p>
            </div>
          </div>

          {/* Grid of Profile Items */}
          <div className="space-y-3">
            {details.map((detail, idx) => {
              const Icon = detail.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-2xl bg-white/[0.01] p-4 border border-white/[0.04]"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/10">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                        {detail.label}
                      </div>
                      <div className="text-xs font-bold text-slate-200 mt-0.5">
                        {detail.value}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

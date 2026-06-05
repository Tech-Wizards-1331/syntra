"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Users, QrCode, ArrowLeft, Smartphone } from "lucide-react";
import Link from "next/link";

interface TeamPassClientProps {
  hackathonName: string;
  hackathonId: number;
  teamName: string;
  qrToken: string;
  members: { id: number; name: string; email: string }[];
}

export default function TeamPassClient({
  hackathonName,
  hackathonId,
  teamName,
  qrToken,
  members,
}: TeamPassClientProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-teal-500 selection:text-slate-900">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-60 h-60 bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative w-full max-w-md mx-auto px-6 pt-6 pb-4 flex items-center justify-between z-10">
        <Link
          href={`/participant/hackathons/${hackathonId}/hub`}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 text-xs text-teal-400 font-medium">
          <Smartphone className="w-4 h-4" />
          Team Pass
        </div>
        <div className="w-8" />
      </header>

      {/* Main Pass Content */}
      <main className="relative flex-1 max-w-md mx-auto w-full px-6 py-6 z-10 flex flex-col items-center gap-6">
        {/* Pass Card */}
        <div className="w-full rounded-3xl bg-gradient-to-b from-slate-900/80 to-slate-900/40 border border-slate-800 shadow-2xl overflow-hidden">
          {/* Top gradient band */}
          <div className="h-2 bg-gradient-to-r from-teal-500 to-emerald-400" />

          {/* Hackathon & Team Name */}
          <div className="px-6 pt-6 pb-4 text-center">
            <p className="text-[10px] text-teal-400 font-medium tracking-widest uppercase mb-1">
              {hackathonName}
            </p>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {teamName}
            </h1>
          </div>

          {/* QR Code */}
          <div className="flex justify-center pb-6 px-6">
            <div className="p-5 bg-white rounded-2xl shadow-lg shadow-teal-500/10">
              <QRCodeSVG
                value={qrToken}
                size={220}
                level="H"
                bgColor="#ffffff"
                fgColor="#0f172a"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Scan instruction */}
          <div className="text-center px-6 pb-4">
            <p className="text-xs text-slate-500">
              Present this QR code at check-in
            </p>
          </div>

          {/* Perforated divider */}
          <div className="relative">
            <div className="border-t border-dashed border-slate-700 mx-6" />
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-950" />
          </div>

          {/* Members List */}
          <div className="px-6 pt-4 pb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Team Members ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map((member, idx) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-950/40"
                >
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">
                      {member.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {member.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Back link */}
        <Link
          href={`/participant/hackathons/${hackathonId}/hub`}
          className="text-xs text-slate-500 hover:text-slate-300 transition"
        >
          ← Back to Hackathon Hub
        </Link>
      </main>
    </div>
  );
}

"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { Users, ArrowLeft, Smartphone } from "lucide-react";
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
    <div className="flex flex-col w-full max-w-md mx-auto relative z-10 select-none">
      {/* Header */}
      <header className="w-full py-4 flex items-center justify-between">
        <Link
          href={`/participant/hackathons/${hackathonId}/hub`}
          className="p-2 rounded-md bg-canvas border border-black/[0.08] text-ink-muted hover:text-ink hover:border-black/[0.15] transition apple-press-effect"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 text-xs text-primary font-medium">
          <Smartphone className="w-4 h-4" />
          Team Pass
        </div>
        <div className="w-8" />
      </header>

      {/* Main Pass Content */}
      <div className="w-full flex flex-col items-center gap-6">
        {/* Pass Card */}
        <div className="w-full rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay overflow-hidden">
          {/* Top accent band */}
          <div className="h-1.5 bg-primary" />

          {/* Hackathon & Team Name */}
          <div className="px-6 pt-6 pb-4 text-center">
            <p className="text-[10px] text-primary font-semibold tracking-widest uppercase mb-1">
              {hackathonName}
            </p>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">
              {teamName}
            </h1>
          </div>

          {/* QR Code */}
          <div className="flex justify-center pb-6 px-6">
            <div className="p-5 bg-canvas-pearl rounded-lg border border-black/[0.04]">
              <QRCodeSVG
                value={qrToken}
                size={220}
                level="H"
                bgColor="#fafafc"
                fgColor="#1d1d1f"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Scan instruction */}
          <div className="text-center px-6 pb-4">
            <p className="text-xs text-ink-muted">
              Present this QR code at check-in
            </p>
          </div>

          {/* Perforated divider */}
          <div className="relative">
            <div className="border-t border-dashed border-black/[0.12] mx-6" />
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-canvas-parchment" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-canvas-parchment" />
          </div>

          {/* Members List */}
          <div className="px-6 pt-4 pb-6">
            <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Team Members ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map((member, idx) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-md bg-canvas-parchment/50 border border-black/[0.04]"
                >
                  <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink truncate">
                      {member.name}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">
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
          className="text-xs text-ink-muted hover:text-primary transition mb-6"
        >
          ← Back to Hackathon Hub
        </Link>
      </div>
    </div>
  );
}

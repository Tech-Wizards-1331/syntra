"use client";

import React, { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Users, ArrowLeft, Smartphone, QrCode, Layers } from "lucide-react";
import Link from "next/link";

interface RegistrationPass {
  teamId: number;
  teamName: string;
  hackathonId: number;
  hackathonName: string;
  allowScan: boolean;
  qrToken: string;
  members: { id: number; name: string; email: string }[];
}

interface TeamPassClientProps {
  registrations: RegistrationPass[];
  initialHackathonId: number;
}

export default function TeamPassClient({
  registrations,
  initialHackathonId,
}: TeamPassClientProps) {
  const [selectedHackathonId, setSelectedHackathonId] = useState<number>(initialHackathonId);

  // Find currently active registration (or fallback to first)
  const activeReg =
    registrations.find((r) => r.hackathonId === selectedHackathonId) ||
    registrations[0];

  if (!activeReg) {
    return null;
  }

  return (
    <div className="flex flex-col w-full max-w-md mx-auto relative z-10 select-none">
      {/* Header */}
      <header className="w-full py-4 flex items-center justify-between">
        <Link
          href={`/participant/hackathons/${activeReg.hackathonId}/hub`}
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

      {/* Multi-Registration Tab Selector */}
      {registrations.length > 1 && (
        <div className="w-full mb-4 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-muted flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-primary" />
              Your Event Passes ({registrations.length})
            </span>
          </div>
          <div className="w-full flex items-center gap-1.5 p-1.5 rounded-lg bg-canvas-pearl border border-black/[0.06] overflow-x-auto no-scrollbar">
            {registrations.map((reg) => {
              const isSelected = reg.hackathonId === activeReg.hackathonId;
              return (
                <button
                  key={reg.teamId}
                  onClick={() => setSelectedHackathonId(reg.hackathonId)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? "bg-canvas text-ink apple-shadow-overlay font-semibold"
                      : "text-ink-muted hover:text-ink hover:bg-canvas-parchment/50"
                  }`}
                >
                  <span className="truncate max-w-[140px]">{reg.hackathonName}</span>
                  {reg.allowScan ? (
                    <span className="w-2 h-2 rounded-full bg-success shrink-0" title="QR Scan Enabled" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-black/25 shrink-0" title="QR Scan Disabled" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Pass Content */}
      <div className="w-full flex flex-col items-center gap-6">
        {/* Pass Card */}
        <div className="w-full rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay overflow-hidden">
          {/* Top accent band */}
          <div className="h-1.5 bg-primary" />

          {/* Hackathon & Team Name */}
          <div className="px-6 pt-6 pb-4 text-center">
            <p className="text-[10px] text-primary font-semibold tracking-widest uppercase mb-1">
              {activeReg.hackathonName}
            </p>
            <h1 className="text-2xl font-semibold text-ink tracking-tight">
              {activeReg.teamName}
            </h1>
          </div>

          {/* QR Code section */}
          {activeReg.allowScan !== false ? (
            <>
              <div className="flex justify-center pb-6 px-6">
                <div className="p-5 bg-canvas-pearl rounded-lg border border-black/[0.04]">
                  <QRCodeSVG
                    value={activeReg.qrToken}
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
            </>
          ) : (
            <div className="px-6 pb-6 pt-2 text-center">
              <div className="p-6 rounded-lg bg-canvas-parchment/60 border border-black/[0.08] flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-canvas-pearl border border-black/[0.08] flex items-center justify-center text-ink-muted">
                  <QrCode className="w-6 h-6 opacity-40" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-ink">QR Check-In Disabled</p>
                  <p className="text-[11px] text-ink-muted mt-1 max-w-xs mx-auto leading-relaxed">
                    The organizer has disabled QR scanning for this hackathon. Your team pass and member credentials below remain valid.
                  </p>
                </div>
              </div>
            </div>
          )}

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
              Team Members ({activeReg.members.length})
            </h3>
            <div className="space-y-2">
              {activeReg.members.map((member, idx) => (
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
          href={`/participant/hackathons/${activeReg.hackathonId}/hub`}
          className="text-xs text-ink-muted hover:text-primary transition mb-6"
        >
          ← Back to {activeReg.hackathonName} Hub
        </Link>
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Shield, Wifi } from "lucide-react";

interface QrDisplayProps {
  qrToken: string;
  teamName: string;
  isQrActive: boolean;
}

export default function QrDisplay({ qrToken, teamName, isQrActive }: QrDisplayProps) {
  if (!isQrActive) {
    return (
      <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay">
        <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-ink-muted" />
          QR Code
        </h3>
        <div className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-full bg-canvas-parchment border border-black/[0.06] flex items-center justify-center mb-3">
            <Shield className="w-7 h-7 text-ink-muted" />
          </div>
          <p className="text-sm text-ink-muted">QR code has been deactivated for this team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay animate-fade-in-up">
      <h3 className="font-semibold text-ink mb-4 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-primary" />
        Team QR Code
      </h3>
      <div className="flex flex-col items-center">
        {/* QR Container with decorative corners */}
        <div className="relative p-1">
          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-primary/40 rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-primary/40 rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-primary/40 rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-primary/40 rounded-br-lg" />
          
          <div className="p-4 rounded-lg bg-white border border-black/[0.04]">
            <QRCodeSVG
              value={qrToken}
              size={200}
              level="H"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Scan Ready Badge */}
        <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-success-light border border-success/15">
          <Wifi className="w-3 h-3 text-success animate-pulse-dot" />
          <span className="text-[10px] font-semibold text-success uppercase tracking-wider">Scan Ready</span>
        </div>

        <p className="mt-3 text-xs text-ink-muted text-center">
          Present this QR code at check-in stations for{" "}
          <span className="text-ink font-semibold">{teamName}</span>
        </p>
        <p className="mt-1 text-[10px] text-ink-muted">
          Secure token — scanned by organizers only
        </p>
      </div>
    </div>
  );
}

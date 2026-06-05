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
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <QrCode className="w-5 h-5 text-slate-500" />
          QR Code
        </h3>
        <div className="p-8 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center mb-3">
            <Shield className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-sm text-slate-400">QR code has been deactivated for this team.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-teal-400" />
        Team QR Code
      </h3>
      <div className="flex flex-col items-center">
        {/* QR Container with decorative corners */}
        <div className="relative p-1 animate-float">
          {/* Corner accents */}
          <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-teal-500/60 rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-5 h-5 border-t-2 border-r-2 border-teal-500/60 rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-2 border-l-2 border-teal-500/60 rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-teal-500/60 rounded-br-lg" />
          
          <div className="p-4 rounded-2xl bg-white">
            <QRCodeSVG
              value={qrToken}
              size={200}
              level="H"
              includeMargin={false}
            />
          </div>
        </div>

        {/* Scan Ready Badge */}
        <div className="mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20">
          <Wifi className="w-3 h-3 text-teal-400 animate-pulse" />
          <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider">Scan Ready</span>
        </div>

        <p className="mt-3 text-xs text-slate-400 text-center">
          Present this QR code at check-in stations for{" "}
          <span className="text-teal-400 font-semibold">{teamName}</span>
        </p>
        <p className="mt-1 text-[10px] text-slate-500">
          Secure token — scanned by organizers only
        </p>
      </div>
    </div>
  );
}

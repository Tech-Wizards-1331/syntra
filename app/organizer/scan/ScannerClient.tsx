"use client";

import React, { useState, useRef, useEffect, useCallback, useTransition } from "react";
import { scanQrToken, submitMemberScans } from "@/app/actions/scans";
import {
  Camera,
  Check,
  X,
  Loader2,
  Users,
  ScanLine,
  RefreshCw,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface ScannerClientProps {
  preSelectedHackathon: { id: number; name: string } | null;
  preSelectedCategory: { id: number; name: string } | null;
  hackathons: {
    id: number;
    name: string;
    status: string;
    scanCategories: { id: number; name: string }[];
  }[];
}

interface ScannedMember {
  id: number;
  name: string;
  email: string;
  alreadyScanned: boolean;
}

type ScannerState = "selecting" | "scanning" | "results" | "submitted";

export default function ScannerClient({
  preSelectedHackathon,
  preSelectedCategory,
  hackathons,
}: ScannerClientProps) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<ScannerState>(
    preSelectedHackathon && preSelectedCategory ? "scanning" : "selecting"
  );

  // Selection state
  const [selectedHackathonId, setSelectedHackathonId] = useState<number | null>(
    preSelectedHackathon?.id ?? null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    preSelectedCategory?.id ?? null
  );

  // Scanner state
  const [scannedTeam, setScannedTeam] = useState<{
    teamId: number;
    teamName: string;
    hackathonName: string;
    members: ScannedMember[];
  } | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [lastQrToken, setLastQrToken] = useState<string>("");

  // Messages
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Camera refs
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<InstanceType<typeof import("html5-qrcode").Html5Qrcode> | null>(null);
  const isScanningRef = useRef(false);

  const hackathonName = preSelectedHackathon?.name ??
    hackathons.find((h) => h.id === selectedHackathonId)?.name ?? "";
  const categoryName = preSelectedCategory?.name ??
    hackathons
      .find((h) => h.id === selectedHackathonId)
      ?.scanCategories.find((c) => c.id === selectedCategoryId)?.name ?? "";

  const selectedHackathonCategories =
    hackathons.find((h) => h.id === selectedHackathonId)?.scanCategories ?? [];

  // ─── Scanner Lifecycle ────────────────────────────────────────

  const startScanner = useCallback(async () => {
    if (isScanningRef.current || !scannerRef.current) return;

    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      const qrScanner = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = qrScanner;
      isScanningRef.current = true;

      await qrScanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {
          // ignore failure
        }
      );
    } catch (err) {
      console.error("Scanner error:", err);
      setError("Unable to access camera. Please ensure camera permissions are granted.");
    }
  }, []);

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && isScanningRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current.clear();
      } catch {
        // ignore cleanup errors
      }
      isScanningRef.current = false;
      html5QrCodeRef.current = null;
    }
  }, []);

  // Start scanner when entering scanning state
  useEffect(() => {
    if (state === "scanning") {
      const timer = setTimeout(() => startScanner(), 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
    return () => { stopScanner(); };
  }, [state, startScanner, stopScanner]);

  // ─── Handlers ─────────────────────────────────────────────────

  const handleScan = (decodedText: string) => {
    if (!selectedCategoryId) return;

    // Stop scanner while processing
    stopScanner();
    setError(null);
    setSuccessMsg(null);
    setLastQrToken(decodedText);

    startTransition(async () => {
      try {
        const result = await scanQrToken(decodedText, selectedCategoryId);
        setScannedTeam(result);

        // Auto-select unscanned members
        const unscanned = new Set(
          result.members.filter((m) => !m.alreadyScanned).map((m) => m.id)
        );
        setSelectedMembers(unscanned);
        setState("results");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Scan failed");
        setState("scanning");
      }
    });
  };

  const handleSubmitScans = () => {
    if (!scannedTeam || !selectedCategoryId || selectedMembers.size === 0) return;
    setError(null);

    startTransition(async () => {
      try {
        const result = await submitMemberScans(
          lastQrToken,
          selectedCategoryId,
          Array.from(selectedMembers)
        );
        setSuccessMsg(result.message);
        setState("submitted");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to submit scans");
      }
    });
  };

  const handleScanNext = () => {
    setScannedTeam(null);
    setSelectedMembers(new Set());
    setError(null);
    setSuccessMsg(null);
    setState("scanning");
  };

  const handleStartScanning = () => {
    if (!selectedHackathonId || !selectedCategoryId) return;
    setState("scanning");
  };

  const toggleMember = (memberId: number) => {
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
  };

  // ─── Render: Selector ─────────────────────────────────────────

  if (state === "selecting") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-3xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mx-auto mb-4">
            <ScanLine className="w-10 h-10 text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Start Scanning</h2>
          <p className="text-sm text-slate-400 mt-2">
            Select a hackathon and scan category to begin
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">
              Hackathon
            </label>
            <div className="relative">
              <select
                value={selectedHackathonId ?? ""}
                onChange={(e) => {
                  setSelectedHackathonId(e.target.value ? Number(e.target.value) : null);
                  setSelectedCategoryId(null);
                }}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-500/50 transition appearance-none pr-10"
              >
                <option value="">Choose hackathon...</option>
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {selectedHackathonId && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Scan Category
              </label>
              <div className="relative">
                <select
                  value={selectedCategoryId ?? ""}
                  onChange={(e) =>
                    setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-teal-500/50 transition appearance-none pr-10"
                >
                  <option value="">Choose category...</option>
                  {selectedHackathonCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              </div>
              {selectedHackathonCategories.length === 0 && (
                <p className="text-xs text-amber-400 mt-2">
                  No active scan categories found for this hackathon.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleStartScanning}
            disabled={!selectedHackathonId || !selectedCategoryId}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-semibold text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Camera className="w-5 h-5" />
            Start Scanner
          </button>
        </div>
      </div>
    );
  }

  // ─── Render: Camera Scanner ───────────────────────────────────

  if (state === "scanning") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        {/* Context Bar */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">{hackathonName}</p>
            <p className="text-xs text-teal-400">{categoryName}</p>
          </div>
          <button
            onClick={() => {
              stopScanner();
              setState("selecting");
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 text-xs hover:text-white transition cursor-pointer"
          >
            Change
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button
              onClick={() => {
                setError(null);
                startScanner();
              }}
              className="ml-auto text-xs underline hover:text-red-300 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {isPending && (
          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Processing scan...
          </div>
        )}

        {/* Camera Viewport */}
        <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 relative">
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full aspect-square"
          />
          {/* Scanning overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-teal-400/40 rounded-2xl relative">
              <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-2 border-l-2 border-teal-400 rounded-tl-xl" />
              <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-2 border-r-2 border-teal-400 rounded-tr-xl" />
              <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-2 border-l-2 border-teal-400 rounded-bl-xl" />
              <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-2 border-r-2 border-teal-400 rounded-br-xl" />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Point camera at team QR code to scan
        </p>
      </div>
    );
  }

  // ─── Render: Results (Member Selection) ───────────────────────

  if (state === "results" && scannedTeam) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        {/* Context */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{hackathonName}</p>
              <p className="text-xs text-teal-400">{categoryName}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Scanned Team Info */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{scannedTeam.teamName}</h3>
              <p className="text-xs text-slate-400">
                {scannedTeam.members.length} members
              </p>
            </div>
          </div>

          {/* Member Checkboxes */}
          <div className="space-y-2">
            {scannedTeam.members.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  member.alreadyScanned
                    ? "bg-slate-800/50 border-slate-700 opacity-60"
                    : selectedMembers.has(member.id)
                    ? "bg-teal-500/5 border-teal-500/30"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                }`}
              >
                <input
                  type="checkbox"
                  checked={member.alreadyScanned || selectedMembers.has(member.id)}
                  disabled={member.alreadyScanned}
                  onChange={() => toggleMember(member.id)}
                  className="w-4 h-4 rounded border-slate-600 text-teal-500 focus:ring-teal-500/50 bg-slate-900 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">{member.name}</p>
                  <p className="text-xs text-slate-400">{member.email}</p>
                </div>
                {member.alreadyScanned && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ✓ CHECKED IN
                  </span>
                )}
              </label>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmitScans}
              disabled={isPending || selectedMembers.size === 0}
              className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-semibold text-sm hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Check In ({selectedMembers.size})
            </button>
            <button
              onClick={handleScanNext}
              className="px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 text-sm hover:text-white transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render: Submitted (Success) ──────────────────────────────

  if (state === "submitted") {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="p-8 rounded-2xl bg-slate-900/50 border border-emerald-500/20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Scan Submitted</h3>
          <p className="text-sm text-slate-400 mb-1">
            {scannedTeam?.teamName}
          </p>
          <p className="text-sm text-emerald-400">{successMsg}</p>

          <button
            onClick={handleScanNext}
            className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-semibold text-sm hover:brightness-110 transition flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            Scan Next Team
          </button>
        </div>
      </div>
    );
  }

  return null;
}

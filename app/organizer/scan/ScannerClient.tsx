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
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <ScanLine className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-ink">Start Scanning</h2>
          <p className="text-sm text-ink-muted mt-2">
            Select a hackathon and scan category to begin
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay space-y-4">
          <div>
            <label className="block text-[11px] text-ink-muted mb-1.5 font-semibold uppercase tracking-wider">
              Hackathon
            </label>
            <div className="relative">
              <select
                value={selectedHackathonId ?? ""}
                onChange={(e) => {
                  setSelectedHackathonId(e.target.value ? Number(e.target.value) : null);
                  setSelectedCategoryId(null);
                }}
                className="w-full px-4 py-3 rounded-md bg-canvas-pearl border border-black/[0.08] text-ink text-sm focus:outline-none focus:border-primary transition appearance-none pr-10"
              >
                <option value="">Choose hackathon...</option>
                {hackathons.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.status})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
            </div>
          </div>

          {selectedHackathonId && (
            <div>
              <label className="block text-[11px] text-ink-muted mb-1.5 font-semibold uppercase tracking-wider">
                Scan Category
              </label>
              <div className="relative">
                <select
                  value={selectedCategoryId ?? ""}
                  onChange={(e) =>
                    setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-full px-4 py-3 rounded-md bg-canvas-pearl border border-black/[0.08] text-ink text-sm focus:outline-none focus:border-primary transition appearance-none pr-10"
                >
                  <option value="">Choose category...</option>
                  {selectedHackathonCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted pointer-events-none" />
              </div>
              {selectedHackathonCategories.length === 0 && (
                <p className="text-xs text-warning mt-2">
                  No active scan categories found for this hackathon.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleStartScanning}
            disabled={!selectedHackathonId || !selectedCategoryId}
            className="w-full px-4 py-3 rounded-pill bg-primary text-white font-normal text-sm hover:bg-primary-focus disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer apple-press-effect"
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
        <div className="p-4 rounded-md bg-canvas border border-black/[0.06] flex items-center justify-between apple-shadow-overlay">
          <div>
            <p className="text-sm font-semibold text-ink">{hackathonName}</p>
            <p className="text-xs text-primary">{categoryName}</p>
          </div>
          <button
            onClick={() => {
              stopScanner();
              setState("selecting");
            }}
            className="px-3 py-1.5 rounded-md bg-canvas-pearl border border-black/[0.08] text-ink-muted text-xs hover:text-ink transition cursor-pointer apple-press-effect"
          >
            Change
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button
              onClick={() => {
                setError(null);
                startScanner();
              }}
              className="ml-auto text-xs underline hover:text-danger cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {isPending && (
          <div className="p-4 rounded-md bg-info-light border border-info/15 text-info text-xs font-medium flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Processing scan...
          </div>
        )}

        {/* Camera Viewport */}
        <div className="rounded-lg overflow-hidden bg-tile-black border border-black/[0.12] relative">
          <div
            id="qr-reader"
            ref={scannerRef}
            className="w-full aspect-square"
          />
          {/* Scanning overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-primary/40 rounded-lg relative">
              <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg" />
              <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg" />
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-ink-muted">
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
        <div className="p-4 rounded-md bg-canvas border border-black/[0.06] apple-shadow-overlay">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink">{hackathonName}</p>
              <p className="text-xs text-primary">{categoryName}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Scanned Team Info */}
        <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-ink">{scannedTeam.teamName}</h3>
              <p className="text-xs text-ink-muted">
                {scannedTeam.members.length} members
              </p>
            </div>
          </div>

          {/* Member Checkboxes */}
          <div className="space-y-2">
            {scannedTeam.members.map((member) => (
              <label
                key={member.id}
                className={`flex items-center gap-3 p-3 rounded-md border transition cursor-pointer ${
                  member.alreadyScanned
                    ? "bg-canvas-parchment border-black/[0.06] opacity-60"
                    : selectedMembers.has(member.id)
                    ? "bg-primary/5 border-primary/20"
                    : "bg-canvas-pearl border-black/[0.06] hover:border-black/[0.12]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={member.alreadyScanned || selectedMembers.has(member.id)}
                  disabled={member.alreadyScanned}
                  onChange={() => toggleMember(member.id)}
                  className="w-4 h-4 rounded border-black/[0.2] text-primary focus:ring-primary/50 bg-canvas cursor-pointer accent-primary"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-ink">{member.name}</p>
                  <p className="text-xs text-ink-muted">{member.email}</p>
                </div>
                {member.alreadyScanned && (
                  <span className="px-2 py-0.5 rounded-pill text-[10px] font-semibold bg-success-light text-success border border-success/15">
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
              className="flex-1 px-4 py-3 rounded-pill bg-primary text-white font-normal text-sm hover:bg-primary-focus disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 cursor-pointer apple-press-effect"
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
              className="px-4 py-3 rounded-pill bg-canvas border border-black/[0.12] text-ink-muted text-sm hover:text-ink transition cursor-pointer apple-press-effect"
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
        <div className="p-8 rounded-lg bg-canvas border border-success/15 text-center apple-shadow-overlay">
          <div className="w-16 h-16 rounded-full bg-success-light flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h3 className="text-xl font-semibold text-ink mb-2">Scan Submitted</h3>
          <p className="text-sm text-ink-muted mb-1">
            {scannedTeam?.teamName}
          </p>
          <p className="text-sm text-success">{successMsg}</p>

          <button
            onClick={handleScanNext}
            className="mt-6 px-6 py-3 rounded-pill bg-primary text-white font-normal text-sm hover:bg-primary-focus transition flex items-center justify-center gap-2 mx-auto cursor-pointer apple-press-effect"
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

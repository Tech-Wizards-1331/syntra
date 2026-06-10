import React from "react";
import Link from "next/link";
import { getHackathonById } from "@/app/actions/hackathons";
import HackathonDetailPageClient from "./HackathonDetailPageClient";
import { ChevronLeft, AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function HackathonDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const hackathonId = Number(resolvedParams.id);

  let hackathon = null;
  let errorMsg = null;

  try {
    hackathon = await getHackathonById(hackathonId);
  } catch (err: any) {
    errorMsg = err.message || "Failed to load hackathon details";
  }

  return (
    <div className="min-h-screen bg-canvas-parchment text-ink flex flex-col font-sans relative selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-black/[0.06] z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-tile-black flex items-center justify-center">
            <span className="text-white font-semibold text-xl tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">Syntra</h1>
            <p className="text-[10px] text-primary font-medium tracking-widest uppercase">Organizer Console</p>
          </div>
        </div>
        <Link
          href="/organizer/dashboard"
          className="px-4 py-2 rounded-md bg-canvas border border-black/[0.08] hover:bg-canvas-pearl transition flex items-center gap-2 text-xs font-normal"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-8">
        {errorMsg || !hackathon ? (
          <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger flex items-start gap-3 text-sm max-w-3xl mx-auto w-full">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold mb-0.5">Access Error</h5>
              <p>{errorMsg || "Could not retrieve hackathon information."}</p>
              <Link
                href="/organizer/dashboard"
                className="mt-3 inline-block text-xs text-primary hover:underline"
              >
                Go back to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <HackathonDetailPageClient hackathon={hackathon} />
        )}
      </main>
    </div>
  );
}

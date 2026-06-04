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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-teal-500 selection:text-slate-900">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="text-slate-950 font-black text-xl tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Syntra</h1>
            <p className="text-[10px] text-teal-400 font-medium tracking-widest uppercase">Organizer Console</p>
          </div>
        </div>
        <Link
          href="/organizer/dashboard"
          className="p-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-855 hover:border-slate-700 transition flex items-center gap-2 text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </header>

      {/* Main Container */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-8">
        {errorMsg || !hackathon ? (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-start gap-3 text-sm max-w-3xl mx-auto w-full">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold mb-0.5">Access Error</h5>
              <p>{errorMsg || "Could not retrieve hackathon information."}</p>
              <Link
                href="/organizer/dashboard"
                className="mt-3 inline-block text-xs text-teal-450 hover:underline"
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

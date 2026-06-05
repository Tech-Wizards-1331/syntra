import React from "react";
import { auth, signOut } from "@/auth";
import { LogOut } from "lucide-react";
import Link from "next/link";

/**
 * ParticipantShell — Shared layout wrapper for all Participant Dashboard pages.
 * Renders the animated background mesh, premium header, footer, and wraps children
 * with a fade-in-up entrance animation.
 */
export default async function ParticipantShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-teal-500 selection:text-slate-900">
      {/* Animated Background Mesh */}
      <div className="bg-mesh-gradient">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Premium Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-800/60 z-10">
        <Link href="/participant/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 animate-glow-pulse group-hover:shadow-teal-500/40 transition-shadow duration-500">
            <span className="text-slate-950 font-black text-xl tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-teal-50 transition-colors">Syntra</h1>
            <p className="text-[10px] text-teal-400 font-semibold tracking-[0.2em] uppercase">Participant Console</p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800/60">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
            <span className="text-[11px] font-semibold text-slate-300">{session?.user?.name || "Participant"}</span>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all duration-300 flex items-center gap-2 text-sm font-medium cursor-pointer group/btn"
            >
              <LogOut className="w-4 h-4 group-hover/btn:rotate-12 transition-transform" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content with entrance animation */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-8 animate-fade-in-up">
        {children}
      </main>

      {/* Premium Footer */}
      <footer className="relative w-full max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between border-t border-slate-800/40 text-xs text-slate-500 gap-4 z-10">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-teal-500/20 to-emerald-400/20 flex items-center justify-center">
            <span className="text-teal-400 font-black text-[8px]">S</span>
          </div>
          <p>&copy; {new Date().getFullYear()} Syntra Platform</p>
        </div>
        <div className="flex gap-6">
          <span className="hover:text-teal-400 cursor-pointer transition-colors">Security</span>
          <span className="hover:text-teal-400 cursor-pointer transition-colors">Privacy</span>
          <span className="hover:text-teal-400 cursor-pointer transition-colors">Status</span>
        </div>
      </footer>
    </div>
  );
}

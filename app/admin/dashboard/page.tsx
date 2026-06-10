import React from "react";
import { auth, signOut } from "@/auth";
import { 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  Lock, 
  Database, 
  ServerCrash 
} from "lucide-react";

export default async function AdminDashboard() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-canvas-parchment text-ink flex flex-col font-sans antialiased selection:bg-primary selection:text-white">
      
      {/* ─── Global Nav (Apple Thin Black Bar) ─── */}
      <nav className="h-11 bg-tile-black text-white flex items-center justify-between px-6 z-40 relative text-[12px] font-normal tracking-[-0.12px]">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold tracking-tight text-white flex items-center gap-1.5 cursor-pointer">
               <span className="font-bold tracking-tight">Syntra</span>
            </span>
            <span className="text-ink-muted hover:text-white transition cursor-pointer">Admin console</span>
          </div>
          <div className="flex items-center gap-4 text-ink-muted">
            <span>Root Status: Normal</span>
          </div>
        </div>
      </nav>

      {/* ─── Header ─── */}
      <header className="sticky top-0 h-[52px] bg-canvas-parchment/80 backdrop-blur-md border-b border-black/[0.08] flex items-center justify-between px-6 z-30">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-ink">Super Admin Panel</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="px-2.5 py-0.5 rounded-pill text-[11px] font-semibold bg-danger-light border border-danger/15 text-danger">
              System Admin
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md bg-canvas border border-black/[0.12] hover:bg-canvas-pearl hover:text-danger text-xs font-normal transition apple-press-effect flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        
        {/* Welcome Configurator Card */}
        <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-canvas-parchment border border-black/[0.04] flex items-center justify-center text-primary">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink leading-tight">
                Super Admin Session: {session?.user?.name || "Administrator"}
              </h2>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-ink-muted mt-1.5">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-ink-muted/60" />
                  {session?.user?.email}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-black/[0.12] hidden sm:inline" />
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-ink-muted/60" />
                  Role: Super Admin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Diagnostic Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] hover:border-black/[0.15] transition-all duration-300 apple-shadow-overlay flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-md bg-canvas-parchment border border-black/[0.04] flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-350">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[17px] text-ink mb-1 group-hover:text-primary transition-colors">
                Manage User Access
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Approve organizer requests, override roles, or disable accounts.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] hover:border-black/[0.15] transition-all duration-300 apple-shadow-overlay flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-md bg-canvas-parchment border border-black/[0.04] flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-350">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[17px] text-ink mb-1 group-hover:text-primary transition-colors">
                Prisma Schema Registry
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Inspect introspected DB models, table sizes, and sync indices.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] hover:border-black/[0.15] transition-all duration-300 apple-shadow-overlay flex flex-col gap-4 group">
            <div className="w-10 h-10 rounded-md bg-canvas-parchment border border-black/[0.04] flex items-center justify-center text-primary group-hover:scale-105 transition-transform duration-350">
              <ServerCrash className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[17px] text-ink mb-1 group-hover:text-primary transition-colors">
                System Diagnostics
              </h3>
              <p className="text-xs text-ink-muted leading-relaxed">
                Track server load, database connections, and session health.
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-canvas-parchment text-ink-muted border-t border-black/[0.08] py-8 px-6 text-[12px] font-normal mt-auto">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Syntra. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-ink transition cursor-pointer">Security</span>
            <span className="hover:text-ink transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-ink transition cursor-pointer">API Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

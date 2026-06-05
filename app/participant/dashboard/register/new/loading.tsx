import React from "react";

/**
 * Skeleton loading state for the New Team Registration page.
 * Mirrors the layout: breadcrumb, hackathon details card with form area.
 */
export default function NewRegistrationLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      {/* Background mesh */}
      <div className="bg-mesh-gradient">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Header Skeleton */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-slate-800/60 z-10">
        <div className="flex items-center gap-3">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div>
            <div className="skeleton w-16 h-5 rounded mb-1" />
            <div className="skeleton w-28 h-2.5 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="skeleton w-32 h-8 rounded-full hidden sm:block" />
          <div className="skeleton w-24 h-10 rounded-xl" />
        </div>
      </header>

      <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-6">
        {/* Breadcrumb Skeleton */}
        <div className="skeleton w-36 h-4 rounded" />

        {/* Hackathon Card Skeleton */}
        <div className="skeleton-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="skeleton w-5 h-5 rounded" />
            <div className="skeleton w-36 h-5 rounded" />
          </div>
          <div className="p-5 rounded-xl bg-slate-950/40 border border-slate-800/30 space-y-4">
            {/* Hackathon title & description */}
            <div>
              <div className="skeleton skeleton-text-lg w-48" />
              <div className="skeleton skeleton-text w-full mt-2" />
              <div className="skeleton skeleton-text w-3/4" />
            </div>

            {/* Info stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/30">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/30 border border-slate-800/20">
                  <div className="skeleton w-9 h-9 rounded-lg" />
                  <div>
                    <div className="skeleton skeleton-text-sm w-16" />
                    <div className="skeleton skeleton-text w-20" />
                  </div>
                </div>
              ))}
            </div>

            {/* Create form skeleton */}
            <div className="pt-4 border-t border-slate-800/30 space-y-3">
              <div className="skeleton w-48 h-5 rounded" />
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="skeleton flex-1 h-11 rounded-xl" />
                <div className="skeleton w-36 h-11 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="relative w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-t border-slate-800/40 z-10">
        <div className="skeleton w-36 h-3 rounded" />
        <div className="flex gap-6">
          <div className="skeleton w-14 h-3 rounded" />
          <div className="skeleton w-14 h-3 rounded" />
          <div className="skeleton w-14 h-3 rounded" />
        </div>
      </footer>
    </div>
  );
}

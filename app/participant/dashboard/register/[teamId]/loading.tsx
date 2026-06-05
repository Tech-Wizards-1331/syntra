import React from "react";

/**
 * Skeleton loading state for the Team Registration Workspace page.
 * Mirrors the layout: breadcrumb, workspace header with progress stepper, two-column grid.
 */
export default function RegisterTeamLoading() {
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

        {/* Workspace Header Skeleton */}
        <div className="skeleton-card rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="skeleton w-32 h-3 rounded mb-2" />
              <div className="skeleton skeleton-heading w-56" />
              <div className="skeleton skeleton-text w-40" />
            </div>
            <div className="skeleton skeleton-badge w-28" />
          </div>
          {/* Progress Stepper Skeleton */}
          <div className="pt-5 border-t border-slate-800/50">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className="skeleton w-8 h-8 rounded-full" />
                  <div className="skeleton w-20 h-3 rounded mt-2" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Two-Column Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Dashboard Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Team Info Card */}
            <div className="skeleton-card rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="skeleton skeleton-text-lg w-40" />
                  <div className="skeleton skeleton-text w-52 mt-2" />
                </div>
                <div className="skeleton skeleton-badge w-24" />
              </div>
            </div>
            {/* Members Card */}
            <div className="skeleton-card rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <div className="skeleton w-28 h-5 rounded" />
                <div className="skeleton w-32 h-9 rounded-xl" />
              </div>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/30 border border-slate-800/30" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="skeleton skeleton-avatar-sm" />
                  <div className="flex-1">
                    <div className="skeleton skeleton-text w-32" />
                    <div className="skeleton skeleton-text-sm w-48" />
                    <div className="flex gap-1.5 mt-2">
                      <div className="skeleton w-14 h-5 rounded-md" />
                      <div className="skeleton w-14 h-5 rounded-md" />
                      <div className="skeleton w-14 h-5 rounded-md" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* QR Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <div className="skeleton-card rounded-2xl p-6">
              <div className="skeleton w-32 h-5 rounded mb-4" />
              <div className="flex flex-col items-center">
                <div className="skeleton w-[200px] h-[200px] rounded-2xl" />
                <div className="skeleton w-24 h-6 rounded-full mt-4" />
                <div className="skeleton w-44 h-3 rounded mt-3" />
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

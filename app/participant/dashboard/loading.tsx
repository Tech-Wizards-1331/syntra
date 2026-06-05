import React from "react";

/**
 * Skeleton loading state for the Participant Dashboard homepage.
 * Next.js App Router automatically shows this as a Suspense fallback during RSC data fetching.
 */
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative">
      {/* Background mesh placeholder */}
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

      {/* Main Content Skeleton */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-8">
        {/* Welcome Card Skeleton */}
        <div className="skeleton-card rounded-2xl p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="skeleton skeleton-avatar" />
              <div className="flex-1">
                <div className="skeleton skeleton-heading w-64 max-w-full" />
                <div className="flex gap-4">
                  <div className="skeleton skeleton-text w-40" />
                  <div className="skeleton skeleton-text w-32" />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="skeleton w-16 h-16 rounded-xl" />
              <div className="skeleton w-16 h-16 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Browse Button Skeleton */}
        <div className="skeleton w-52 h-10 rounded-xl" />

        {/* Teams Grid Skeleton */}
        <div className="skeleton-card rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="skeleton w-5 h-5 rounded" />
            <div className="skeleton w-44 h-5 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card rounded-xl p-5 space-y-3" style={{ animationDelay: `${i * 0.15}s` }}>
                {/* Accent bar */}
                <div className="skeleton w-full h-[2px] rounded-full" />
                {/* Header row */}
                <div className="flex justify-between items-center">
                  <div className="skeleton skeleton-text-lg w-28" />
                  <div className="skeleton skeleton-badge" />
                </div>
                {/* Hackathon name */}
                <div className="skeleton skeleton-text w-36" />
                {/* Progress bar */}
                <div>
                  <div className="flex justify-between mb-1">
                    <div className="skeleton skeleton-text-sm w-16" />
                    <div className="skeleton skeleton-text-sm w-8" />
                  </div>
                  <div className="skeleton skeleton-progress w-full" />
                </div>
                {/* Action links */}
                <div className="flex gap-2 pt-2 border-t border-slate-800/30">
                  <div className="skeleton w-16 h-7 rounded-lg" />
                  <div className="skeleton w-12 h-7 rounded-lg" />
                </div>
              </div>
            ))}
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

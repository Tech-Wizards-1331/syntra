import React from "react";

/**
 * Skeleton loading state for the Participant Dashboard homepage.
 * Next.js App Router automatically shows this as a Suspense fallback during RSC data fetching.
 */
export default function DashboardLoading() {
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
      {/* Welcome Card Skeleton */}
      <div className="skeleton-card rounded-lg p-8">
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
            <div className="skeleton w-16 h-16 rounded-lg" />
            <div className="skeleton w-16 h-16 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Browse Button Skeleton */}
      <div className="skeleton w-52 h-10 rounded-pill" />

      {/* Teams Grid Skeleton */}
      <div className="skeleton-card rounded-lg p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="skeleton w-5 h-5 rounded" />
          <div className="skeleton w-44 h-5 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card rounded-lg p-5 space-y-3" style={{ animationDelay: `${i * 0.15}s` }}>
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
              <div className="flex gap-2 pt-2 border-t border-black/[0.05]">
                <div className="skeleton w-16 h-7 rounded-md" />
                <div className="skeleton w-12 h-7 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

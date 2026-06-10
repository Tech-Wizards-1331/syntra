import React from "react";

/**
 * Skeleton loading state for the Team Registration Workspace page.
 * Mirrors the layout: breadcrumb, workspace header with progress stepper, two-column grid.
 */
export default function RegisterTeamLoading() {
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
      {/* Breadcrumb Skeleton */}
      <div className="skeleton w-36 h-4 rounded" />

      {/* Workspace Header Skeleton */}
      <div className="skeleton-card rounded-lg p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="skeleton w-32 h-3 rounded mb-2" />
            <div className="skeleton skeleton-heading w-56" />
            <div className="skeleton skeleton-text w-40" />
          </div>
          <div className="skeleton skeleton-badge w-28" />
        </div>
        {/* Progress Stepper Skeleton */}
        <div className="pt-5 border-t border-black/[0.05]">
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
          <div className="skeleton-card rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="skeleton skeleton-text-lg w-40" />
                <div className="skeleton skeleton-text w-52 mt-2" />
              </div>
              <div className="skeleton skeleton-badge w-24" />
            </div>
          </div>
          <div className="skeleton-card rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div className="skeleton w-28 h-5 rounded" />
              <div className="skeleton w-32 h-9 rounded-pill" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-4 rounded-md bg-canvas-parchment/50 border border-black/[0.04]" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="skeleton skeleton-avatar-sm" />
                <div className="flex-1">
                  <div className="skeleton skeleton-text w-32" />
                  <div className="skeleton skeleton-text-sm w-48" />
                  <div className="flex gap-1.5 mt-2">
                    <div className="skeleton w-14 h-5 rounded-pill" />
                    <div className="skeleton w-14 h-5 rounded-pill" />
                    <div className="skeleton w-14 h-5 rounded-pill" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* QR Sidebar Skeleton */}
        <div className="lg:col-span-1">
          <div className="skeleton-card rounded-lg p-6">
            <div className="skeleton w-32 h-5 rounded mb-4" />
            <div className="flex flex-col items-center">
              <div className="skeleton w-[200px] h-[200px] rounded-lg" />
              <div className="skeleton w-24 h-6 rounded-pill mt-4" />
              <div className="skeleton w-44 h-3 rounded mt-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

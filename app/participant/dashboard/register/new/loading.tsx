import React from "react";

/**
 * Skeleton loading state for the New Team Registration page.
 * Mirrors the layout: breadcrumb, hackathon details card with form area.
 */
export default function NewRegistrationLoading() {
  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
      {/* Breadcrumb Skeleton */}
      <div className="skeleton w-36 h-4 rounded" />

      {/* Hackathon Card Skeleton */}
      <div className="skeleton-card rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="skeleton w-5 h-5 rounded" />
          <div className="skeleton w-36 h-5 rounded" />
        </div>
        <div className="p-5 rounded-md bg-canvas-parchment/50 border border-black/[0.04] space-y-4">
          <div>
            <div className="skeleton skeleton-text-lg w-48" />
            <div className="skeleton skeleton-text w-full mt-2" />
            <div className="skeleton skeleton-text w-3/4" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-black/[0.05]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-canvas border border-black/[0.04]">
                <div className="skeleton w-9 h-9 rounded-md" />
                <div>
                  <div className="skeleton skeleton-text-sm w-16" />
                  <div className="skeleton skeleton-text w-20" />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-black/[0.05] space-y-3">
            <div className="skeleton w-48 h-5 rounded" />
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="skeleton flex-1 h-11 rounded-md" />
              <div className="skeleton w-36 h-11 rounded-pill" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

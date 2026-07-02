import React from "react";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFacultyHackathonDetail } from "@/app/actions/faculty";
import { ChevronLeft, AlertCircle } from "lucide-react";
import FacultyEvaluationClient from "./FacultyEvaluationClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FacultyHackathonPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "faculty") {
    redirect("/login");
  }

  const resolvedParams = await params;
  const hackathonId = Number(resolvedParams.id);

  let data = null;
  let errorMsg = null;

  try {
    data = await getFacultyHackathonDetail(hackathonId);
  } catch (err: any) {
    errorMsg = err.message || "Failed to load hackathon";
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
            <p className="text-[10px] text-primary font-medium tracking-widest uppercase">
              Faculty Portal
            </p>
          </div>
        </div>
        <Link
          href="/faculty/dashboard"
          className="px-4 py-2 rounded-md bg-canvas border border-black/[0.08] hover:bg-canvas-pearl transition flex items-center gap-2 text-xs font-normal"
        >
          <ChevronLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </header>

      {/* Main */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-8">
        {errorMsg || !data ? (
          <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger flex items-start gap-3 text-sm max-w-3xl mx-auto w-full">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold mb-0.5">Access Error</h5>
              <p>{errorMsg || "Could not load hackathon details."}</p>
              <Link
                href="/faculty/dashboard"
                className="mt-3 inline-block text-xs text-primary hover:underline"
              >
                Go back to dashboard
              </Link>
            </div>
          </div>
        ) : (
          <FacultyEvaluationClient
            hackathon={data.hackathon}
            hackathonFacultyId={data.hackathonFacultyId}
          />
        )}
      </main>
    </div>
  );
}

import React from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { getFacultyHackathons } from "@/app/actions/faculty";
import {
  GraduationCap,
  Calendar,
  Users,
  ArrowRight,
  LogOut,
} from "lucide-react";

export default async function FacultyDashboardPage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "faculty") {
    redirect("/login");
  }

  let hackathons: Awaited<ReturnType<typeof getFacultyHackathons>> = [];
  let errorMsg: string | null = null;

  try {
    hackathons = await getFacultyHackathons();
  } catch (err: any) {
    errorMsg = err.message || "Failed to load hackathons";
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-success-light border border-success/10 text-success">
            Active
          </span>
        );
      case "registration":
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-info-light border border-info/10 text-info">
            Registration
          </span>
        );
      case "completed":
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-canvas-pearl border border-black/[0.08] text-ink-muted">
            Completed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 text-[11px] font-semibold rounded-full bg-canvas-parchment border border-black/[0.08] text-ink-muted">
            {status}
          </span>
        );
    }
  };

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
        <div className="flex items-center gap-3">
          <div className="text-right mr-3">
            <p className="text-sm font-medium">{session.user.name}</p>
            <p className="text-[11px] text-ink-muted">{session.user.email}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="p-2 rounded-md hover:bg-canvas-pearl border border-black/[0.08] transition cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4 text-ink-muted" />
            </button>
          </form>
        </div>
      </header>

      {/* Main */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-8">
        {/* Welcome */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-info/20 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Welcome, {session.user.name?.split(" ")[0] || "Faculty"}
            </h2>
            <p className="text-sm text-ink-muted mt-0.5">
              Your assigned hackathons for evaluation
            </p>
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger text-sm">
            {errorMsg}
          </div>
        )}

        {/* Hackathon Cards */}
        {hackathons.length === 0 && !errorMsg ? (
          <div className="py-20 text-center text-ink-muted">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">No hackathons assigned</p>
            <p className="text-sm">
              You will see hackathons here once an organizer assigns you as an evaluator.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map(({ hackathonFacultyId, hackathon }) => (
              <Link
                key={hackathonFacultyId}
                href={`/faculty/hackathons/${hackathon.id}`}
                className="group p-6 rounded-xl bg-canvas border border-black/[0.06] hover:border-primary/30 transition-all duration-300 apple-shadow-card hover:apple-shadow-overlay flex flex-col gap-4"
              >
                <div className="flex items-start justify-between">
                  <h3 className="text-base font-semibold tracking-tight group-hover:text-primary transition">
                    {hackathon.name}
                  </h3>
                  {getStatusBadge(hackathon.status)}
                </div>

                <div className="flex items-center gap-4 text-xs text-ink-muted">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(hackathon.start_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    {hackathon._count.participant_team} teams
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-primary font-medium mt-auto pt-2 border-t border-black/[0.04]">
                  Evaluate Teams
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

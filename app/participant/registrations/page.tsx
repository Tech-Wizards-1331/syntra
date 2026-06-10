import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Trophy,
  Calendar,
  ArrowRight,
  Compass,
  ChevronRight,
  Users,
} from "lucide-react";

export const metadata = {
  title: "My Registrations | Syntra",
  description: "View and manage your registered and draft hackathon teams.",
};

export default async function MyRegistrationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userIdNum = Number(session.user.id);
  const userEmail = session.user.email || "";

  // Query all teams the user is in (both as leader or as member)
  const allUserTeams = await prisma.participant_team.findMany({
    where: {
      OR: [
        { leader_id: userIdNum },
        {
          participant_teammember: {
            some: { email: userEmail },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      hackathon_id: true,
      leader_id: true,
      is_registered: true,
      qr_token: true,
      organizer_hackathon: {
        select: {
          name: true,
          max_team_size: true,
          min_team_size: true,
          status: true,
          start_date: true,
          end_date: true,
        },
      },
      accounts_user: {
        select: { email: true },
      },
      participant_teammember: {
        select: { email: true },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  const formattedTeams = allUserTeams.map((ut) => {
    const leaderInMembers = ut.participant_teammember.some(
      (m) => m.email.toLowerCase() === ut.accounts_user.email.toLowerCase()
    );
    const memberCount = leaderInMembers
      ? ut.participant_teammember.length
      : 1 + ut.participant_teammember.length;

    return {
      id: ut.id,
      name: ut.name,
      hackathonId: ut.hackathon_id,
      isLeader: ut.leader_id === userIdNum,
      isRegistered: ut.is_registered,
      hackathonName: ut.organizer_hackathon.name,
      hackathonStatus: ut.organizer_hackathon.status,
      startDate: ut.organizer_hackathon.start_date,
      endDate: ut.organizer_hackathon.end_date,
      hasQr: !!ut.qr_token,
      memberCount,
      minMembers: ut.organizer_hackathon.min_team_size,
      maxMembers: ut.organizer_hackathon.max_team_size,
    };
  });

  const registeredTeams = formattedTeams.filter((t) => t.isRegistered);
  const draftTeams = formattedTeams.filter((t) => !t.isRegistered);

  function formatDate(d: Date) {
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "registration":
      case "registration_open":
        return { label: "Registration Open", cls: "bg-info-light border-info/10 text-info" };
      case "active":
        return { label: "Active", cls: "bg-success-light border-success/10 text-success" };
      case "completed":
        return { label: "Completed", cls: "bg-canvas-parchment border-black/[0.08] text-ink-muted" };
      default:
        return { label: status, cls: "bg-canvas-parchment border-black/[0.08] text-ink-muted" };
    }
  }

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-ink tracking-tight flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          My Registrations
        </h2>
        <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
          Click any card to view full details, team info, problem statements, and your QR pass.
        </p>
      </div>

      {/* ─── ACTIVE REGISTRATIONS SECTION ─── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-ink-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Active Registrations ({registeredTeams.length})
        </h3>

        {registeredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {registeredTeams.map((team) => {
              const statusBadge = getStatusBadge(team.hackathonStatus);
              return (
                <Link
                  key={team.id}
                  href={`/participant/hackathons/${team.hackathonId}/hub`}
                  className="group p-6 rounded-lg bg-canvas border border-black/[0.06] hover:border-black/[0.15] transition-all duration-300 apple-shadow-overlay cursor-pointer block relative overflow-hidden"
                >
                  {/* Top accent */}
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-success" />

                  {/* Registration badge */}
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-sm font-semibold text-ink truncate pr-2 leading-snug group-hover:text-primary transition-colors">
                      {team.name}
                    </h4>
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[10px] font-semibold border shrink-0 bg-success-light border-success/15 text-success">
                      Registered
                    </span>
                  </div>

                  {/* Hackathon name */}
                  <div className="mb-3">
                    <p className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider mb-0.5">
                      Hackathon
                    </p>
                    <p className="text-xs font-semibold text-ink">{team.hackathonName}</p>
                  </div>

                  {/* Dates row */}
                  <div className="flex items-center gap-1.5 text-[10px] text-ink-muted mb-3">
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>{formatDate(team.startDate)} — {formatDate(team.endDate)}</span>
                  </div>

                  {/* Footer row */}
                  <div className="pt-3 border-t border-black/[0.05] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-pill text-[10px] font-semibold border ${statusBadge.cls}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-[10px] text-ink-muted font-medium flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {team.memberCount}/{team.maxMembers}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-medium text-primary group-hover:underline transition-colors">
                      View Details
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg p-8 text-center bg-canvas border border-dashed border-black/[0.12]">
            <p className="text-sm text-ink-muted">No active registrations found.</p>
          </div>
        )}
      </section>

      {/* ─── DRAFT / INCOMPLETE REGISTRATIONS SECTION ─── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2 text-ink-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse-dot" />
          Draft & Incomplete Teams ({draftTeams.length})
        </h3>

        {draftTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {draftTeams.map((team) => (
              <Link
                key={team.id}
                href={`/participant/dashboard/register/${team.id}`}
                className="group p-6 rounded-lg bg-canvas border border-black/[0.06] hover:border-black/[0.15] transition-all duration-300 apple-shadow-overlay cursor-pointer block relative overflow-hidden"
              >
                {/* Amber top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-warning" />

                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-sm font-semibold text-ink truncate pr-2 leading-snug group-hover:text-primary transition-colors">
                    {team.name}
                  </h4>
                  <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill text-[10px] font-semibold border shrink-0 bg-warning-light border-warning/15 text-warning">
                    Draft
                  </span>
                </div>

                {/* Hackathon name */}
                <div className="mb-3">
                  <p className="text-[10px] text-ink-muted font-semibold uppercase tracking-wider mb-0.5">
                    Hackathon
                  </p>
                  <p className="text-xs font-semibold text-ink">{team.hackathonName}</p>
                </div>

                {/* Dates row */}
                <div className="flex items-center gap-1.5 text-[10px] text-ink-muted mb-3">
                  <Calendar className="w-3 h-3 shrink-0" />
                  <span>{formatDate(team.startDate)} — {formatDate(team.endDate)}</span>
                </div>

                {/* Footer: member count + CTA arrow */}
                <div className="pt-3 border-t border-black/[0.05] flex items-center justify-between">
                  <span className="text-[10px] text-ink-muted font-medium flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {team.memberCount}/{team.maxMembers} members
                  </span>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-primary group-hover:underline transition-colors">
                    Continue Registration
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg p-10 text-center bg-canvas border border-dashed border-black/[0.12]">
            <div className="w-12 h-12 rounded-full bg-canvas-parchment flex items-center justify-center mx-auto mb-4 border border-black/[0.04]">
              <Compass className="w-5 h-5 text-ink-muted" />
            </div>
            <h4 className="text-sm font-semibold text-ink mb-1">No Draft Registrations</h4>
            <p className="text-xs text-ink-muted max-w-sm mx-auto mb-5">
              Ready to challenge yourself? Browse active hackathons and form a team to get started.
            </p>
            <Link
              href="/participant/hackathons"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline transition"
            >
              Browse Open Hackathons <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

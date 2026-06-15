import React from "react";
import { auth } from "@/auth";
import {
  User,
  Mail,
  Compass,
  Trophy,
  Users,
  AlertCircle,
  Calendar,
  ChevronRight,
  Settings,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Participant Dashboard | Syntra",
  description: "Manage your hackathon teams, profile, registrations, and check-in passes.",
};

export default async function ParticipantDashboard(props: {
  searchParams: Promise<{ hackathonId?: string }>;
}) {
  const session = await auth();

  const userIdNum = Number(session?.user?.id);
  const userEmail = session?.user?.email || "";

  // Fetch user teams and pending invites count in parallel (excluding expired draft teams)
  const [allUserTeams, pendingInvitesCount] = await Promise.all([
    prisma.participant_team.findMany({
      where: {
        OR: [
          { leader_id: userIdNum },
          {
            participant_teammember: {
              some: { email: userEmail },
            },
          },
        ],
        NOT: {
          is_registered: false,
          organizer_hackathon: {
            OR: [
              { status: { notIn: ["registration", "registration_open", "published"] } },
              { registration_deadline: { lt: new Date() } },
            ],
          },
        },
      },
      select: {
        id: true,
        name: true,
        hackathon_id: true,
        leader_id: true,
        is_registered: true,
        qr_token: true,
        organizer_hackathon: {
          select: { name: true, max_team_size: true },
        },
        accounts_user: {
          select: { email: true },
        },
        participant_teammember: {
          select: { email: true },
        },
      },
    }),
    prisma.participant_teamrequest.count({
      where: {
        receiver_id: userIdNum,
        status: "pending",
      },
    }),
  ]);

  const userTeams = allUserTeams.map((ut) => {
    const leaderInMembers = ut.participant_teammember.some(
      (m) => m.email.toLowerCase() === ut.accounts_user.email.toLowerCase()
    );
    const memberCount = leaderInMembers ? ut.participant_teammember.length : 1 + ut.participant_teammember.length;

    return {
      id: ut.id,
      name: ut.name,
      hackathonId: ut.hackathon_id,
      isLeader: ut.leader_id === userIdNum,
      isRegistered: ut.is_registered,
      hackathonName: ut.organizer_hackathon.name,
      hasQr: !!ut.qr_token,
      memberCount,
      maxMembers: ut.organizer_hackathon.max_team_size,
    };
  });

  const activeRegistrations = userTeams.filter((t) => t.isRegistered);

  // Get hackathons in registration phase (excluding ones they already have a team in)
  const userTeamHackathonIds = allUserTeams.map((ut) => ut.hackathon_id);
  const availableHackathons = await prisma.organizer_hackathon.findMany({
    where: {
      status: { in: ["registration", "registration_open", "published"] },
      registration_deadline: { gte: new Date() },
      id: { notIn: userTeamHackathonIds },
    },
    select: {
      id: true,
      name: true,
      description: true,
      start_date: true,
      registration_deadline: true,
      max_team_size: true,
      min_team_size: true,
      status: true,
    },
    orderBy: { registration_deadline: "asc" },
    take: 3, // Limit to top 3 upcoming on dashboard
  });

  // Helpers
  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] || "?").toUpperCase();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
      
      {/* ─── INTEGRATED HEADER & PROFILE BANNER ─── */}
      <div className="bg-canvas rounded-lg p-6 border border-black/[0.06] apple-shadow-overlay">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-md bg-tile-black flex items-center justify-center text-white font-bold text-base md:text-lg shrink-0">
              {getInitials(session?.user?.name || "P")}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-ink leading-tight">
                Welcome back, {session?.user?.name || "Participant"}!
              </h2>
              <p className="text-[11px] text-ink-muted mt-1.5 flex items-center gap-2">
                <span>{session?.user?.email}</span>
                <span className="w-1 h-1 rounded-full bg-black/[0.12]" />
                <span className="text-primary font-semibold uppercase tracking-wider text-[9px]">
                  Participant Profile
                </span>
              </p>
            </div>
          </div>

          {/* Header Stats */}
          <div className="flex gap-4 shrink-0">
            <div className="text-center px-4 py-2.5 rounded-md bg-canvas-parchment border border-black/[0.05] min-w-[80px]">
              <p className="text-lg font-semibold text-ink leading-none">{userTeams.length}</p>
              <p className="text-[9px] text-ink-muted font-semibold uppercase tracking-wider mt-1.5">Total Teams</p>
            </div>
            <div className="text-center px-4 py-2.5 rounded-md bg-canvas-parchment border border-black/[0.05] min-w-[80px]">
              <p className="text-lg font-semibold text-primary leading-none">{activeRegistrations.length}</p>
              <p className="text-[9px] text-ink-muted font-semibold uppercase tracking-wider mt-1.5">Registered</p>
            </div>
          </div>
        </div>

        {/* Integrated Quick Action Button Pills */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-black/[0.06]">
          <Link
            href="/participant/hackathons"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-pill bg-canvas-pearl hover:bg-canvas-parchment border border-black/[0.08] text-xs font-normal text-ink transition apple-press-effect"
          >
            <Compass className="w-3.5 h-3.5 text-primary" />
            Explore Hackathons
          </Link>
          <Link
            href="/participant/registrations"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-pill bg-canvas-pearl hover:bg-canvas-parchment border border-black/[0.08] text-xs font-normal text-ink transition apple-press-effect"
          >
            <Trophy className="w-3.5 h-3.5 text-primary" />
            My Registrations
          </Link>
          <Link
            href="/participant/inbox"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-pill bg-canvas-pearl hover:bg-canvas-parchment border border-black/[0.08] text-xs font-normal text-ink transition relative apple-press-effect"
          >
            <Mail className="w-3.5 h-3.5 text-primary" />
            Team Inbox
            {pendingInvitesCount > 0 && (
              <span className="flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full text-[8px] font-semibold bg-primary text-white ml-1">
                {pendingInvitesCount}
              </span>
            )}
          </Link>
          <Link
            href="/participant/profile"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-pill bg-canvas-pearl hover:bg-canvas-parchment border border-black/[0.08] text-xs font-normal text-ink transition apple-press-effect"
          >
            <Settings className="w-3.5 h-3.5 text-primary" />
            Profile Settings
          </Link>
        </div>
      </div>

      {/* ─── PENDING INVITES ALERT BANNER ─── */}
      {pendingInvitesCount > 0 && (
        <div className="p-4 rounded-lg bg-warning-light border border-warning/10 text-warning flex items-center justify-between gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-warning" />
            <div>
              <span className="font-semibold">You have pending invitations!</span> You have been invited to join {pendingInvitesCount} hackathon team(s).
            </div>
          </div>
          <Link
            href="/participant/inbox"
            className="px-3 py-1.5 rounded-pill bg-primary text-white font-normal text-xs hover:bg-primary-focus transition apple-press-effect flex items-center gap-0.5 cursor-pointer shadow-sm"
          >
            Open Inbox <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ─── TWO COLUMN GRID LAYOUT ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Active Teams Console) */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-canvas rounded-lg p-6 border border-black/[0.06] apple-shadow-overlay flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Trophy className="w-4.5 h-4.5 text-primary" />
                Active Teams
              </h3>
              <Link
                href="/participant/registrations"
                className="text-[12px] text-primary hover:underline font-normal flex items-center gap-0.5"
              >
                Manage All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {userTeams.length > 0 ? (
              <div className="flex flex-col divide-y divide-black/[0.05]">
                {userTeams.slice(0, 3).map((team) => (
                  <Link
                    key={team.id}
                    href={
                      team.isRegistered
                        ? `/participant/hackathons/${team.hackathonId}/hub`
                        : `/participant/dashboard/register/${team.id}`
                    }
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-canvas-parchment/20 transition-all duration-200 group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ink leading-none">{team.name}</span>
                        <span
                          className={`text-[9px] font-semibold px-2 py-0.5 rounded-pill border ${
                            team.isRegistered
                              ? "bg-success-light border-success/10 text-success"
                              : "bg-warning-light border-warning/10 text-warning"
                          }`}
                        >
                          {team.isRegistered ? "Registered" : "Draft"}
                        </span>
                      </div>
                      <p className="text-xs text-ink-muted mt-1 leading-none">{team.hackathonName}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-6">
                      {/* Teammates count */}
                      <div className="flex items-center gap-1.5 text-ink-muted text-xs font-normal">
                        <Users className="w-3.5 h-3.5 text-ink-muted/65" />
                        <span>{team.memberCount} / {team.maxMembers} Members</span>
                      </div>
                      <span className="flex items-center gap-0.5 text-xs font-normal text-primary group-hover:underline">
                        {team.isRegistered ? "View Hub" : "Continue"}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-black/[0.12] rounded-lg bg-canvas-parchment/10">
                <p className="text-xs text-ink-muted">You are not currently in any teams.</p>
                <Link
                  href="/participant/hackathons"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-normal mt-2"
                >
                  Join or Create a Team <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Upcoming Events Timeline) */}
        <div className="flex flex-col gap-5">
          <div className="bg-canvas rounded-lg p-6 border border-black/[0.06] apple-shadow-overlay flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-primary" />
                Upcoming Events
              </h3>
            </div>

            {availableHackathons.length > 0 ? (
              <div className="flex flex-col gap-3">
                {availableHackathons.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 rounded-md bg-canvas-parchment/40 border border-black/[0.04] flex flex-col gap-1.5 hover:bg-canvas-parchment/80 transition"
                  >
                    <h4 className="text-xs font-semibold text-ink">{h.name}</h4>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-ink-muted font-normal">
                      <span>Ends {formatDate(h.registration_deadline)}</span>
                      <Link
                        href={`/participant/dashboard/register/new?hackathonId=${h.id}`}
                        className="text-primary hover:underline font-medium flex items-center gap-0.5"
                      >
                        Register <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-black/[0.12] rounded-lg bg-canvas-parchment/10">
                <p className="text-xs text-ink-muted">No open hackathons found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

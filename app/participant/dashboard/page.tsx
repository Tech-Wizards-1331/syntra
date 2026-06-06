import React from "react";
import { auth } from "@/auth";
import {
  User,
  Mail,
  QrCode,
  Compass,
  Trophy,
  Users,
  Sparkles,
  AlertCircle,
  Calendar,
  ChevronRight,
  Settings,
  ArrowRight,
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

  // Clean up any expired draft teams for this user before displaying the dashboard
  const expiredDrafts = await prisma.participant_team.findMany({
    where: {
      is_registered: false,
      OR: [
        { leader_id: userIdNum },
        { participant_teammember: { some: { email: userEmail } } },
      ],
      organizer_hackathon: {
        OR: [
          { status: { notIn: ["registration", "registration_open", "published"] } },
          { registration_deadline: { lt: new Date() } },
        ],
      },
    },
    select: { id: true },
  });

  if (expiredDrafts.length > 0) {
    const expiredDraftIds = expiredDrafts.map((d) => d.id);
    await prisma.$transaction(async (tx) => {
      // Cascadingly delete team member skills
      const members = await tx.participant_teammember.findMany({
        where: { team_id: { in: expiredDraftIds } },
      });
      const memberIds = members.map((m) => m.id);
      await tx.participant_teammember_skills.deleteMany({
        where: { teammember_id: { in: memberIds } },
      });
      // Delete scan records
      await tx.organizer_scanrecord.deleteMany({
        where: { team_member_id: { in: memberIds } },
      });
      // Delete members
      await tx.participant_teammember.deleteMany({
        where: { team_id: { in: expiredDraftIds } },
      });
      // Delete team requests
      await tx.participant_teamrequest.deleteMany({
        where: { team_id: { in: expiredDraftIds } },
      });
      // Delete payments
      await tx.participant_payment.deleteMany({
        where: { team_id: { in: expiredDraftIds } },
      });
      // Delete teams
      await tx.participant_team.deleteMany({
        where: { id: { in: expiredDraftIds } },
      });
    });
  }

  // Find all teams the user is currently in (both as leader or as member)
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
        select: { name: true, max_team_size: true },
      },
      accounts_user: {
        select: { email: true },
      },
      participant_teammember: {
        select: { email: true },
      },
    },
  });

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

  // Count pending invites
  const pendingInvitesCount = await prisma.participant_teamrequest.count({
    where: {
      receiver_id: userIdNum,
      status: "pending",
    },
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
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 z-10 flex flex-col gap-6 animate-fade-in-up">
      {/* ─── INTEGRATED HEADER & PROFILE BANNER ─── */}
      <div className="glass-card rounded-2xl p-6 gradient-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-base md:text-lg shadow-lg shadow-teal-500/20 shrink-0">
              {getInitials(session?.user?.name || "P")}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white leading-tight">
                Welcome back, {session?.user?.name || "Participant"}!
              </h2>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                <span>{session?.user?.email}</span>
                <span className="w-1 h-1 rounded-full bg-slate-800" />
                <span className="text-teal-400 font-bold uppercase tracking-wider text-[9px]">
                  Participant Profile
                </span>
              </p>
            </div>
          </div>

          {/* Header Stats */}
          <div className="flex gap-4 shrink-0">
            <div className="text-center px-3 py-2 rounded-xl bg-slate-900/30 border border-slate-900/60 min-w-[70px]">
              <p className="text-lg font-black text-white leading-none">{userTeams.length}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Total Teams</p>
            </div>
            <div className="text-center px-3 py-2 rounded-xl bg-slate-900/30 border border-slate-900/60 min-w-[70px]">
              <p className="text-lg font-black text-teal-400 leading-none">{activeRegistrations.length}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">Registered</p>
            </div>
          </div>
        </div>

        {/* Integrated Quick Action Button Pills */}
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-800/40">
          <Link
            href="/participant/hackathons"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/50 hover:border-slate-800 text-xs font-bold text-slate-350 hover:text-white transition"
          >
            <Compass className="w-3.5 h-3.5 text-teal-400" />
            Explore Hackathons
          </Link>
          <Link
            href="/participant/registrations"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/50 hover:border-slate-800 text-xs font-bold text-slate-350 hover:text-white transition"
          >
            <Trophy className="w-3.5 h-3.5 text-teal-400" />
            My Registrations
          </Link>
          <Link
            href="/participant/inbox"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/50 hover:border-slate-800 text-xs font-bold text-slate-350 hover:text-white transition relative"
          >
            <Mail className="w-3.5 h-3.5 text-teal-400" />
            Team Inbox
            {pendingInvitesCount > 0 && (
              <span className="flex items-center justify-center min-w-[14px] h-[14px] px-1 rounded-full text-[8px] font-black bg-teal-500 text-slate-950 ml-1 shadow-[0_0_8px_rgba(20,184,166,0.3)]">
                {pendingInvitesCount}
              </span>
            )}
          </Link>
          <Link
            href="/participant/profile"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900/40 hover:bg-slate-900/80 border border-slate-800/50 hover:border-slate-800 text-xs font-bold text-slate-350 hover:text-white transition"
          >
            <Settings className="w-3.5 h-3.5 text-teal-400" />
            Profile Settings
          </Link>
        </div>
      </div>

      {/* ─── PENDING INVITES ALERT BANNER ─── */}
      {pendingInvitesCount > 0 && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/15 text-teal-400 flex items-center justify-between gap-3 text-xs md:text-sm animate-pulse-light">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div>
              <span className="font-bold">You have pending invitations!</span> You have been invited to join {pendingInvitesCount} hackathon team(s).
            </div>
          </div>
          <Link
            href="/participant/inbox"
            className="px-3 py-1 rounded-md bg-teal-500 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-0.5 cursor-pointer"
          >
            Open Inbox <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* ─── TWO COLUMN GRID LAYOUT (Option A) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Active Teams Console) */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-teal-400" />
                Active Teams
              </h3>
              <Link
                href="/participant/registrations"
                className="text-[10px] text-teal-400 hover:text-teal-350 font-bold flex items-center gap-0.5"
              >
                Manage All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {userTeams.length > 0 ? (
              <div className="flex flex-col gap-3">
                {userTeams.slice(0, 3).map((team) => (
                  <div
                    key={team.id}
                    className="p-4 rounded-xl bg-slate-900/20 border border-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-800/80 transition duration-200"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white leading-none">{team.name}</span>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${
                            team.isRegistered
                              ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                              : "bg-amber-500/10 border-amber-500/25 text-amber-400"
                          }`}
                        >
                          {team.isRegistered ? "Registered" : "Draft"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-455 mt-1 font-medium">{team.hackathonName}</p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-4">
                      {/* Teammates count */}
                      <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                        <Users className="w-3.5 h-3.5" />
                        <span>
                          {team.memberCount} / {team.maxMembers}
                        </span>
                      </div>
                      <Link
                        href={`/participant/dashboard/register/${team.id}`}
                        className="px-3 py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800/60 border border-slate-800/60 text-slate-200 text-xs font-bold transition-all text-center cursor-pointer"
                      >
                        {team.isRegistered ? "Manage" : "Continue"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-xl">
                <p className="text-xs text-slate-500">You are not currently in any teams.</p>
                <Link
                  href="/participant/hackathons"
                  className="inline-flex items-center gap-1 text-xs text-teal-400 hover:underline font-bold mt-2"
                >
                  Join or Create a Team <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Upcoming Events Timeline) */}
        <div className="flex flex-col gap-5">
          <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-400" />
                Upcoming Events
              </h3>
            </div>

            {availableHackathons.length > 0 ? (
              <div className="flex flex-col gap-3">
                {availableHackathons.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 rounded-xl bg-slate-900/20 border border-slate-900/60 flex flex-col gap-1.5 hover:border-slate-800 transition"
                  >
                    <h4 className="text-xs font-bold text-slate-200">{h.name}</h4>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-semibold">
                      <span>Ends {formatDate(h.registration_deadline)}</span>
                      <Link
                        href={`/participant/dashboard/register/new?hackathonId=${h.id}`}
                        className="text-teal-450 hover:text-teal-350 font-bold flex items-center gap-0.5"
                      >
                        Register <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-800/80 rounded-xl">
                <p className="text-xs text-slate-500">No open hackathons found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

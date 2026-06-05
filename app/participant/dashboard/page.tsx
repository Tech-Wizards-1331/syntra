import React from "react";
import { auth } from "@/auth";
import {
  User,
  Mail,
  Shield,
  QrCode,
  Compass,
  ExternalLink,
  Trophy,
  ArrowRight,
  Users,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import InboxSection from "./InboxSection";
import ParticipantShell from "./ParticipantShell";

export const metadata = {
  title: "Participant Dashboard | Syntra",
  description: "Manage your hackathon teams, profile, registrations, and attendance QR codes.",
};

export default async function ParticipantDashboard(props: {
  searchParams: Promise<{ hackathonId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const session = await auth();

  const userIdNum = Number(session?.user?.id);
  const userEmail = session?.user?.email || "";
  const selectedHackathonId = searchParams.hackathonId ? Number(searchParams.hackathonId) : null;

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

  // Determine if user has any registered team
  const hasRegisteredTeam = allUserTeams.some((ut) => ut.is_registered);

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
  });

  // Fetch participant profile visibility for the Inbox toggle
  const participantProfile = await prisma.participant_participantprofile.findUnique({
    where: { user_id: userIdNum },
    select: { visibility: true },
  });
  const profileVisibility = participantProfile?.visibility ?? false;

  // Helpers
  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0]?.[0] || "?").toUpperCase();
  };

  return (
    <ParticipantShell>
      {/* Welcome Section — Premium Glass Card */}
      <div className="glass-card rounded-2xl p-8 gradient-border animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Avatar with gradient initials */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-teal-500/20 shrink-0">
              {getInitials(session?.user?.name || "P")}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Welcome back, {session?.user?.name || "Participant"}!
              </h2>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {session?.user?.email}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700 hidden sm:inline" />
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-500" />
                  Profile ID: {session?.user?.profileId || "None"}
                </span>
              </div>
            </div>
          </div>
          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="text-center px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-800/60">
              <p className="text-2xl font-black text-white">{userTeams.length}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Teams</p>
            </div>
            <div className="text-center px-4 py-2 rounded-xl bg-slate-800/40 border border-slate-800/60">
              <p className="text-2xl font-black text-emerald-400">{userTeams.filter(t => t.isRegistered).length}</p>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Browse All Hackathons */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up stagger-1">
        <Link
          href="/participant/hackathons"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card glass-card-hover text-sm font-medium text-slate-300 hover:text-teal-400 transition-all duration-200 group"
        >
          <Compass className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          Browse All Hackathons
          <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
        </Link>
      </div>

      {/* My Teams & Registrations */}
      {userTeams.length > 0 ? (
        <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-2">
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-teal-400" />
            My Teams & Registrations
            <span className="ml-auto text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{userTeams.length} total</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTeams.map((ut, idx) => (
              <div
                key={ut.id}
                className={`p-5 rounded-xl glass-card glass-card-hover relative overflow-hidden group animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
              >
                {/* Accent glow on top */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] ${
                  ut.isRegistered
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : "bg-gradient-to-r from-amber-500 to-yellow-500"
                }`} />

                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white truncate pr-2">{ut.name}</h4>
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                      ut.isRegistered
                        ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                        : "bg-amber-500/10 border-amber-500/25 text-amber-400"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      ut.isRegistered ? "bg-emerald-400" : "bg-amber-400 animate-pulse-dot"
                    }`} />
                    {ut.isRegistered ? "Registered" : "Draft"}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-teal-500/50" />
                  {ut.hackathonName}
                </p>

                {/* Member Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Members
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{ut.memberCount}/{ut.maxMembers}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        ut.isRegistered
                          ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                          : "bg-gradient-to-r from-amber-500 to-yellow-500"
                      }`}
                      style={{ width: `${Math.min((ut.memberCount / ut.maxMembers) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
                  <Link
                    href={`/participant/dashboard/register/${ut.id}`}
                    className={`text-[11px] font-bold transition-all duration-200 hover:scale-[1.02] px-3 py-1.5 rounded-lg ${
                      ut.isRegistered
                        ? "text-teal-400 hover:bg-teal-500/10"
                        : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                    }`}
                  >
                    {ut.isRegistered ? "View" : "Continue →"}
                  </Link>
                  {ut.isRegistered && (
                    <>
                      <Link
                        href={`/participant/hackathons/${ut.hackathonId}/hub`}
                        className="text-[11px] text-teal-400 hover:text-teal-300 transition flex items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-teal-500/10"
                      >
                        Hub <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                      {ut.hasQr && (
                        <Link
                          href={`/participant/hackathons/${ut.hackathonId}/pass`}
                          className="text-[11px] text-teal-400 hover:text-teal-300 transition flex items-center gap-0.5 px-2 py-1.5 rounded-lg hover:bg-teal-500/10"
                        >
                          Pass <QrCode className="w-2.5 h-2.5" />
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Welcome / Empty State */
        <div className="glass-card rounded-2xl p-10 text-center animate-fade-in-up stagger-2">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-500/20 flex items-center justify-center mx-auto mb-5 animate-float">
            <Trophy className="w-10 h-10 text-teal-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Active Registrations</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-8">
            You are not currently registered in a team for any active hackathon. Explore upcoming events and create a new team to get started.
          </p>
          <Link
            href="/participant/hackathons"
            className="btn-cta-shimmer inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-sm hover:brightness-110 hover:scale-[1.02] active:scale-95 transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgba(20,184,166,0.25)] hover:shadow-[0_8px_30px_rgba(20,184,166,0.35)] group"
          >
            Browse Open Hackathons
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {/* Inbox & Recruiting */}
      {!hasRegisteredTeam && (
        <div className="animate-fade-in-up stagger-3">
          <InboxSection
            initialVisibility={profileVisibility}
            hasTeam={allUserTeams.length > 0}
          />
        </div>
      )}
    </ParticipantShell>
  );
}

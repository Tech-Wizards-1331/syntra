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
  CheckCircle2,
  AlertCircle,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: "Participant Control Center | Syntra",
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
  const draftRegistrations = userTeams.filter((t) => !t.isRegistered);

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

  // Fetch participant profile info for completion score calculation
  const participantProfile = await prisma.participant_participantprofile.findUnique({
    where: { user_id: userIdNum },
    select: {
      visibility: true,
      college: true,
      semester: true,
      degree: true,
      participant_participantprofile_skills: {
        select: { skill_id: true }
      }
    },
  });

  // Calculate profile completion percentage
  let profileCompletionScore = 0;
  if (participantProfile) {
    if (participantProfile.college && participantProfile.college !== "Not Specified") {
      profileCompletionScore += 20;
    }
    if (participantProfile.semester && participantProfile.semester > 0) {
      profileCompletionScore += 20;
    }
    if (participantProfile.degree && participantProfile.degree !== "Not Specified") {
      profileCompletionScore += 20;
    }
    if (
      participantProfile.participant_participantprofile_skills &&
      participantProfile.participant_participantprofile_skills.length > 0
    ) {
      profileCompletionScore += 20;
    }
    profileCompletionScore += 20; // Document created, recruiting preference checked
  }

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
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-6 animate-fade-in-up">
      {/* ─── HEADER & PROFILE BANNER ─── */}
      <div className="glass-card rounded-2xl p-6 md:p-8 gradient-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-lg md:text-xl shadow-lg shadow-teal-500/20 shrink-0">
              {getInitials(session?.user?.name || "P")}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white leading-tight">
                Welcome back, {session?.user?.name || "Participant"}!
              </h2>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{session?.user?.email}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <span className="text-teal-400 font-semibold uppercase tracking-wider text-[10px]">
                  Role: {session?.user?.role}
                </span>
              </p>
            </div>
          </div>

          {/* Core Stats Overview */}
          <div className="flex gap-4 shrink-0">
            <div className="text-center px-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-900/60 min-w-[80px]">
              <p className="text-xl font-black text-white">{userTeams.length}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Total Teams</p>
            </div>
            <div className="text-center px-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-900/60 min-w-[80px]">
              <p className="text-xl font-black text-emerald-400">{activeRegistrations.length}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── PENDING INVITES ALERT BANNER ─── */}
      {pendingInvitesCount > 0 && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-between gap-3 text-xs md:text-sm animate-pulse-light">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">You have pending invitations!</span> You have been invited to join {pendingInvitesCount} hackathon team(s).
            </div>
          </div>
          <Link
            href="/participant/inbox"
            className="px-3.5 py-1.5 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
          >
            Open Inbox <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ─── GRID LAYOUT: LEFT SIDE FOR ACTIONS/STATUS, RIGHT SIDE FOR HACKATHONS ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Quick Actions Panel */}
          <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/participant/hackathons"
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/65 hover:bg-slate-900/80 hover:border-slate-800 transition text-center flex flex-col items-center gap-2 group"
              >
                <Compass className="w-5 h-5 text-teal-400 group-hover:rotate-45 transition-transform" />
                <span className="text-[11px] font-bold text-slate-200">Explore Hackathons</span>
              </Link>
              <Link
                href="/participant/registrations"
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/65 hover:bg-slate-900/80 hover:border-slate-800 transition text-center flex flex-col items-center gap-2 group"
              >
                <Trophy className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-200">My Registrations</span>
              </Link>
              <Link
                href="/participant/inbox"
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/65 hover:bg-slate-900/80 hover:border-slate-800 transition text-center flex flex-col items-center gap-2 group relative"
              >
                <Mail className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-200">Team Inbox</span>
                {pendingInvitesCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-500 animate-ping" />
                )}
              </Link>
              <Link
                href="/participant/profile"
                className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/65 hover:bg-slate-900/80 hover:border-slate-800 transition text-center flex flex-col items-center gap-2 group"
              >
                <User className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-200">My Profile</span>
              </Link>
            </div>
          </div>

          {/* Profile Completion Progress Card */}
          <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Profile Setup Progress</h3>
              <span className="text-xs font-black text-teal-400">{profileCompletionScore}%</span>
            </div>
            <div>
              <div className="h-2 bg-slate-900 border border-slate-900/60 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
                  style={{ width: `${profileCompletionScore}%` }}
                />
              </div>
              {profileCompletionScore < 100 ? (
                <p className="text-[11px] text-slate-400 flex items-start gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                  Complete your profile details to unlock recruiting visibility, letting event coordinators and team leaders invite you directly.
                  <Link href="/participant/profile" className="text-teal-400 font-bold hover:underline ml-1 inline-flex items-center gap-0.5">
                    Finish Profile <ChevronRight className="w-3 h-3" />
                  </Link>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Your profile is fully complete! Recruiting visibility is active.
                </p>
              )}
            </div>
          </div>

          {/* Active Teams & Status Control Panel */}
          <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Teams</h3>
              <Link
                href="/participant/registrations"
                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-0.5"
              >
                View All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {userTeams.length > 0 ? (
              <div className="flex flex-col gap-3">
                {userTeams.slice(0, 2).map((team) => (
                  <div
                    key={team.id}
                    className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
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
                      <p className="text-[10px] text-slate-400 mt-1">{team.hackathonName}</p>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Teammates count */}
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-bold text-slate-300">
                          {team.memberCount} / {team.maxMembers}
                        </span>
                      </div>
                      <Link
                        href={`/participant/dashboard/register/${team.id}`}
                        className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold transition-all text-center cursor-pointer"
                      >
                        {team.isRegistered ? "Manage Team" : "Continue"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
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

        {/* Right 1 Column - Upcoming Hackathons & Dates */}
        <div className="flex flex-col gap-6">
          <div className="glass-card rounded-2xl p-5 md:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Upcoming Events</h3>
              <Link
                href="/participant/hackathons"
                className="text-[10px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-0.5"
              >
                Browse All <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {availableHackathons.length > 0 ? (
              <div className="flex flex-col gap-4">
                {availableHackathons.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 rounded-xl bg-slate-900/40 border border-slate-900/60 flex flex-col gap-2 hover:border-slate-800 transition"
                  >
                    <h4 className="text-xs font-bold text-slate-200">{h.name}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                      {h.description || "No description provided."}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/45 text-[10px]">
                      <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        Deadline: {formatDate(h.registration_deadline)}
                      </div>
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
              <div className="text-center py-8">
                <p className="text-xs text-slate-500">No upcoming hackathons open for registration.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

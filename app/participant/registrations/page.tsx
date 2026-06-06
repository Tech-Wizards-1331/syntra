import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Trophy,
  Users,
  ExternalLink,
  QrCode,
  ArrowRight,
  Compass,
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
      hasQr: !!ut.qr_token,
      memberCount,
      minMembers: ut.organizer_hackathon.min_team_size,
      maxMembers: ut.organizer_hackathon.max_team_size,
      status: ut.organizer_hackathon.status,
    };
  });

  const registeredTeams = formattedTeams.filter((t) => t.isRegistered);
  const draftTeams = formattedTeams.filter((t) => !t.isRegistered);

  return (
    <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-8 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Trophy className="w-6 h-6 text-teal-400" />
          My Registrations
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Manage your active registrations and drafts for current and upcoming hackathons.
        </p>
      </div>

      {/* ─── ACTIVE REGISTRATIONS SECTION ─── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Active Registrations ({registeredTeams.length})
        </h3>

        {registeredTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {registeredTeams.map((team) => (
              <div
                key={team.id}
                className="glass-card p-6 rounded-2xl relative overflow-hidden group gradient-border"
              >
                {/* Accent glow line on top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500" />

                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white truncate pr-2">
                    {team.name}
                  </h4>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 bg-emerald-500/10 border-emerald-500/25 text-emerald-400">
                    <span className="w-1.2 h-1.2 rounded-full bg-emerald-400" />
                    Registered
                  </span>
                </div>

                <div className="space-y-4 mb-5">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      Hackathon
                    </p>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5">
                      {team.hackathonName}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Teammates
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {team.memberCount} / {team.maxMembers}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{
                          width: `${(team.memberCount / team.maxMembers) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Registration Action Buttons */}
                <div className="flex items-center gap-3 pt-3 border-t border-slate-800/40">
                  <Link
                    href={`/participant/dashboard/register/${team.id}`}
                    className="text-xs font-bold px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all flex-1 text-center"
                  >
                    Manage Team
                  </Link>
                  <Link
                    href={`/participant/hackathons/${team.hackathonId}/hub`}
                    className="text-xs font-bold px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 transition-all flex items-center justify-center gap-1 shrink-0"
                  >
                    Hub <ExternalLink className="w-3 h-3" />
                  </Link>
                  {team.hasQr && (
                    <Link
                      href={`/participant/hackathons/${team.hackathonId}/pass`}
                      className="text-xs font-bold px-3 py-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 transition-all flex items-center justify-center gap-1 shrink-0"
                    >
                      Pass <QrCode className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center border border-slate-900/60 bg-slate-900/10">
            <p className="text-sm text-slate-400">No active registrations found.</p>
          </div>
        )}
      </section>

      {/* ─── DRAFT / INCOMPLETE REGISTRATIONS SECTION ─── */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Draft & Incomplete Teams ({draftTeams.length})
        </h3>

        {draftTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {draftTeams.map((team) => (
              <div
                key={team.id}
                className="glass-card p-6 rounded-2xl relative overflow-hidden group"
              >
                {/* Accent glow line on top */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 to-yellow-500" />

                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-white truncate pr-2">
                    {team.name}
                  </h4>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 bg-amber-500/10 border-amber-500/25 text-amber-400">
                    <span className="w-1.2 h-1.2 rounded-full bg-amber-400 animate-pulse-dot" />
                    Draft
                  </span>
                </div>

                <div className="space-y-4 mb-5">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                      Hackathon
                    </p>
                    <p className="text-xs font-semibold text-slate-200 mt-0.5">
                      {team.hackathonName}
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Teammates
                      </span>
                      <span className="text-xs font-bold text-slate-300">
                        {team.memberCount} / {team.maxMembers}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"
                        style={{
                          width: `${(team.memberCount / team.maxMembers) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Draft Actions */}
                <div className="pt-3 border-t border-slate-800/40">
                  <Link
                    href={`/participant/dashboard/register/${team.id}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 text-xs font-bold transition-all text-center group/btn"
                  >
                    Continue Registration
                    <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-10 text-center border border-slate-900/60 bg-slate-900/10">
            <div className="w-12 h-12 rounded-xl bg-slate-800/40 flex items-center justify-center mx-auto mb-4">
              <Compass className="w-6 h-6 text-slate-500" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">No Draft Registrations</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              Ready to challenge yourself? Browse active hackathons and form a team to get started.
            </p>
            <Link
              href="/participant/hackathons"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-400 hover:text-teal-350 transition"
            >
              Browse Open Hackathons <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}

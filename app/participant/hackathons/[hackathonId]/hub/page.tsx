import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
} from "lucide-react";
import HubClient from "./HubClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ hackathonId: string }>;
}) {
  const { hackathonId } = await params;
  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: Number(hackathonId) },
    select: { name: true },
  });
  return {
    title: `${hackathon?.name || "Hackathon"} Hub | Syntra`,
    description: `View your team details, problem statement selection, and seating for ${hackathon?.name || "this hackathon"}.`,
  };
}

interface HubPageProps {
  params: Promise<{ hackathonId: string }>;
}

export default async function HackathonHubPage({ params }: HubPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { hackathonId: hackathonIdStr } = await params;
  const hackathonId = Number(hackathonIdStr);
  const userId = Number(session.user.id);
  const userEmail = session.user.email || "";

  // Fetch hackathon details
  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: hackathonId },
    select: {
      id: true,
      name: true,
      description: true,
      start_date: true,
      end_date: true,
      registration_deadline: true,
      status: true,
      max_team_size: true,
      min_team_size: true,
      seating_allocation: true,
      release_problems: true,
    },
  });

  if (!hackathon) {
    redirect("/participant/dashboard");
  }

  // Find user's team for this hackathon (mirrors Django's _get_team)
  let team = await prisma.participant_team.findFirst({
    where: { leader_id: userId, hackathon_id: hackathonId },
    include: {
      accounts_user: {
        select: {
          email: true,
          full_name: true,
          participant_participantprofile: {
            include: {
              participant_participantprofile_skills: {
                include: { participant_skill: true },
              },
            },
          },
        },
      },
      participant_teammember: {
        include: {
          participant_teammember_skills: {
            include: { participant_skill: true },
          },
        },
      },
      organizer_problemstatement: {
        select: { id: true, title: true, description: true, pdf_file: true },
      },
    },
  });

  if (!team) {
    // Check if user is a member of a team
    const memberRecord = await prisma.participant_teammember.findFirst({
      where: {
        email: userEmail,
        participant_team: { hackathon_id: hackathonId, is_registered: true },
      },
      include: { participant_team: true },
    });
    if (memberRecord) {
      team = await prisma.participant_team.findUnique({
        where: { id: memberRecord.team_id },
        include: {
          accounts_user: {
            select: {
              email: true,
              full_name: true,
              participant_participantprofile: {
                include: {
                  participant_participantprofile_skills: {
                    include: { participant_skill: true },
                  },
                },
              },
            },
          },
          participant_teammember: {
            include: {
              participant_teammember_skills: {
                include: { participant_skill: true },
              },
            },
          },
          organizer_problemstatement: {
            select: { id: true, title: true, description: true, pdf_file: true },
          },
        },
      });
    }
  }

  if (!team) {
    redirect("/participant/dashboard");
  }

  const isLeader = team.leader_id === userId;

  // Fetch leader info
  const leader = await prisma.accounts_user.findUnique({
    where: { id: team.leader_id },
    select: { full_name: true, email: true },
  });

  // Extract seating allocation for this team (mirrors Django's _get_team_seating)
  let teamSeating: Record<string, unknown> | null = null;
  if (hackathon.seating_allocation) {
    try {
      const allocation =
        typeof hackathon.seating_allocation === "string"
          ? JSON.parse(hackathon.seating_allocation)
          : hackathon.seating_allocation;

      if (allocation && typeof allocation === "object") {
        const teams = allocation.teams || [];
        for (const entry of teams) {
          if (
            entry.name &&
            entry.name.trim().toLowerCase() === team.name.trim().toLowerCase()
          ) {
            teamSeating = entry;
            break;
          }
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Fetch problem statements with capacity (mirrors Django's _get_problem_statements)
  const problemStatements = hackathon.release_problems
    ? await prisma.organizer_problemstatement.findMany({
        where: {
          hackathon_id: hackathonId,
          is_active: true,
        },
        orderBy: { created_at: "desc" },
      })
    : [];

  // Compute current_teams_count for each PS
  const psWithCounts = await Promise.all(
    problemStatements.map(async (ps) => {
      const count = await prisma.participant_team.count({
        where: { selected_problem_statement_id: ps.id },
      });
      return {
        id: ps.id,
        title: ps.title,
        description: ps.description,
        pdf_file: ps.pdf_file,
        max_teams_allowed: ps.max_teams_allowed,
        current_teams_count: count,
        is_full: count >= ps.max_teams_allowed,
      };
    })
  );

  // Prepare serializable data for client component
  const hackathonData = {
    id: hackathon.id,
    name: hackathon.name,
    description: hackathon.description,
    start_date: hackathon.start_date.toISOString(),
    end_date: hackathon.end_date.toISOString(),
    registration_deadline: hackathon.registration_deadline.toISOString(),
    status: hackathon.status,
    max_team_size: hackathon.max_team_size,
    min_team_size: hackathon.min_team_size,
    release_problems: hackathon.release_problems,
  };

  // Check if leader email is present in team members
  const leaderEmail = team.accounts_user.email;
  const leaderInMembers = team.participant_teammember.some(
    (m) => m.email.toLowerCase() === leaderEmail.toLowerCase()
  );

  let normalizedMembers = [...team.participant_teammember];
  if (!leaderInMembers && team.accounts_user.participant_participantprofile) {
    const profile = team.accounts_user.participant_participantprofile;
    const virtualLeader = {
      id: -team.leader_id,
      name: team.accounts_user.full_name || team.accounts_user.email,
      email: team.accounts_user.email,
      college: profile.college,
      degree: profile.degree,
      semester: profile.semester,
      participant_teammember_skills: profile.participant_participantprofile_skills.map((ps) => ({
        participant_skill: { name: ps.participant_skill.name },
      })),
    };
    normalizedMembers = [virtualLeader as any, ...normalizedMembers];
  } else {
    // Ensure leader is always the first member
    const leaderIdx = normalizedMembers.findIndex(
      (m) => m.email.toLowerCase() === leaderEmail.toLowerCase()
    );
    if (leaderIdx > 0) {
      const leaderMember = normalizedMembers[leaderIdx];
      normalizedMembers.splice(leaderIdx, 1);
      normalizedMembers = [leaderMember, ...normalizedMembers];
    }
  }

  const teamData = {
    id: team.id,
    name: team.name,
    leader_id: team.leader_id,
    is_registered: team.is_registered,
    qr_token: team.qr_token,
    invite_token: team.invite_token,
    selected_problem_statement: team.organizer_problemstatement
      ? {
          id: team.organizer_problemstatement.id,
          title: team.organizer_problemstatement.title,
          description: team.organizer_problemstatement.description,
          pdf_file: team.organizer_problemstatement.pdf_file,
        }
      : null,
    members: normalizedMembers.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      college: m.college,
      degree: m.degree,
      semester: m.semester,
      skills: m.participant_teammember_skills.map(
        (s) => s.participant_skill.name
      ),
    })),
  };

  return (
    <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10">
      {/* Dynamic Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-tile-black flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Hackathon Hub
            </h1>
            <p className="text-[10px] text-primary font-medium tracking-wider uppercase">
              {hackathon.name}
            </p>
          </div>
        </div>

        <Link
          href="/participant/registrations"
          className="px-3.5 py-1.5 rounded-md bg-canvas-pearl border border-black/[0.08] hover:bg-canvas-parchment text-ink text-xs font-normal transition apple-press-effect flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-ink-muted" />
          My Registrations
        </Link>
      </div>

      <HubClient
        hackathon={hackathonData}
        team={teamData}
        isLeader={isLeader}
        leaderName={leader?.full_name || leader?.email || "Unknown"}
        problemStatements={psWithCounts}
        teamSeating={teamSeating as Record<string, unknown> | null}
      />
    </main>
  );
}

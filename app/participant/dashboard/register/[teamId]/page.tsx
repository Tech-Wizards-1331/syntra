import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Users, ClipboardList } from "lucide-react";
import CheckoutCard from "../../CheckoutCard";
import TeamDashboardClient from "../../TeamDashboardClient";
import QrDisplay from "../../QrDisplay";

export const metadata = {
  title: "Team Registration Details | Syntra",
  description: "Manage your hackathon team teammates, registration status, and payment checkout.",
};

export default async function TeamRegisterPage(props: {
  params: Promise<{ teamId: string }>;
}) {
  const params = await props.params;
  const teamIdNum = Number(params.teamId);
  if (isNaN(teamIdNum)) {
    return notFound();
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userIdNum = Number(session.user.id);
  const userEmail = session.user.email || "";

  // Fetch full team details
  const team = await prisma.participant_team.findUnique({
    where: { id: teamIdNum },
    include: {
      organizer_hackathon: {
        select: {
          id: true,
          name: true,
          max_team_size: true,
          min_team_size: true,
          status: true,
          is_paid: true,
          fee_amount: true,
          fee_type: true,
          room_configuration: true,
        },
      },
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
    },
  });

  if (!team) {
    return notFound();
  }

  // Security Gate: user must be team leader or member
  const isLeader = team.leader_id === userIdNum;
  const isMember = team.participant_teammember.some(
    (m) => m.email.toLowerCase() === userEmail.toLowerCase()
  );

  if (!isLeader && !isMember) {
    redirect("/participant/dashboard");
  }

  const isPaidHackathon = {
    isPaid: team.organizer_hackathon.is_paid,
    feeAmount: team.organizer_hackathon.fee_amount ? Number(team.organizer_hackathon.fee_amount) : 0,
  };

  // Check if hackathon registration capacity is full
  const registeredCount = await prisma.participant_team.count({
    where: {
      hackathon_id: team.organizer_hackathon.id,
      is_registered: true,
    },
  });

  let maxTeamsLimit: number | null = null;
  if (team.organizer_hackathon.room_configuration) {
    try {
      const parsed = JSON.parse(team.organizer_hackathon.room_configuration);
      if (Array.isArray(parsed)) {
        const meta = parsed.find((el: any) => el.room_no === "METADATA" && el.type === "metadata");
        if (meta && typeof meta.max_teams === "number") {
          maxTeamsLimit = meta.max_teams;
        }
      }
    } catch {}
  }

  const isHackathonFull = maxTeamsLimit !== null && registeredCount >= maxTeamsLimit;

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

  // Progress stepper calculation
  const memberCount = normalizedMembers.length;
  const minMembers = team.organizer_hackathon.min_team_size;
  const hasEnoughMembers = memberCount >= minMembers;

  const steps = [
    { label: "Team Created", complete: true },
    { label: "Members Added", complete: hasEnoughMembers },
    { label: "Registration Complete", complete: team.is_registered },
  ];

  return (
    <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-6 animate-fade-in-up">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/participant/dashboard"
          className="inline-flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-primary transition group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Dashboard
        </Link>
      </div>

      {/* Workspace Title Header */}
      <div className="p-6 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-primary font-semibold uppercase tracking-[0.2em]">
              Registration Workspace
            </span>
            <h2 className="text-2xl font-semibold text-ink mt-1">
              Team: {team.name}
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 font-medium">
              {team.organizer_hackathon.name} · {memberCount} members
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center">
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold border ${
                team.is_registered
                  ? "bg-success-light border-success/15 text-success"
                  : "bg-warning-light border-warning/15 text-warning"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${
                team.is_registered ? "bg-success" : "bg-warning animate-pulse-dot"
              }`} />
              {team.is_registered ? "Registered" : "Draft Status"}
            </span>
          </div>
        </div>

        {/* Registration Progress Stepper */}
        <div className="mt-6 pt-5 border-t border-black/[0.06]">
          <div className="flex items-center justify-between relative">
            {/* Connection line */}
            <div className="absolute top-4 left-[calc(16.67%)] right-[calc(16.67%)] h-[2px] bg-black/[0.08] z-0" />
            <div
              className="absolute top-4 left-[calc(16.67%)] h-[2px] bg-primary z-0 transition-all duration-700"
              style={{
                width: team.is_registered
                  ? "66.67%"
                  : hasEnoughMembers
                    ? "33.33%"
                    : "0%",
              }}
            />
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center relative z-10 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-500 ${
                    step.complete
                      ? "bg-primary border-primary text-white"
                      : "bg-canvas border-black/[0.12] text-ink-muted"
                  }`}
                >
                  {step.complete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    i === 0 ? <ClipboardList className="w-3.5 h-3.5" /> :
                    i === 1 ? <Users className="w-3.5 h-3.5" /> :
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className={`mt-2 text-[10px] font-semibold text-center ${
                  step.complete ? "text-primary" : "text-ink-muted"
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Card for Paid Registered Team */}
      {isPaidHackathon.isPaid && team.is_registered && (
        <div className="animate-fade-in-up">
          <CheckoutCard
            teamId={team.id}
            teamName={team.name}
            isRegistered={team.is_registered}
            amount={isPaidHackathon.feeAmount}
            razorpayKeyId={process.env.RAZORPAY_KEY_ID || ""}
            userEmail={session.user.email || ""}
            userName={session.user.name || ""}
          />
        </div>
      )}

      {/* Two-Column Grid for Workspace Form & QR Passes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TeamDashboardClient
            userId={userIdNum}
            team={{
              id: team.id,
              name: team.name,
              leader_id: team.leader_id,
              invite_token: null, // Invite token display removed as requested
              qr_token: team.qr_token,
              is_registered: team.is_registered,
              organizer_hackathon: {
                id: team.organizer_hackathon.id,
                name: team.organizer_hackathon.name,
                max_team_size: team.organizer_hackathon.max_team_size,
                min_team_size: team.organizer_hackathon.min_team_size,
                status: team.organizer_hackathon.status,
                is_paid: team.organizer_hackathon.is_paid,
                fee_amount: team.organizer_hackathon.fee_amount ? Number(team.organizer_hackathon.fee_amount) : null,
                fee_type: team.organizer_hackathon.fee_type,
              },
              participant_teammember: normalizedMembers,
            }}
            hackathons={[]}
            selectedHackathonId={team.organizer_hackathon.id}
            userTeams={[]}
            isHackathonFull={isHackathonFull}
          />
        </div>

        <div className="lg:col-span-1">
          {team.is_registered && team.qr_token && (
            <QrDisplay
              qrToken={team.qr_token}
              teamName={team.name}
              isQrActive={team.is_qr_active}
            />
          )}
        </div>
      </div>
    </main>
  );
}

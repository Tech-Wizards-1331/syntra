import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ParticipantSidebar from "./ParticipantSidebar";

export default async function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 1. Auth check
  if (!session?.user?.id) {
    redirect("/login");
  }

  // 2. Role check
  if (session.user.role !== "participant") {
    if (session.user.role === "organizer") {
      redirect("/organizer/dashboard");
    } else {
      redirect("/admin/dashboard");
    }
  }

  const userIdNum = Number(session.user.id);
  const userEmail = session.user.email || "";

  // 3. Query pending invites count and active registration in parallel
  const [pendingInvitesCount, registeredTeam] = await Promise.all([
    prisma.participant_teamrequest.count({
      where: {
        receiver_id: userIdNum,
        status: "pending",
      },
    }),
    prisma.participant_team.findFirst({
      where: {
        OR: [
          { leader_id: userIdNum },
          { participant_teammember: { some: { email: userEmail } } },
        ],
        is_registered: true,
      },
      select: {
        hackathon_id: true,
        organizer_hackathon: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const activePass = registeredTeam
    ? {
        hackathonId: registeredTeam.hackathon_id,
        hackathonName: registeredTeam.organizer_hackathon?.name || "Hackathon",
      }
    : null;

  return (
    <div className="min-h-screen bg-canvas-parchment text-ink flex flex-col font-sans relative selection:bg-primary selection:text-white overflow-x-hidden">
      <div className="flex flex-col lg:flex-row flex-1 relative z-10 w-full">
        {/* Unified Sidebar Navigation */}
        <ParticipantSidebar
          userName={session.user.name || "Participant"}
          userEmail={userEmail}
          pendingInvitesCount={pendingInvitesCount}
          activePass={activePass}
        />

        {/* Page Content Area wrapper */}
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

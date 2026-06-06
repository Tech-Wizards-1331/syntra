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

  // 3. Query pending invites count (lightweight count query)
  const pendingInvitesCount = await prisma.participant_teamrequest.count({
    where: {
      receiver_id: userIdNum,
      status: "pending",
    },
  });

  // 4. Query if there is an active registration for check-in pass
  const registeredTeam = await prisma.participant_team.findFirst({
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
  });

  const activePass = registeredTeam
    ? {
        hackathonId: registeredTeam.hackathon_id,
        hackathonName: registeredTeam.organizer_hackathon?.name || "Hackathon",
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-teal-500 selection:text-slate-900 overflow-x-hidden">
      {/* Animated Background Mesh */}
      <div className="bg-mesh-gradient fixed inset-0 pointer-events-none z-0">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      <div className="flex flex-1 relative z-10 w-full">
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

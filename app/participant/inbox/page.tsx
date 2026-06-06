import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InboxSection from "../dashboard/InboxSection";
import { Mail } from "lucide-react";

export const metadata = {
  title: "Team Inbox & Invites | Syntra",
  description: "View and manage incoming invitations to join hackathon teams.",
};

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userIdNum = Number(session.user.id);
  const userEmail = session.user.email || "";

  // Fetch participant profile visibility for the toggle
  const participantProfile = await prisma.participant_participantprofile.findUnique({
    where: { user_id: userIdNum },
    select: { visibility: true },
  });
  const profileVisibility = participantProfile?.visibility ?? false;

  // Determine if the user has any team for any active hackathon
  const userTeams = await prisma.participant_team.findMany({
    where: {
      OR: [
        { leader_id: userIdNum },
        { participant_teammember: { some: { email: userEmail } } },
      ],
    },
    select: { id: true },
  });

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-8 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Mail className="w-6 h-6 text-teal-400" />
          Team Inbox & Invites
        </h2>
        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
          Manage invitations to join other teams or toggle your visibility so organizers/team leaders can recruit you.
        </p>
      </div>

      {/* Renders the dynamic interactive inbox component */}
      <div className="glass-card p-6 rounded-2xl border border-slate-900/65 bg-slate-900/10">
        <InboxSection
          initialVisibility={profileVisibility}
          hasTeam={userTeams.length > 0}
        />
      </div>
    </main>
  );
}

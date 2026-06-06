import React from "react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, AlertTriangle, Layers } from "lucide-react";
import CreateTeamForm from "./CreateTeamForm";

export const metadata = {
  title: "New Team Registration | Syntra",
  description: "Form a new team to participate in upcoming hackathons.",
};

export default async function NewTeamRegistrationPage(props: {
  searchParams: Promise<{ hackathonId?: string }>;
}) {
  const searchParams = await props.searchParams;
  const hackathonIdStr = searchParams.hackathonId;
  if (!hackathonIdStr) {
    redirect("/participant/dashboard");
  }

  const hackathonIdNum = Number(hackathonIdStr);
  if (isNaN(hackathonIdNum)) {
    return notFound();
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const userIdNum = Number(session.user.id);
  const userEmail = session.user.email || "";

  // Fetch hackathon details
  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: hackathonIdNum },
  });

  if (!hackathon) {
    return notFound();
  }

  // Check if hackathon registration is open
  const isOpen = ["registration", "registration_open", "published"].includes(hackathon.status) &&
    new Date() <= hackathon.registration_deadline;

  if (!isOpen) {
    redirect("/participant/dashboard");
  }

  // Duplicate Team Prevention: Check if user is already in a team for this hackathon
  const existingTeam = await prisma.participant_team.findFirst({
    where: {
      hackathon_id: hackathonIdNum,
      OR: [
        { leader_id: userIdNum },
        { participant_teammember: { some: { email: userEmail } } },
      ],
    },
  });

  if (existingTeam) {
    // Redirect to the existing team registration page directly!
    redirect(`/participant/dashboard/register/${existingTeam.id}`);
  }

  return (
    <main className="relative flex-1 max-w-4xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-6 animate-fade-in-up">
      {/* Navigation Breadcrumb */}
      <div>
        <Link
          href="/participant/dashboard"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-teal-400 transition group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Dashboard
        </Link>
      </div>

      {/* Hackathon Details and Form Card */}
      <div className="glass-card gradient-border rounded-2xl p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-lg">
          <Calendar className="w-5 h-5 text-teal-400" />
          Team Registration
        </h3>

        <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/40 space-y-4">
          <div>
            <h4 className="font-bold text-white text-base mb-1">{hackathon.name}</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              {hackathon.description || "No description provided."}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/40">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/30">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Starts On</p>
                <p className="text-xs text-slate-300 font-bold">
                  {new Date(hackathon.start_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/30">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Deadline</p>
                <p className="text-xs text-amber-400 font-bold">
                  {new Date(hackathon.registration_deadline).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/40 border border-slate-800/30">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Team Size</p>
                <p className="text-xs text-slate-300 font-bold">
                  {hackathon.min_team_size} - {hackathon.max_team_size} members
                </p>
              </div>
            </div>
          </div>

          {/* Create Team Form component */}
          <CreateTeamForm hackathonId={hackathonIdNum} />
        </div>
      </div>
    </main>
  );
}

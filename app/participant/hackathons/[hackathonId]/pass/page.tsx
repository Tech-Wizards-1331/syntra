import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import TeamPassClient from "./TeamPassClient";

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
    title: `Team Pass | ${hackathon?.name || "Hackathon"} | Syntra`,
    description: `Your mobile team pass and QR code for ${hackathon?.name || "this hackathon"}.`,
  };
}

interface PassPageProps {
  params: Promise<{ hackathonId: string }>;
}

export default async function TeamPassPage({ params }: PassPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { hackathonId: hackathonIdStr } = await params;
  const hackathonId = Number(hackathonIdStr);
  const userId = Number(session.user.id);
  const userEmail = session.user.email || "";

  // Get hackathon details
  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: hackathonId },
    select: { id: true, name: true },
  });
  if (!hackathon) redirect("/participant/dashboard");

  // Find user's registered team (mirrors Django's ParticipantTeamPassView._get_team)
  let team = await prisma.participant_team.findFirst({
    where: {
      leader_id: userId,
      hackathon_id: hackathonId,
      is_registered: true,
    },
    include: {
      participant_teammember: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!team) {
    // Check if user is a member of a registered team
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
          participant_teammember: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    }
  }

  if (!team) {
    redirect("/participant/dashboard");
  }

  // Ensure QR token exists (generate if missing — mirrors Django's generate_team_qr_code)
  if (!team.qr_token) {
    const newToken = randomUUID();
    await prisma.participant_team.update({
      where: { id: team.id },
      data: { qr_token: newToken, is_qr_active: true },
    });
    team = {
      ...team,
      qr_token: newToken,
    };
  }

  return (
    <TeamPassClient
      hackathonName={hackathon.name}
      hackathonId={hackathon.id}
      teamName={team.name}
      qrToken={team.qr_token!}
      members={team.participant_teammember.map((m) => ({
        id: m.id,
        name: m.name,
        email: m.email,
      }))}
    />
  );
}

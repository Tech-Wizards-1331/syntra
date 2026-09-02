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

  // Fetch all registered teams for the user (as leader or team member)
  const allUserTeams = await prisma.participant_team.findMany({
    where: {
      OR: [
        { leader_id: userId },
        {
          participant_teammember: {
            some: { email: userEmail },
          },
        },
      ],
      is_registered: true,
    },
    include: {
      organizer_hackathon: {
        select: { id: true, name: true, allow_scan: true },
      },
      participant_teammember: {
        select: { id: true, name: true, email: true },
        orderBy: { id: "asc" },
      },
    },
    orderBy: { id: "desc" },
  });

  if (allUserTeams.length === 0) {
    redirect("/participant/dashboard");
  }

  // Ensure QR tokens exist for teams where scanning is enabled
  const registrations = await Promise.all(
    allUserTeams.map(async (t) => {
      let qrToken = t.qr_token;
      const allowScan = t.organizer_hackathon.allow_scan;
      if (!qrToken && allowScan !== false) {
        qrToken = randomUUID();
        await prisma.participant_team.update({
          where: { id: t.id },
          data: { qr_token: qrToken, is_qr_active: true },
        });
      }
      return {
        teamId: t.id,
        teamName: t.name,
        hackathonId: t.hackathon_id,
        hackathonName: t.organizer_hackathon.name,
        allowScan,
        qrToken: qrToken || "",
        members: t.participant_teammember.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
        })),
      };
    })
  );

  return (
    <main className="flex-1 flex items-center justify-center p-4 md:p-6 animate-fade-in-up">
      <TeamPassClient
        registrations={registrations}
        initialHackathonId={hackathonId}
      />
    </main>
  );
}

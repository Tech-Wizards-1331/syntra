"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getTeamsForAllocation } from "@/lib/services/seating";

export async function getOrganizerHackathons() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized");
  }
  const organizerId = Number(session.user.profileId);
  if (!organizerId || isNaN(organizerId)) {
    throw new Error("Organizer profile not found");
  }

  const hackathons = await prisma.organizer_hackathon.findMany({
    where: { organizer_id: organizerId },
    orderBy: { start_date: "desc" },
  });

  return hackathons.map((h) => ({
    id: h.id,
    name: h.name,
    room_configuration: h.room_configuration,
    seating_allocation: h.seating_allocation,
  }));
}

export async function getSeatingContext(hackathonId: number) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized");
  }

  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: hackathonId },
  });

  if (!hackathon) {
    throw new Error("Hackathon not found");
  }

  const teams = await getTeamsForAllocation(hackathonId);

  return {
    hackathonName: hackathon.name,
    roomConfiguration: hackathon.room_configuration,
    seatingAllocation: hackathon.seating_allocation,
    teams,
  };
}

export async function saveSeatingAllocation(hackathonId: number, roomConfigJson: string, allocationJson: string) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized");
  }

  await prisma.organizer_hackathon.update({
    where: { id: hackathonId },
    data: {
      room_configuration: roomConfigJson,
      seating_allocation: allocationJson,
      updated_at: new Date(),
    },
  });

  return { success: true };
}

export async function performAllocation(hackathonId: number, roomsConfigJson: string) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized");
  }

  const { allocate } = await import("@/lib/services/seating");
  const teams = await getTeamsForAllocation(hackathonId);
  const roomsConfig = JSON.parse(roomsConfigJson);

  const result = allocate(teams, roomsConfig);
  return result;
}

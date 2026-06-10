"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { deleteFromCloudinary } from "@/lib/services/cloudinary";

/**
 * Validates organizer ownership over a hackathon.
 */
async function validateHackathonOwner(hackathonId: number, userId: number) {
  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: hackathonId },
    include: { organizer_organizerprofile: true },
  });

  if (!hackathon) {
    throw new Error("Hackathon not found");
  }

  if (hackathon.organizer_organizerprofile.user_id !== userId) {
    throw new Error("Access denied: You do not own this hackathon");
  }

  return hackathon;
}

/**
 * Fetches all problem statements for a specific hackathon.
 */
export async function getProblemStatements(hackathonId: number) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  await validateHackathonOwner(hackathonId, Number(session.user.id));

  return await prisma.organizer_problemstatement.findMany({
    where: { hackathon_id: hackathonId },
    orderBy: { created_at: "desc" },
  });
}

/**
 * Creates a new problem statement.
 */
export async function createProblemStatement(
  hackathonId: number,
  data: {
    title: string;
    description: string;
    pdf_url?: string | null;
    max_teams_allowed: number;
    is_active?: boolean;
  }
) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  await validateHackathonOwner(hackathonId, Number(session.user.id));

  if (!data.title.trim()) {
    throw new Error("Title is required");
  }
  if (!data.description.trim()) {
    throw new Error("Description is required");
  }
  if (data.max_teams_allowed < 1) {
    throw new Error("Maximum teams allowed must be at least 1");
  }

  const ps = await prisma.organizer_problemstatement.create({
    data: {
      hackathon_id: hackathonId,
      title: data.title,
      description: data.description,
      pdf_file: data.pdf_url || null,
      max_teams_allowed: data.max_teams_allowed,
      is_active: data.is_active ?? true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  revalidatePath(`/organizer/dashboard/hackathons/${hackathonId}`);

  return { success: true, problemStatementId: ps.id };
}

/**
 * Updates an existing problem statement.
 */
export async function updateProblemStatement(
  id: number,
  data: {
    title: string;
    description: string;
    pdf_url?: string | null;
    max_teams_allowed: number;
    is_active?: boolean;
  }
) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const userId = Number(session.user.id);

  const existingPs = await prisma.organizer_problemstatement.findUnique({
    where: { id },
    include: {
      organizer_hackathon: {
        include: { organizer_organizerprofile: true },
      },
    },
  });

  if (!existingPs) {
    throw new Error("Problem statement not found");
  }

  if (existingPs.organizer_hackathon.organizer_organizerprofile.user_id !== userId) {
    throw new Error("Access denied: You do not own this hackathon");
  }

  if (!data.title.trim()) {
    throw new Error("Title is required");
  }
  if (!data.description.trim()) {
    throw new Error("Description is required");
  }
  if (data.max_teams_allowed < 1) {
    throw new Error("Maximum teams allowed must be at least 1");
  }

  const oldPdfFile = existingPs.pdf_file;
  const newPdfFile = data.pdf_url || null;

  await prisma.organizer_problemstatement.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      pdf_file: newPdfFile,
      max_teams_allowed: data.max_teams_allowed,
      is_active: data.is_active ?? existingPs.is_active,
      updated_at: new Date(),
    },
  });

  // Clean up old Cloudinary file if replaced (non-blocking)
  if (oldPdfFile && oldPdfFile !== newPdfFile) {
    deleteFromCloudinary(oldPdfFile).catch((err) => {
      console.error("Failed to delete replaced Cloudinary PDF asset during update:", err);
    });
  }

  revalidatePath(`/organizer/dashboard/hackathons/${existingPs.hackathon_id}`);

  return { success: true };
}

/**
 * Deletes a problem statement, validating that it has not been selected by any team.
 */
export async function deleteProblemStatement(id: number) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const userId = Number(session.user.id);

  const existingPs = await prisma.organizer_problemstatement.findUnique({
    where: { id },
    include: {
      organizer_hackathon: {
        include: { organizer_organizerprofile: true },
      },
    },
  });

  if (!existingPs) {
    throw new Error("Problem statement not found");
  }

  if (existingPs.organizer_hackathon.organizer_organizerprofile.user_id !== userId) {
    throw new Error("Access denied: You do not own this hackathon");
  }

  // Deletion Safety Check: block if selected by any team
  const teamCount = await prisma.participant_team.count({
    where: { selected_problem_statement_id: id },
  });

  if (teamCount > 0) {
    throw new Error("Cannot delete problem statement because it has been selected by one or more teams.");
  }

  const pdfFile = existingPs.pdf_file;

  await prisma.organizer_problemstatement.delete({
    where: { id },
  });

  // Clean up Cloudinary file (non-blocking)
  if (pdfFile) {
    deleteFromCloudinary(pdfFile).catch((err) => {
      console.error("Failed to delete Cloudinary PDF asset during deletion:", err);
    });
  }

  revalidatePath(`/organizer/dashboard/hackathons/${existingPs.hackathon_id}`);

  return { success: true };
}

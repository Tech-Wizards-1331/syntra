"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, unstable_cache, revalidateTag } from "next/cache";

export const getCachedActiveHackathons = unstable_cache(
  async () => {
    return prisma.organizer_hackathon.findMany({
      where: {
        status: { in: ["registration", "registration_open", "published"] },
        registration_deadline: { gte: new Date() },
      },
      select: {
        id: true,
        name: true,
        description: true,
        start_date: true,
        registration_deadline: true,
        max_team_size: true,
        min_team_size: true,
        status: true,
      },
      orderBy: { registration_deadline: "asc" },
    });
  },
  ["active-hackathons"],
  { revalidate: 60, tags: ["active-hackathons"] }
);
import { v2 as cloudinary } from "cloudinary";
import { deleteFromCloudinary } from "@/lib/services/cloudinary";

// Ensure Cloudinary is configured
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
  });
}

/**
 * Generates a signed upload signature for direct browser-to-Cloudinary uploads.
 * Restricts uploads to the PDF format and a specific folder.
 */
export async function getCloudinarySignature() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    folder: "syntra_problem_statements",
    format: "pdf",
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "syntra",
  };
}

/**
 * Retrieves the organizer profile corresponding to the logged in user.
 */
async function getOrganizerProfile(userId: number) {
  const profile = await prisma.organizer_organizerprofile.findUnique({
    where: { user_id: userId },
  });
  if (!profile) {
    throw new Error("Organizer profile not found");
  }
  return profile;
}

/**
 * Fetches all hackathons for the logged-in organizer with pagination.
 */
export async function getHackathons(options?: { limit?: number; offset?: number }) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const userId = Number(session.user.id);
  const profile = await getOrganizerProfile(userId);

  const limit = options?.limit ?? 10;
  const offset = options?.offset ?? 0;

  const [hackathons, totalCount] = await Promise.all([
    prisma.organizer_hackathon.findMany({
      where: { organizer_id: profile.id },
      orderBy: { start_date: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.organizer_hackathon.count({
      where: { organizer_id: profile.id },
    }),
  ]);

  return {
    hackathons: hackathons.map(h => ({
      ...h,
      fee_amount: h.fee_amount ? Number(h.fee_amount) : null,
    })),
    totalCount,
  };
}

/**
 * Fetches a single hackathon by ID, validating ownership.
 */
export async function getHackathonById(id: number) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id },
    include: {
      organizer_organizerprofile: true,
      organizer_problemstatement: {
        orderBy: { created_at: "desc" },
      },
      organizer_scancategory: {
        orderBy: [{ display_order: "asc" }, { created_at: "asc" }],
      },
      participant_team: {
        orderBy: { created_at: "desc" },
        include: {
          accounts_user: {
            select: {
              id: true,
              full_name: true,
              email: true,
            },
          },
          participant_teammember: {
            select: {
              id: true,
              name: true,
              email: true,
              college: true,
              semester: true,
              degree: true,
            },
            orderBy: { created_at: "asc" },
          },
          organizer_problemstatement: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      },
    },
  });

  if (!hackathon) {
    throw new Error("Hackathon not found");
  }

  if (hackathon.organizer_organizerprofile.user_id !== Number(session.user.id)) {
    throw new Error("Access denied: You do not own this hackathon");
  }

  return {
    ...hackathon,
    fee_amount: hackathon.fee_amount ? Number(hackathon.fee_amount) : null,
    organizer_problemstatement: hackathon.organizer_problemstatement,
    organizer_scancategory: hackathon.organizer_scancategory,
    participant_team: hackathon.participant_team,
    seating_allocation: hackathon.seating_allocation,
  };
}

/**
 * Validates dates and team sizes.
 */
function validateHackathonInput(data: {
  name: string;
  start_date: Date | string;
  end_date: Date | string;
  registration_deadline: Date | string;
  min_team_size: number;
  max_team_size: number;
  max_teams?: number | null;
  is_paid: boolean;
  fee_type?: string | null;
  fee_amount?: number | null;
}) {
  if (!data.name.trim()) {
    throw new Error("Hackathon name is required");
  }

  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  const deadline = new Date(data.registration_deadline);

  if (isNaN(startDate.getTime())) throw new Error("Invalid start date");
  if (isNaN(endDate.getTime())) throw new Error("Invalid end date");
  if (isNaN(deadline.getTime())) throw new Error("Invalid registration deadline");

  if (endDate <= startDate) {
    throw new Error("End date must be after the start date");
  }

  if (deadline >= startDate) {
    throw new Error("Registration deadline must be before the start date");
  }

  if (data.min_team_size < 1) {
    throw new Error("Minimum team size must be at least 1");
  }

  if (data.max_team_size < data.min_team_size) {
    throw new Error("Maximum team size must be greater than or equal to minimum team size");
  }

  if (data.max_teams !== undefined && data.max_teams !== null && data.max_teams < 1) {
    throw new Error("Maximum teams allowed must be at least 1");
  }

  if (data.is_paid) {
    if (!data.fee_type || !["team", "participant"].includes(data.fee_type)) {
      throw new Error("Paid hackathons require a valid fee type (team or participant)");
    }
    if (data.fee_amount === undefined || data.fee_amount === null || data.fee_amount <= 0) {
      throw new Error("Paid hackathons require a fee amount greater than 0");
    }
  }
}

/**
 * Creates a new hackathon.
 */
export async function createHackathon(data: {
  name: string;
  description?: string;
  start_date: Date | string;
  end_date: Date | string;
  registration_deadline: Date | string;
  min_team_size: number;
  max_team_size: number;
  max_teams?: number | null;
  is_paid: boolean;
  fee_type?: string | null;
  fee_amount?: number | null;
  status: string;
}) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const userId = Number(session.user.id);
  const profile = await getOrganizerProfile(userId);

  validateHackathonInput(data);

  if (!["draft", "registration", "active", "completed"].includes(data.status)) {
    throw new Error("Invalid hackathon status value");
  }

  let roomConfigJson: string | null = null;
  if (data.max_teams !== undefined && data.max_teams !== null) {
    roomConfigJson = JSON.stringify([
      { room_no: "METADATA", type: "metadata", max_teams: Number(data.max_teams) }
    ]);
  }

  const hackathon = await prisma.organizer_hackathon.create({
    data: {
      name: data.name,
      description: data.description || null,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      registration_deadline: new Date(data.registration_deadline),
      status: data.status,
      min_team_size: data.min_team_size,
      max_team_size: data.max_team_size,
      is_paid: data.is_paid,
      fee_type: data.is_paid ? data.fee_type : null,
      fee_amount: data.is_paid ? (data.fee_amount as any) : null,
      organizer_id: profile.id,
      room_configuration: roomConfigJson,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  revalidatePath("/organizer/dashboard");
  revalidateTag("active-hackathons");

  return {
    success: true,
    hackathonId: hackathon.id,
  };
}

/**
 * Updates an existing hackathon.
 */
export async function updateHackathon(
  id: number,
  data: {
    name: string;
    description?: string;
    start_date: Date | string;
    end_date: Date | string;
    registration_deadline: Date | string;
    min_team_size: number;
    max_team_size: number;
    max_teams?: number | null;
    is_paid: boolean;
    fee_type?: string | null;
    fee_amount?: number | null;
    status: string;
  }
) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id },
    include: { organizer_organizerprofile: true },
  });

  if (!hackathon) {
    throw new Error("Hackathon not found");
  }

  if (hackathon.organizer_organizerprofile.user_id !== Number(session.user.id)) {
    throw new Error("Access denied: You do not own this hackathon");
  }

  // Strict State Transitions check
  const currentStatus = hackathon.status;
  const newStatus = data.status;

  if (currentStatus !== newStatus) {
    const allowedTransitions: Record<string, string[]> = {
      draft: ["registration"],
      registration: ["draft", "active"],
      active: ["completed"],
      completed: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid phase transition: Cannot change status from "${currentStatus}" to "${newStatus}"`);
    }
  }

  // If status is active or completed, lock registration_deadline changes
  if (currentStatus === "active" || currentStatus === "completed") {
    const currentDeadlineStr = new Date(hackathon.registration_deadline).toISOString();
    const newDeadlineStr = new Date(data.registration_deadline).toISOString();
    if (currentDeadlineStr !== newDeadlineStr) {
      throw new Error("Registration deadline cannot be edited once the hackathon is active or completed.");
    }
  }

  validateHackathonInput(data);

  // Retrieve the existing hackathon's room_configuration
  const existingConfig = hackathon.room_configuration;
  let updatedConfigJson: string | null = null;
  
  const newMaxTeams = data.max_teams !== undefined && data.max_teams !== null ? Number(data.max_teams) : null;
  
  if (existingConfig) {
    try {
      let parsed = JSON.parse(existingConfig);
      if (Array.isArray(parsed)) {
        const metaIdx = parsed.findIndex((el: any) => el.room_no === "METADATA" && el.type === "metadata");
        if (newMaxTeams !== null) {
          if (metaIdx >= 0) {
            parsed[metaIdx].max_teams = newMaxTeams;
          } else {
            parsed.unshift({ room_no: "METADATA", type: "metadata", max_teams: newMaxTeams });
          }
        } else {
          if (metaIdx >= 0) {
            parsed.splice(metaIdx, 1);
          }
        }
        updatedConfigJson = JSON.stringify(parsed);
      } else {
        updatedConfigJson = newMaxTeams !== null
          ? JSON.stringify([{ room_no: "METADATA", type: "metadata", max_teams: newMaxTeams }])
          : null;
      }
    } catch (e) {
      console.error("Failed to update existing room_configuration for max_teams, fallback to new serialization", e);
      updatedConfigJson = newMaxTeams !== null
        ? JSON.stringify([{ room_no: "METADATA", type: "metadata", max_teams: newMaxTeams }])
        : null;
    }
  } else {
    updatedConfigJson = newMaxTeams !== null
      ? JSON.stringify([{ room_no: "METADATA", type: "metadata", max_teams: newMaxTeams }])
      : null;
  }

  await prisma.organizer_hackathon.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      start_date: new Date(data.start_date),
      end_date: new Date(data.end_date),
      registration_deadline: new Date(data.registration_deadline),
      status: data.status,
      min_team_size: data.min_team_size,
      max_team_size: data.max_team_size,
      is_paid: data.is_paid,
      fee_type: data.is_paid ? data.fee_type : null,
      fee_amount: data.is_paid ? (data.fee_amount as any) : null,
      room_configuration: updatedConfigJson,
      updated_at: new Date(),
    },
  });

  revalidatePath("/organizer/dashboard");
  revalidatePath(`/organizer/dashboard/hackathons/${id}`);
  revalidateTag("active-hackathons");

  return { success: true };
}

/**
 * Deletes a hackathon and cleans up associated problem statements and scan categories.
 */
export async function deleteHackathon(id: number) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id },
    include: { organizer_organizerprofile: true },
  });

  if (!hackathon) {
    throw new Error("Hackathon not found");
  }

  if (hackathon.organizer_organizerprofile.user_id !== Number(session.user.id)) {
    throw new Error("Access denied: You do not own this hackathon");
  }

  // Deletion Safety check: Block if registered teams exist
  const teamCount = await prisma.participant_team.count({
    where: { hackathon_id: id },
  });

  if (teamCount > 0) {
    throw new Error("Cannot delete hackathon because it has active team registrations.");
  }

  // Fetch related problem statements to extract Cloudinary PDFs for deletion
  const problemStatements = await prisma.organizer_problemstatement.findMany({
    where: { hackathon_id: id },
    select: { pdf_file: true },
  });

  // Delete scan records associated with scan categories of this hackathon
  await prisma.organizer_scanrecord.deleteMany({
    where: {
      organizer_scancategory: {
        hackathon_id: id,
      },
    },
  });

  // Delete scan categories
  await prisma.organizer_scancategory.deleteMany({
    where: { hackathon_id: id },
  });

  // Delete problem statements
  await prisma.organizer_problemstatement.deleteMany({
    where: { hackathon_id: id },
  });

  // Delete hackathon coordinators
  await prisma.organizer_hackathoncoordinator.deleteMany({
    where: { hackathon_id: id },
  });

  // Finally delete hackathon
  await prisma.organizer_hackathon.delete({
    where: { id },
  });

  // Clean up PDF assets from Cloudinary asynchronously
  for (const ps of problemStatements) {
    if (ps.pdf_file) {
      deleteFromCloudinary(ps.pdf_file).catch((err) => {
        console.error("Cloudinary file deletion failed during hackathon cascade cleanup:", err);
      });
    }
  }

  revalidatePath("/organizer/dashboard");
  revalidateTag("active-hackathons");

  return { success: true };
}

/**
 * Toggles the release status of problem statements for a hackathon.
 */
export async function toggleProblemStatementsRelease(hackathonId: number, release: boolean) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: hackathonId },
    include: { organizer_organizerprofile: true },
  });

  if (!hackathon) {
    throw new Error("Hackathon not found");
  }

  if (hackathon.organizer_organizerprofile.user_id !== Number(session.user.id)) {
    throw new Error("Access denied: You do not own this hackathon");
  }

  await prisma.organizer_hackathon.update({
    where: { id: hackathonId },
    data: { release_problems: release },
  });

  revalidatePath(`/organizer/dashboard/hackathons/${hackathonId}`);
  return { success: true };
}

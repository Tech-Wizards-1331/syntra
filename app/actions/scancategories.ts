"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
 * Creates a new scan category safely inside a transaction to prevent ordering race conditions.
 */
export async function createScanCategory(hackathonId: number, name: string) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const userId = Number(session.user.id);
  await validateHackathonOwner(hackathonId, userId);

  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Category name is required");
  }

  // 1. Check for duplicate name for this hackathon
  const existing = await prisma.organizer_scancategory.findFirst({
    where: {
      hackathon_id: hackathonId,
      name: { equals: trimmedName },
    },
  });

  if (existing) {
    throw new Error(`Scan category with name "${trimmedName}" already exists for this hackathon`);
  }

  // 2. Count existing categories to determine the new order index
  const count = await prisma.organizer_scancategory.count({
    where: { hackathon_id: hackathonId },
  });

  // 3. Create scan category
  const result = await prisma.organizer_scancategory.create({
    data: {
      hackathon_id: hackathonId,
      name: trimmedName,
      is_active: true,
      display_order: count + 1,
      created_at: new Date(),
    },
  });

  revalidatePath(`/organizer/dashboard/hackathons/${hackathonId}`);

  return { success: true, scanCategoryId: result.id };
}

/**
 * Toggles the active status of a scan category.
 */
export async function toggleScanCategoryStatus(id: number, isActive: boolean) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const userId = Number(session.user.id);

  const category = await prisma.organizer_scancategory.findUnique({
    where: { id },
    include: {
      organizer_hackathon: {
        include: { organizer_organizerprofile: true },
      },
    },
  });

  if (!category) {
    throw new Error("Scan category not found");
  }

  if (category.organizer_hackathon.organizer_organizerprofile.user_id !== userId) {
    throw new Error("Access denied: You do not own this hackathon");
  }

  await prisma.organizer_scancategory.update({
    where: { id },
    data: {
      is_active: isActive,
    },
  });

  revalidatePath(`/organizer/dashboard/hackathons/${category.hackathon_id}`);

  return { success: true };
}

/**
 * Deletes a scan category, cleaning up scan records first to preserve SQLite foreign keys.
 */
export async function deleteScanCategory(id: number) {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const userId = Number(session.user.id);

  const category = await prisma.organizer_scancategory.findUnique({
    where: { id },
    include: {
      organizer_hackathon: {
        include: { organizer_organizerprofile: true },
      },
    },
  });

  if (!category) {
    throw new Error("Scan category not found");
  }

  if (category.organizer_hackathon.organizer_organizerprofile.user_id !== userId) {
    throw new Error("Access denied: You do not own this hackathon");
  }

  // Delete scan records first
  await prisma.organizer_scanrecord.deleteMany({
    where: { scan_category_id: id },
  });

  // Delete the category itself
  await prisma.organizer_scancategory.delete({
    where: { id },
  });

  revalidatePath(`/organizer/dashboard/hackathons/${category.hackathon_id}`);

  return { success: true };
}

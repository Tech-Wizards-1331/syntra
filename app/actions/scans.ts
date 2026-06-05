"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// ─── Auth Helpers ───────────────────────────────────────────────────

/**
 * Verifies the current user is an organizer or an active coordinator for a specific hackathon.
 * Returns the authenticated user ID.
 */
async function requireScanAuth(hackathonId: number) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = Number(session.user.id);
  const role = session.user.role;

  if (role === "organizer") {
    // Organizer who owns this hackathon
    const hackathon = await prisma.organizer_hackathon.findUnique({
      where: { id: hackathonId },
      include: { organizer_organizerprofile: true },
    });
    if (hackathon && hackathon.organizer_organizerprofile.user_id === userId) {
      return userId;
    }

    // Organizer who is a coordinator for this hackathon
    const coord = await prisma.organizer_hackathoncoordinator.findFirst({
      where: { hackathon_id: hackathonId, user_id: userId, is_active: true },
    });
    if (coord) return userId;

    throw new Error("Access denied: you are not an owner or coordinator of this hackathon");
  }

  // Also check if a non-organizer is a coordinator (edge case for staff roles)
  const coord = await prisma.organizer_hackathoncoordinator.findFirst({
    where: { hackathon_id: hackathonId, user_id: userId, is_active: true },
  });
  if (coord) return userId;

  throw new Error("Access denied: organizer or coordinator role required");
}

// ─── Scan QR Token ──────────────────────────────────────────────────

/**
 * Looks up a team by its secure QR token and returns team + member check-in states for a category.
 */
export async function scanQrToken(qrToken: string, scanCategoryId: number) {
  const trimmed = qrToken.trim();
  if (!trimmed) throw new Error("QR token is required");

  const team = await prisma.participant_team.findUnique({
    where: { qr_token: trimmed },
    include: {
      participant_teammember: {
        include: {
          organizer_scanrecord: {
            where: { scan_category_id: scanCategoryId },
          },
        },
      },
      organizer_hackathon: { select: { id: true, name: true } },
    },
  });

  if (!team) throw new Error("Invalid QR code: team not found");
  if (!team.is_qr_active) throw new Error("QR code is deactivated for this team");

  // Verify the scan category belongs to this hackathon
  const category = await prisma.organizer_scancategory.findUnique({
    where: { id: scanCategoryId },
  });
  if (!category || category.hackathon_id !== team.hackathon_id) {
    throw new Error("Scan category does not belong to this team's hackathon");
  }

  // Verify scanner authorization
  await requireScanAuth(team.hackathon_id);

  return {
    teamId: team.id,
    teamName: team.name,
    hackathonName: team.organizer_hackathon.name,
    members: team.participant_teammember.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      alreadyScanned: m.organizer_scanrecord.length > 0,
    })),
  };
}

// ─── Submit Member Scans ────────────────────────────────────────────

/**
 * Atomically records scan records for selected team members.
 * Prevents double-scans via unique constraint.
 */
export async function submitMemberScans(
  qrToken: string,
  scanCategoryId: number,
  memberIds: number[]
) {
  if (!memberIds.length) throw new Error("No members selected for scanning");

  const team = await prisma.participant_team.findUnique({
    where: { qr_token: qrToken.trim() },
    include: { participant_teammember: true },
  });
  if (!team) throw new Error("Invalid QR code");
  if (!team.is_qr_active) throw new Error("QR code is deactivated for this team");

  // Verify authorization
  const scannedById = await requireScanAuth(team.hackathon_id);

  // Verify the scan category belongs to this hackathon
  const category = await prisma.organizer_scancategory.findUnique({
    where: { id: scanCategoryId },
  });
  if (!category || category.hackathon_id !== team.hackathon_id) {
    throw new Error("Scan category does not belong to this team's hackathon");
  }
  if (!category.is_active) {
    throw new Error("Scan category is not active");
  }

  // Verify all member IDs belong to the team
  const teamMemberIds = new Set(team.participant_teammember.map((m) => m.id));
  for (const mid of memberIds) {
    if (!teamMemberIds.has(mid)) {
      throw new Error(`Member ID ${mid} does not belong to this team`);
    }
  }

  const now = new Date();

  const results = await prisma.$transaction(async (tx) => {
    const created: number[] = [];
    const skipped: number[] = [];

    for (const memberId of memberIds) {
      // Check for existing scan (double-scan prevention)
      const existing = await tx.organizer_scanrecord.findFirst({
        where: {
          team_member_id: memberId,
          scan_category_id: scanCategoryId,
        },
      });

      if (existing) {
        skipped.push(memberId);
        continue;
      }

      await tx.organizer_scanrecord.create({
        data: {
          team_member_id: memberId,
          scan_category_id: scanCategoryId,
          scanned_by_id: scannedById,
          created_at: now,
        },
      });
      created.push(memberId);
    }

    return { created, skipped };
  });

  return {
    success: true,
    scannedCount: results.created.length,
    skippedCount: results.skipped.length,
    message:
      results.skipped.length > 0
        ? `${results.created.length} scanned, ${results.skipped.length} already checked-in`
        : `${results.created.length} members checked in successfully`,
  };
}

// ─── Get Hackathons for Scanner ─────────────────────────────────────

/**
 * Returns hackathons accessible to the current user for scanning.
 */
export async function getScannableHackathons() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = Number(session.user.id);
  const role = session.user.role;

  if (role !== "organizer") {
    // Check if user is a coordinator for any hackathon
    const coordinations = await prisma.organizer_hackathoncoordinator.findMany({
      where: { user_id: userId, is_active: true },
      include: {
        organizer_hackathon: {
          include: { organizer_scancategory: { where: { is_active: true }, orderBy: { display_order: "asc" } } },
        },
      },
    });

    if (coordinations.length === 0) throw new Error("No scannable hackathons found");

    return coordinations.map((c) => ({
      id: c.organizer_hackathon.id,
      name: c.organizer_hackathon.name,
      status: c.organizer_hackathon.status,
      scanCategories: c.organizer_hackathon.organizer_scancategory.map((sc) => ({
        id: sc.id,
        name: sc.name,
      })),
    }));
  }

  // Organizer: get owned hackathons + coordinated ones
  const profile = await prisma.organizer_organizerprofile.findUnique({
    where: { user_id: userId },
  });

  const hackathons = await prisma.organizer_hackathon.findMany({
    where: {
      OR: [
        ...(profile ? [{ organizer_id: profile.id }] : []),
        { organizer_hackathoncoordinator: { some: { user_id: userId, is_active: true } } },
      ],
    },
    include: {
      organizer_scancategory: { where: { is_active: true }, orderBy: { display_order: "asc" } },
    },
    orderBy: { created_at: "desc" },
  });

  return hackathons.map((h) => ({
    id: h.id,
    name: h.name,
    status: h.status,
    scanCategories: h.organizer_scancategory.map((sc) => ({
      id: sc.id,
      name: sc.name,
    })),
  }));
}

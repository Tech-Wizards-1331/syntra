import { describe, it, expect, vi, beforeEach } from "vitest";
import { bulkImportTeams, BulkTeamInput } from "@/app/actions/bulkImportTeams";

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock email service
vi.mock("@/lib/services/email", () => ({
  sendBulkRegistrationWelcomeEmail: vi.fn(async () => ({ success: true })),
}));

// Mock crypto partially
vi.mock("crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("crypto")>();
  return {
    ...actual,
    randomUUID: vi.fn(() => "mock-qr-uuid-5678"),
  };
});

// Mock prisma
vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      organizer_hackathon: {
        findUnique: vi.fn(),
      },
      accounts_user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      participant_participantprofile: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      participant_team: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
      participant_teammember: {
        findMany: vi.fn(),
        create: vi.fn(),
      },
    },
  };
});

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendBulkRegistrationWelcomeEmail } from "@/lib/services/email";

describe("bulkImportTeams", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default organizer session
    (auth as any).mockResolvedValue({
      user: { id: "10", role: "organizer", email: "organizer@syntra.com" },
    });

    // Default owned hackathon
    (prisma.organizer_hackathon.findUnique as any).mockResolvedValue({
      id: 1,
      name: "Smart India Hackathon 2026",
      min_team_size: 1,
      max_team_size: 4,
      organizer_organizerprofile: {
        user_id: 10,
      },
    });

    // No existing teams or members by default
    (prisma.participant_team.findMany as any).mockResolvedValue([]);
    (prisma.participant_teammember.findMany as any).mockResolvedValue([]);
  });

  it("fails if user is not authorized as organizer", async () => {
    (auth as any).mockResolvedValue({
      user: { id: "20", role: "participant" },
    });

    await expect(bulkImportTeams(1, [])).rejects.toThrow("Organizer role required");
  });

  it("fails if organizer does not own the hackathon", async () => {
    (prisma.organizer_hackathon.findUnique as any).mockResolvedValue({
      id: 1,
      name: "Other Hackathon",
      organizer_organizerprofile: {
        user_id: 999, // Different owner
      },
    });

    await expect(bulkImportTeams(1, [])).rejects.toThrow("Access denied");
  });

  it("returns error if empty teams array is supplied", async () => {
    const result = await bulkImportTeams(1, []);
    expect(result.success).toBe(false);
    expect(result.errors).toContain("No team data provided for import.");
  });

  it("successfully creates user, team, members and triggers welcome email", async () => {
    (prisma.accounts_user.findUnique as any).mockResolvedValue(null);
    (prisma.accounts_user.create as any).mockResolvedValue({
      id: 101,
      email: "leader@college.edu",
      full_name: "Leader Name",
    });
    (prisma.participant_participantprofile.create as any).mockResolvedValue({
      id: 201,
      user_id: 101,
    });
    (prisma.participant_team.create as any).mockResolvedValue({
      id: 501,
      name: "Alpha Innovators",
      hackathon_id: 1,
      leader_id: 101,
    });
    (prisma.participant_teammember.create as any).mockResolvedValue({
      id: 601,
    });

    const sampleTeams: BulkTeamInput[] = [
      {
        teamName: "Alpha Innovators",
        leaderName: "Leader Name",
        leaderEmail: "leader@college.edu",
        college: "Engineering College",
        semester: 6,
        degree: "B.Tech",
        members: [
          {
            name: "Member Two",
            email: "member2@college.edu",
            college: "Engineering College",
            semester: 6,
            degree: "B.Tech",
          },
        ],
      },
    ];

    const result = await bulkImportTeams(1, sampleTeams, "CustomPass@123");

    expect(result.success).toBe(true);
    expect(result.importedCount).toBe(1);
    expect(result.errors.length).toBe(0);
    expect(prisma.participant_team.create).toHaveBeenCalledTimes(1);
    expect(prisma.participant_teammember.create).toHaveBeenCalledTimes(2); // leader + member
    expect(sendBulkRegistrationWelcomeEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverEmail: "leader@college.edu",
        teamName: "Alpha Innovators",
        temporaryPassword: "CustomPass@123",
      })
    );
  });

  it("skips duplicate team names and reports errors", async () => {
    (prisma.participant_team.findMany as any).mockResolvedValue([
      { name: "Alpha Innovators", leader_id: 100 },
    ]);

    const sampleTeams: BulkTeamInput[] = [
      {
        teamName: "Alpha Innovators", // duplicate
        leaderName: "Leader Name",
        leaderEmail: "leader@college.edu",
        members: [],
      },
    ];

    const result = await bulkImportTeams(1, sampleTeams);
    expect(result.importedCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.errors[0]).toContain("already registered in this hackathon");
  });
});

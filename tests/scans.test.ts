import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  scanQrToken,
  submitMemberScans,
  getScannableHackathons,
} from "@/app/actions/scans";

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => {
  const mockScanRecord = {
    findFirst: vi.fn(),
    create: vi.fn(),
  };

  const mockTx = {
    organizer_scanrecord: mockScanRecord,
  };

  const mockPrisma = {
    participant_team: {
      findUnique: vi.fn(),
    },
    organizer_hackathon: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    organizer_hackathoncoordinator: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    organizer_scancategory: {
      findUnique: vi.fn(),
    },
    organizer_organizerprofile: {
      findUnique: vi.fn(),
    },
    organizer_scanrecord: mockScanRecord,
    $transaction: vi.fn((fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
    _tx: mockTx,
  };
  return { prisma: mockPrisma };
});

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const mockAuth = auth as ReturnType<typeof vi.fn>;
const mockPrisma = prisma as unknown as {
  [key: string]: { [method: string]: ReturnType<typeof vi.fn> };
  $transaction: ReturnType<typeof vi.fn>;
  _tx: { [key: string]: { [method: string]: ReturnType<typeof vi.fn> } };
};

const mockOrgSession = {
  user: { id: "10", email: "org@test.com", role: "organizer" },
};

const mockTeam = {
  id: 100,
  name: "Alpha Team",
  hackathon_id: 10,
  is_qr_active: true,
  qr_token: "valid-qr-token",
  organizer_hackathon: { id: 10, name: "Test Hackathon" },
  participant_teammember: [
    {
      id: 1,
      name: "Member A",
      email: "a@test.com",
      organizer_scanrecord: [],
    },
    {
      id: 2,
      name: "Member B",
      email: "b@test.com",
      organizer_scanrecord: [{ id: 999 }],
    },
  ],
};

const mockCategory = {
  id: 5,
  name: "Attendance Day 1",
  hackathon_id: 10,
  is_active: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(mockOrgSession);
});

// ─── scanQrToken ────────────────────────────────────────────────

describe("scanQrToken", () => {
  it("returns team info and member scan states", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue(mockTeam);
    mockPrisma.organizer_scancategory.findUnique.mockResolvedValue(mockCategory);
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue({
      id: 10,
      organizer_organizerprofile: { user_id: 10 },
    });

    const result = await scanQrToken("valid-qr-token", 5);

    expect(result.teamName).toBe("Alpha Team");
    expect(result.members.length).toBe(2);
    expect(result.members[0].alreadyScanned).toBe(false);
    expect(result.members[1].alreadyScanned).toBe(true);
  });

  it("rejects invalid QR token", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue(null);

    await expect(scanQrToken("invalid-token", 5)).rejects.toThrow(
      "Invalid QR code: team not found"
    );
  });

  it("rejects deactivated QR code", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      ...mockTeam,
      is_qr_active: false,
    });
    mockPrisma.organizer_scancategory.findUnique.mockResolvedValue(mockCategory);

    await expect(scanQrToken("valid-qr-token", 5)).rejects.toThrow(
      "QR code is deactivated for this team"
    );
  });

  it("rejects scan category from a different hackathon", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue(mockTeam);
    mockPrisma.organizer_scancategory.findUnique.mockResolvedValue({
      ...mockCategory,
      hackathon_id: 999,
    });

    await expect(scanQrToken("valid-qr-token", 5)).rejects.toThrow(
      "Scan category does not belong to this team's hackathon"
    );
  });

  it("blocks participants from scanning", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "99", email: "participant@test.com", role: "participant" },
    });
    mockPrisma.participant_team.findUnique.mockResolvedValue(mockTeam);
    mockPrisma.organizer_scancategory.findUnique.mockResolvedValue(mockCategory);
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue(null);
    mockPrisma.organizer_hackathoncoordinator.findFirst.mockResolvedValue(null);

    await expect(scanQrToken("valid-qr-token", 5)).rejects.toThrow(
      "Access denied"
    );
  });
});

// ─── submitMemberScans ──────────────────────────────────────────

describe("submitMemberScans", () => {
  it("creates scan records for selected members", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      ...mockTeam,
      participant_teammember: [
        { id: 1, name: "A", email: "a@test.com" },
        { id: 2, name: "B", email: "b@test.com" },
      ],
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue({
      id: 10,
      organizer_organizerprofile: { user_id: 10 },
    });
    mockPrisma.organizer_scancategory.findUnique.mockResolvedValue(mockCategory);
    mockPrisma._tx.organizer_scanrecord.findFirst.mockResolvedValue(null);

    const result = await submitMemberScans("valid-qr-token", 5, [1, 2]);

    expect(result.success).toBe(true);
    expect(result.scannedCount).toBe(2);
    expect(mockPrisma._tx.organizer_scanrecord.create).toHaveBeenCalledTimes(2);
  });

  it("skips already-scanned members (double-scan prevention)", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      ...mockTeam,
      participant_teammember: [
        { id: 1, name: "A", email: "a@test.com" },
      ],
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue({
      id: 10,
      organizer_organizerprofile: { user_id: 10 },
    });
    mockPrisma.organizer_scancategory.findUnique.mockResolvedValue(mockCategory);
    mockPrisma._tx.organizer_scanrecord.findFirst.mockResolvedValue({ id: 999 });

    const result = await submitMemberScans("valid-qr-token", 5, [1]);

    expect(result.skippedCount).toBe(1);
    expect(result.scannedCount).toBe(0);
    expect(mockPrisma._tx.organizer_scanrecord.create).not.toHaveBeenCalled();
  });

  it("rejects member IDs not belonging to the team", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      ...mockTeam,
      participant_teammember: [
        { id: 1, name: "A", email: "a@test.com" },
      ],
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue({
      id: 10,
      organizer_organizerprofile: { user_id: 10 },
    });
    mockPrisma.organizer_scancategory.findUnique.mockResolvedValue(mockCategory);

    await expect(submitMemberScans("valid-qr-token", 5, [1, 999])).rejects.toThrow(
      "Member ID 999 does not belong to this team"
    );
  });

  it("rejects empty member selection", async () => {
    await expect(submitMemberScans("valid-qr-token", 5, [])).rejects.toThrow(
      "No members selected for scanning"
    );
  });

  it("rejects inactive scan categories", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      ...mockTeam,
      participant_teammember: [{ id: 1, name: "A", email: "a@test.com" }],
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue({
      id: 10,
      organizer_organizerprofile: { user_id: 10 },
    });
    mockPrisma.organizer_scancategory.findUnique.mockResolvedValue({
      ...mockCategory,
      is_active: false,
    });

    await expect(submitMemberScans("valid-qr-token", 5, [1])).rejects.toThrow(
      "Scan category is not active"
    );
  });
});

// ─── getScannableHackathons ─────────────────────────────────────

describe("getScannableHackathons", () => {
  it("returns owned hackathons for organizers", async () => {
    mockPrisma.organizer_organizerprofile.findUnique.mockResolvedValue({ id: 1, user_id: 10 });
    mockPrisma.organizer_hackathon.findMany.mockResolvedValue([
      {
        id: 10,
        name: "Hackathon A",
        status: "active",
        organizer_scancategory: [{ id: 5, name: "Day 1" }],
      },
    ]);
    mockPrisma.organizer_hackathoncoordinator.findMany.mockResolvedValue([]);

    const result = await getScannableHackathons();

    expect(result.length).toBe(1);
    expect(result[0].name).toBe("Hackathon A");
    expect(result[0].scanCategories.length).toBe(1);
  });

  it("rejects unauthorized users", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "99", email: "nobody@test.com", role: "participant" },
    });
    mockPrisma.organizer_hackathoncoordinator.findMany.mockResolvedValue([]);

    await expect(getScannableHackathons()).rejects.toThrow(
      "No scannable hackathons found"
    );
  });
});

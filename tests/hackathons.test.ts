import { describe, it, expect, vi, beforeEach } from "vitest";
import { deleteFromCloudinary } from "@/lib/services/cloudinary";
import {
  getCloudinarySignature,
  getHackathons,
  getHackathonById,
  createHackathon,
  updateHackathon,
  deleteHackathon,
  toggleHackathonRegistration,
  toggleRequireGithubLink,
} from "@/app/actions/hackathons";
import {
  createProblemStatement,
  updateProblemStatement,
  deleteProblemStatement,
  getProblemStatements,
} from "@/app/actions/problemstatements";
import {
  createScanCategory,
  toggleScanCategoryStatus,
  deleteScanCategory,
} from "@/app/actions/scancategories";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
  revalidateTag: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    organizer_organizerprofile: {
      findUnique: vi.fn(),
    },
    organizer_hackathon: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    organizer_problemstatement: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    organizer_scancategory: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    organizer_scanrecord: {
      deleteMany: vi.fn(),
    },
    organizer_hackathoncoordinator: {
      deleteMany: vi.fn(),
    },
    participant_team: {
      count: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

// Mock cloudinary
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      destroy: vi.fn(),
    },
    utils: {
      api_sign_request: vi.fn(() => "mock_signature"),
    },
  },
}));

describe("Cloudinary Deletion Helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return false if url is invalid", async () => {
    const result = await deleteFromCloudinary("http://invalidurl.com/asset.png");
    expect(result).toBe(false);
  });

  it("should successfully extract public ID and destroy asset", async () => {
    vi.mocked(cloudinary.uploader.destroy).mockResolvedValueOnce({
      result: "ok",
    } as any);

    const testUrl = "https://res.cloudinary.com/dummy/image/upload/v12345/folder/sample_image.png";
    const result = await deleteFromCloudinary(testUrl);

    expect(result).toBe(true);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("folder/sample_image", {
      resource_type: "image",
    });
  });

  it("should delete PDF files as raw assets", async () => {
    vi.mocked(cloudinary.uploader.destroy).mockResolvedValueOnce({
      result: "ok",
    } as any);

    const pdfUrl = "https://res.cloudinary.com/dummy/raw/upload/v12345/folder/problem_statement.pdf";
    const result = await deleteFromCloudinary(pdfUrl);

    expect(result).toBe(true);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("folder/problem_statement", {
      resource_type: "raw",
    });
  });
});

describe("Hackathon Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCloudinarySignature", () => {
    it("should reject unauthenticated request", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null);
      await expect(getCloudinarySignature()).rejects.toThrow("Unauthorized or invalid role");
    });

    it("should reject non-organizer request", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { role: "participant" },
      } as any);
      await expect(getCloudinarySignature()).rejects.toThrow("Unauthorized or invalid role");
    });

    it("should generate a direct upload signature for organizers", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { role: "organizer" },
      } as any);

      const sig = await getCloudinarySignature();
      expect(sig.signature).toBe("mock_signature");
      expect(sig.cloudName).toBe("syntra");
    });
  });

  describe("createHackathon", () => {
    it("should reject if dates are mathematically invalid", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "10", role: "organizer" },
      } as any);
      vi.mocked(prisma.organizer_organizerprofile.findUnique).mockResolvedValue({
        id: 1,
      } as any);

      // end date before start date
      await expect(
        createHackathon({
          name: "Test Hack",
          start_date: "2026-06-10",
          end_date: "2026-06-08",
          registration_deadline: "2026-06-05",
          min_team_size: 1,
          max_team_size: 4,
          is_paid: false,
          status: "draft",
        })
      ).rejects.toThrow("End date must be after the start date");

      // deadline after start date
      await expect(
        createHackathon({
          name: "Test Hack",
          start_date: "2026-06-10",
          end_date: "2026-06-12",
          registration_deadline: "2026-06-11",
          min_team_size: 1,
          max_team_size: 4,
          is_paid: false,
          status: "draft",
        })
      ).rejects.toThrow("Registration deadline must be before the start date");
    });

    it("should enforce pricing validation if is_paid is true", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "10", role: "organizer" },
      } as any);
      vi.mocked(prisma.organizer_organizerprofile.findUnique).mockResolvedValueOnce({
        id: 1,
      } as any);

      await expect(
        createHackathon({
          name: "Test Hack",
          start_date: "2026-06-10",
          end_date: "2026-06-12",
          registration_deadline: "2026-06-05",
          min_team_size: 1,
          max_team_size: 4,
          is_paid: true, // no fee info
          status: "draft",
        })
      ).rejects.toThrow("Paid hackathons require a valid fee type (team or participant)");
    });
  });

  describe("updateHackathon - Phase Transitions", () => {
    it("should reject non-valid state transition drafts to active", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "10", role: "organizer" },
      } as any);

      vi.mocked(prisma.organizer_hackathon.findUnique).mockResolvedValueOnce({
        id: 5,
        status: "draft",
        organizer_organizerprofile: { user_id: 10 },
      } as any);

      await expect(
        updateHackathon(5, {
          name: "Test Hack",
          start_date: "2026-06-10",
          end_date: "2026-06-12",
          registration_deadline: "2026-06-05",
          min_team_size: 1,
          max_team_size: 4,
          is_paid: false,
          status: "active", // invalid transition draft -> active
        })
      ).rejects.toThrow("Invalid phase transition: Cannot change status from \"draft\" to \"active\"");
    });

    it("should allow draft to registration transition", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "10", role: "organizer" },
      } as any);

      vi.mocked(prisma.organizer_hackathon.findUnique).mockResolvedValueOnce({
        id: 5,
        status: "draft",
        organizer_organizerprofile: { user_id: 10 },
      } as any);

      vi.mocked(prisma.organizer_hackathon.update).mockResolvedValueOnce({} as any);

      const res = await updateHackathon(5, {
        name: "Test Hack",
        start_date: "2026-06-10",
        end_date: "2026-06-12",
        registration_deadline: "2026-06-05",
        min_team_size: 1,
        max_team_size: 4,
        is_paid: false,
        status: "registration",
      });

      expect(res.success).toBe(true);
    });

    it("should block registration deadline updates once active", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "10", role: "organizer" },
      } as any);

      vi.mocked(prisma.organizer_hackathon.findUnique).mockResolvedValueOnce({
        id: 5,
        status: "active",
        registration_deadline: new Date("2026-06-05T00:00:00.000Z"),
        organizer_organizerprofile: { user_id: 10 },
      } as any);

      await expect(
        updateHackathon(5, {
          name: "Test Hack",
          start_date: "2026-06-10",
          end_date: "2026-06-12",
          registration_deadline: "2026-06-06", // edited
          min_team_size: 1,
          max_team_size: 4,
          is_paid: false,
          status: "active",
        })
      ).rejects.toThrow("Registration deadline cannot be edited once the hackathon is active or completed.");
    });
  });

  describe("deleteHackathon", () => {
    it("should block delete if registered teams exist", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "10", role: "organizer" },
      } as any);

      vi.mocked(prisma.organizer_hackathon.findUnique).mockResolvedValueOnce({
        id: 5,
        organizer_organizerprofile: { user_id: 10 },
      } as any);

      vi.mocked(prisma.participant_team.count).mockResolvedValueOnce(3); // 3 teams

      await expect(deleteHackathon(5)).rejects.toThrow("Cannot delete hackathon because it has active team registrations.");
    });
  });
});

describe("Problem Statement Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should enforce hackathon owner boundary check on creation", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "10", role: "organizer" },
    } as any);

    // Organizer of hackathon is user 20
    vi.mocked(prisma.organizer_hackathon.findUnique).mockResolvedValueOnce({
      id: 5,
      organizer_organizerprofile: { user_id: 20 },
    } as any);

    await expect(
      createProblemStatement(5, {
        title: "Broken logic",
        description: "Explain Y",
        max_teams_allowed: 5,
      })
    ).rejects.toThrow("Access denied: You do not own this hackathon");
  });

  it("should block deletion if problem statement is selected by any team", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "10", role: "organizer" },
    } as any);

    vi.mocked(prisma.organizer_problemstatement.findUnique).mockResolvedValueOnce({
      id: 1,
      organizer_hackathon: {
        hackathon_id: 5,
        organizer_organizerprofile: { user_id: 10 },
      },
    } as any);

    vi.mocked(prisma.participant_team.count).mockResolvedValueOnce(1); // selected by 1 team

    await expect(deleteProblemStatement(1)).rejects.toThrow(
      "Cannot delete problem statement because it has been selected by one or more teams."
    );
  });
});

describe("Scan Categories Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should block duplicate scan category names", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "10", role: "organizer" },
    } as any);

    vi.mocked(prisma.organizer_hackathon.findUnique).mockResolvedValueOnce({
      id: 5,
      organizer_organizerprofile: { user_id: 10 },
    } as any);

    vi.mocked(prisma.organizer_scancategory.findFirst).mockResolvedValueOnce({
      id: 1,
      name: "Check-in",
    } as any);

    await expect(createScanCategory(5, "Check-in")).rejects.toThrow(
      "Scan category with name \"Check-in\" already exists for this hackathon"
    );
  });
});

describe("Live Event Controls Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should close registration by setting status to active", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "10", role: "organizer" },
    } as any);

    vi.mocked(prisma.organizer_hackathon.findUnique).mockResolvedValueOnce({
      id: 5,
      status: "registration",
      organizer_organizerprofile: { user_id: 10 },
    } as any);

    vi.mocked(prisma.organizer_hackathon.update).mockResolvedValueOnce({
      id: 5,
      status: "active",
    } as any);

    const res = await toggleHackathonRegistration(5, false);
    expect(res.success).toBe(true);
    expect(res.status).toBe("active");
    expect(prisma.organizer_hackathon.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { status: "active" },
    });
  });

  it("should reopen registration by setting status to registration", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "10", role: "organizer" },
    } as any);

    vi.mocked(prisma.organizer_hackathon.findUnique).mockResolvedValueOnce({
      id: 5,
      status: "active",
      organizer_organizerprofile: { user_id: 10 },
    } as any);

    vi.mocked(prisma.organizer_hackathon.update).mockResolvedValueOnce({
      id: 5,
      status: "registration",
    } as any);

    const res = await toggleHackathonRegistration(5, true);
    expect(res.success).toBe(true);
    expect(res.status).toBe("registration");
    expect(prisma.organizer_hackathon.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { status: "registration" },
    });
  });

  it("should block toggling registration on completed hackathon", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "10", role: "organizer" },
    } as any);

    vi.mocked(prisma.organizer_hackathon.findUnique).mockResolvedValueOnce({
      id: 5,
      status: "completed",
      organizer_organizerprofile: { user_id: 10 },
    } as any);

    await expect(toggleHackathonRegistration(5, true)).rejects.toThrow(
      "Cannot modify registration status for a completed hackathon"
    );
  });

  it("should toggle require_github_link", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "10", role: "organizer" },
    } as any);

    vi.mocked(prisma.organizer_hackathon.findUnique).mockResolvedValueOnce({
      id: 5,
      require_github_link: false,
      organizer_organizerprofile: { user_id: 10 },
    } as any);

    vi.mocked(prisma.organizer_hackathon.update).mockResolvedValueOnce({
      id: 5,
      require_github_link: true,
    } as any);

    const res = await toggleRequireGithubLink(5, true);
    expect(res.success).toBe(true);
    expect(res.require_github_link).toBe(true);
    expect(prisma.organizer_hackathon.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { require_github_link: true },
    });
  });
});

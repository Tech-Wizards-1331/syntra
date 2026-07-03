import { describe, it, expect, vi, beforeEach } from "vitest";
import { uploadToCloudinary } from "@/lib/services/cloudinary";
import {
  saveOrganizerProfile,
  saveParticipantProfile,
  getPreseededSkills,
} from "@/app/actions/profile";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { v2 as cloudinary } from "cloudinary";

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn(),
  unstable_update: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    accounts_user: {
      update: vi.fn(),
    },
    organizer_organizerprofile: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    participant_participantprofile: {
      upsert: vi.fn(),
    },
    participant_skill: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    participant_participantprofile_skills: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
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
      upload: vi.fn(),
    },
  },
}));

describe("Cloudinary Upload Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject invalid base64 format", async () => {
    await expect(uploadToCloudinary("invalid-base64")).rejects.toThrow(
      "Invalid base64 image data format"
    );
  });

  it("should reject non-allowed mime types", async () => {
    const dataUrl = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    await expect(uploadToCloudinary(dataUrl)).rejects.toThrow(
      "Invalid file type. Only JPG, JPEG, and PNG are allowed."
    );
  });

  it("should reject files exceeding 5MB limit", async () => {
    // Generate an extremely large base64 content (>5MB)
    const mockBigBase64 = "data:image/png;base64," + "A".repeat(7 * 1024 * 1024);
    await expect(uploadToCloudinary(mockBigBase64)).rejects.toThrow(
      "File size exceeds 5MB limit."
    );
  });

  it("should successfully upload valid image base64 data", async () => {
    const validDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    
    vi.mocked(cloudinary.uploader.upload).mockResolvedValueOnce({
      secure_url: "https://res.cloudinary.com/dummy/image/upload/logo.png",
    } as any);

    const result = await uploadToCloudinary(validDataUrl);
    expect(result).toBe("https://res.cloudinary.com/dummy/image/upload/logo.png");
    expect(cloudinary.uploader.upload).toHaveBeenCalledWith(validDataUrl, {
      folder: "syntra_logos",
    });
  });
});

describe("Profile Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPreseededSkills", () => {
    it("should return default skills combined with database skills", async () => {
      vi.mocked(prisma.participant_skill.findMany).mockResolvedValueOnce([
        { name: "Rust" },
        { name: "Svelte" },
      ] as any);

      const skills = await getPreseededSkills();
      expect(skills).toContain("React");
      expect(skills).toContain("Rust");
      expect(skills).toContain("Svelte");
      expect(skills.length).toBeGreaterThan(5);
    });
  });

  describe("saveOrganizerProfile", () => {
    it("should throw if user is not authenticated", async () => {
      vi.mocked(auth).mockResolvedValueOnce(null);

      await expect(
        saveOrganizerProfile({ organizationName: "My Org" })
      ).rejects.toThrow("Unauthorized or invalid role");
    });

    it("should throw if user is not an organizer", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "12", role: "participant" },
      } as any);

      await expect(
        saveOrganizerProfile({ organizationName: "My Org" })
      ).rejects.toThrow("Unauthorized or invalid role");
    });

    it("should throw if organizationName is empty", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "12", role: "organizer" },
      } as any);

      await expect(
        saveOrganizerProfile({ organizationName: "  " })
      ).rejects.toThrow("Organization name is required");
    });

    it("should save organizer profile successfully and update complete status", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "15", role: "organizer" },
      } as any);

      vi.mocked(prisma.organizer_organizerprofile.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.organizer_organizerprofile.upsert).mockResolvedValueOnce({
        id: 1,
      } as any);

      const result = await saveOrganizerProfile({
        organizationName: "Tech Corp",
        website: "https://techcorp.com",
      });

      expect(result.success).toBe(true);
      expect(result.profileId).toBe(1);
      expect(prisma.organizer_organizerprofile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 15 },
          create: expect.objectContaining({
            organization_name: "Tech Corp",
            website: "https://techcorp.com",
          }),
        })
      );
      expect(prisma.accounts_user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 15 },
          data: expect.objectContaining({
            is_profile_complete: true,
          }),
        })
      );
    });

    it("should upload new logo if logoBase64 is provided", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "15", role: "organizer" },
      } as any);

      vi.mocked(cloudinary.uploader.upload).mockResolvedValueOnce({
        secure_url: "https://res.cloudinary.com/dummy/logo.png",
      } as any);

      vi.mocked(prisma.organizer_organizerprofile.findUnique).mockResolvedValueOnce(null);
      vi.mocked(prisma.organizer_organizerprofile.upsert).mockResolvedValueOnce({
        id: 1,
      } as any);

      const result = await saveOrganizerProfile({
        organizationName: "Tech Corp",
        logoBase64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      });

      expect(result.success).toBe(true);
      expect(result.logoUrl).toBe("https://res.cloudinary.com/dummy/logo.png");
      expect(prisma.organizer_organizerprofile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 15 },
          create: expect.objectContaining({
            logo: "https://res.cloudinary.com/dummy/logo.png",
          }),
        })
      );
    });
  });

  describe("saveParticipantProfile", () => {
    it("should throw if user is not a participant", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "20", role: "organizer" },
      } as any);

      await expect(
        saveParticipantProfile({
          college: "MIT",
          semester: 4,
          degree: "CS",
          visibility: true,
          skills: ["React"],
        })
      ).rejects.toThrow("Unauthorized or invalid role");
    });

    it("should throw if college is empty", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "20", role: "participant" },
      } as any);

      await expect(
        saveParticipantProfile({
          college: "",
          semester: 4,
          degree: "CS",
          visibility: true,
          skills: ["React"],
        })
      ).rejects.toThrow("College name is required");
    });

    it("should save participant profile and synchronize skills mapping", async () => {
      vi.mocked(auth).mockResolvedValueOnce({
        user: { id: "22", role: "participant" },
      } as any);

      // Mock skill queries: "React" exists, "TailwindCSS" is new
      vi.mocked(prisma.participant_skill.findUnique)
        .mockResolvedValueOnce({ id: 101, name: "React" } as any) // for React
        .mockResolvedValueOnce(null); // for TailwindCSS

      vi.mocked(prisma.participant_skill.create).mockResolvedValueOnce({
        id: 102,
        name: "TailwindCSS",
      } as any);

      vi.mocked(prisma.participant_participantprofile.upsert).mockResolvedValueOnce({
        id: 5,
      } as any);

      const result = await saveParticipantProfile({
        college: "MIT",
        semester: 6,
        degree: "B.Tech CSE",
        visibility: true,
        skills: ["React", "TailwindCSS"],
      });

      expect(result.success).toBe(true);
      expect(prisma.participant_participantprofile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { user_id: 22 },
          create: expect.objectContaining({
            college: "MIT",
            semester: 6,
            degree: "B.Tech CSE",
            visibility: true,
          }),
        })
      );

      // Verify skills deleted and recreated
      expect(prisma.participant_participantprofile_skills.deleteMany).toHaveBeenCalledWith({
        where: { participantprofile_id: 5 },
      });
      expect(prisma.participant_participantprofile_skills.createMany).toHaveBeenCalledWith({
        data: [
          { participantprofile_id: 5, skill_id: 101 },
          { participantprofile_id: 5, skill_id: 102 },
        ],
      });

      // Verify user complete status
      expect(prisma.accounts_user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 22 },
          data: expect.objectContaining({
            is_profile_complete: true,
          }),
        })
      );
    });
  });
});

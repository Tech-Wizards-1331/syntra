import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTeam,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  searchUsersToRegister,
  submitTeamRegistration,
} from "@/app/actions/teams";

// Mock auth
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock crypto
vi.mock("crypto", () => ({
  randomUUID: vi.fn(() => "mock-uuid-1234"),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => {
  const mockTx = {
    participant_team: {
      create: vi.fn(),
      update: vi.fn(),
    },
    participant_teammember: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    participant_teammember_skills: {
      createMany: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    participant_teamrequest: {
      findMany: vi.fn(() => []),
      updateMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    organizer_scanrecord: {
      deleteMany: vi.fn(),
    },
    participant_skill: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };

  const mockPrisma = {
    participant_team: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    participant_teammember: {
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      delete: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    participant_teammember_skills: {
      deleteMany: vi.fn(),
    },
    participant_participantprofile: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    participant_teamrequest: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    organizer_hackathon: {
      findUnique: vi.fn(),
    },
    organizer_scanrecord: {
      deleteMany: vi.fn(),
    },
    accounts_user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    participant_skill: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
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

const mockSession = {
  user: { id: "1", email: "leader@test.com", role: "participant", name: "Test Leader" },
};

const mockHackathon = {
  id: 10,
  status: "registration",
  registration_deadline: new Date(Date.now() + 86400000),
  max_team_size: 4,
  min_team_size: 2,
};

const mockProfile = {
  id: 1,
  college: "Test College",
  semester: 4,
  degree: "B.Tech",
  accounts_user: {
    id: 1,
    full_name: "Test Leader",
    email: "leader@test.com",
  },
  participant_participantprofile_skills: [
    { skill_id: 1, participant_skill: { name: "React" } },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(mockSession);
  mockPrisma.participant_team.findFirst.mockResolvedValue(null);
  mockPrisma.accounts_user.findUnique.mockResolvedValue({
    id: 1,
    email: "leader@test.com",
    full_name: "Test Leader",
  });
  mockPrisma.participant_participantprofile.findUnique.mockResolvedValue(mockProfile);
  mockPrisma.participant_teammember.findMany.mockResolvedValue([]);
});

// ─── Create Team ────────────────────────────────────────────────

describe("createTeam", () => {
  it("creates a team and adds leader as first member", async () => {
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue(mockHackathon);
    mockPrisma.participant_team.findFirst.mockResolvedValue(null);
    mockPrisma.participant_participantprofile.findUnique.mockResolvedValue(mockProfile);
    mockPrisma._tx.participant_team.create.mockResolvedValue({
      id: 100,
      invite_token: null,
      qr_token: null,
    });
    mockPrisma._tx.participant_teammember.create.mockResolvedValue({ id: 200 });

    const result = await createTeam(10, "Alpha Team");

    expect(result.success).toBe(true);
    expect(result.teamId).toBe(100);
    expect(mockPrisma._tx.participant_team.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma._tx.participant_teammember.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma._tx.participant_teammember_skills.createMany).toHaveBeenCalledTimes(1);
  });

  it("blocks creation if user is already in a team for this hackathon", async () => {
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue(mockHackathon);
    mockPrisma.participant_team.findFirst.mockResolvedValue({ id: 50 });

    await expect(createTeam(10, "Alpha Team")).rejects.toThrow(
      "You are already registered in a team for this hackathon"
    );
  });

  it("blocks creation if registration is closed", async () => {
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue({
      ...mockHackathon,
      status: "active",
    });

    await expect(createTeam(10, "Alpha Team")).rejects.toThrow(
      "Registration is not open for this hackathon"
    );
  });

  it("blocks creation if deadline passed", async () => {
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue({
      ...mockHackathon,
      registration_deadline: new Date(Date.now() - 86400000),
    });

    await expect(createTeam(10, "Alpha Team")).rejects.toThrow(
      "Registration deadline has passed"
    );
  });

  it("rejects non-participants", async () => {
    mockAuth.mockResolvedValue({
      user: { id: "1", email: "org@test.com", role: "organizer" },
    });

    await expect(createTeam(10, "Alpha Team")).rejects.toThrow(
      "Unauthorized: participant role required"
    );
  });
});

// ─── Add Team Member ──────────────────────────────────────────────

describe("addTeamMember", () => {
  it("adds a member successfully if under capacity and draft mode", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: false,
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue(mockHackathon);
    mockPrisma.participant_teammember.count.mockResolvedValue(1);
    mockPrisma.participant_teammember.findFirst.mockResolvedValue(null);
    mockPrisma._tx.participant_skill.findUnique.mockResolvedValue({ id: 1, name: "React" });
    mockPrisma._tx.participant_teammember.create.mockResolvedValue({ id: 201 });

    const result = await addTeamMember(100, {
      name: "New Member",
      email: "newmember@test.com",
      college: "Test College",
      degree: "B.Tech",
      semester: 4,
      role: "Frontend",
      skills: ["React"],
    });

    expect(result.success).toBe(true);
    expect(mockPrisma._tx.participant_teammember.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: "New Member",
        email: "newmember@test.com",
        college: "Test College",
        degree: "B.Tech (Frontend)",
        semester: 4,
        team_id: 100,
      }),
    });
  });

  it("blocks adding members if the team is already registered", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: true,
    });

    await expect(
      addTeamMember(100, {
        name: "New Member",
        email: "newmember@test.com",
        college: "Test College",
        degree: "B.Tech",
        semester: 4,
        role: "Frontend",
        skills: ["React"],
      })
    ).rejects.toThrow("Cannot add members to a fully registered team");
  });

  it("blocks adding members if team capacity is reached", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: false,
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue(mockHackathon);
    mockPrisma.participant_teammember.findMany.mockResolvedValue([
      { email: "leader@test.com" },
      { email: "m1@test.com" },
      { email: "m2@test.com" },
      { email: "m3@test.com" },
    ]);

    await expect(
      addTeamMember(100, {
        name: "New Member",
        email: "newmember@test.com",
        college: "Test College",
        degree: "B.Tech",
        semester: 4,
        role: "Frontend",
        skills: ["React"],
      })
    ).rejects.toThrow("Team is at maximum capacity");
  });

  it("blocks if the email is already registered in this hackathon", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: false,
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue(mockHackathon);
    mockPrisma.participant_teammember.count.mockResolvedValue(1);
    mockPrisma.participant_teammember.findFirst.mockResolvedValue({ id: 999 });

    await expect(
      addTeamMember(100, {
        name: "Duplicate Member",
        email: "duplicate@test.com",
        college: "Test College",
        degree: "B.Tech",
        semester: 4,
        role: "Frontend",
        skills: ["React"],
      })
    ).rejects.toThrow("This email is already registered in a team for this hackathon");
  });
});

// ─── Update Team Member ───────────────────────────────────────────

describe("updateTeamMember", () => {
  it("updates a team member details successfully", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: false,
    });
    mockPrisma.participant_teammember.findFirst.mockResolvedValue({ id: 201, team_id: 100, email: "newemail@test.com" });
    mockPrisma._tx.participant_skill.findUnique.mockResolvedValue({ id: 2, name: "Node.js" });

    const result = await updateTeamMember(100, 201, {
      name: "Updated Member",
      email: "newemail@test.com",
      college: "Updated College",
      degree: "B.Tech",
      semester: 5,
      role: "Backend",
      skills: ["Node.js"],
    });

    expect(result.success).toBe(true);
    expect(mockPrisma._tx.participant_teammember.update).toHaveBeenCalledWith({
      where: { id: 201 },
      data: {
        name: "Updated Member",
        email: "newemail@test.com",
        college: "Updated College",
        degree: "B.Tech (Backend)",
        semester: 5,
      },
    });
  });

  it("blocks update if the team is already registered", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: true,
    });

    await expect(
      updateTeamMember(100, 201, {
        name: "Updated Member",
        email: "newemail@test.com",
        college: "Updated College",
        degree: "B.Tech",
        semester: 5,
        role: "Backend",
        skills: [],
      })
    ).rejects.toThrow("Cannot edit members of a fully registered team");
  });
});

// ─── Remove Team Member ───────────────────────────────────────────

describe("removeTeamMember", () => {
  it("removes a team member if caller is leader and draft mode", async () => {
    mockPrisma.participant_teammember.findUnique.mockResolvedValue({
      id: 201,
      email: "member@test.com",
      participant_team: {
        id: 100,
        leader_id: 1,
        is_registered: false,
      },
    });

    const result = await removeTeamMember(201);
    expect(result.success).toBe(true);
    expect(mockPrisma._tx.participant_teammember.delete).toHaveBeenCalledWith({
      where: { id: 201 },
    });
  });

  it("blocks removal if team is already registered", async () => {
    mockPrisma.participant_teammember.findUnique.mockResolvedValue({
      id: 201,
      email: "member@test.com",
      participant_team: {
        id: 100,
        leader_id: 1,
        is_registered: true,
      },
    });

    await expect(removeTeamMember(201)).rejects.toThrow(
      "Cannot remove members from a fully registered team"
    );
  });

  it("blocks if caller is neither leader nor the member themselves", async () => {
    mockPrisma.participant_teammember.findUnique.mockResolvedValue({
      id: 201,
      email: "member@test.com",
      participant_team: {
        id: 100,
        leader_id: 99,
        is_registered: false,
      },
    });

    await expect(removeTeamMember(201)).rejects.toThrow(
      "Only the team leader or the member themselves can remove this member"
    );
  });

  it("blocks leader from removing themselves", async () => {
    mockPrisma.participant_teammember.findUnique.mockResolvedValue({
      id: 200,
      email: "leader@test.com",
      participant_team: {
        id: 100,
        leader_id: 1,
        is_registered: false,
      },
    });

    await expect(removeTeamMember(200)).rejects.toThrow(
      "Team leader cannot leave the team. Delete the team instead."
    );
  });
});

// ─── Search Users to Register ───────────────────────────────────────

describe("searchUsersToRegister", () => {
  it("returns users and profiles matching query", async () => {
    mockPrisma.accounts_user.findMany.mockResolvedValue([
      {
        id: 2,
        full_name: "John Doe",
        email: "john@test.com",
        participant_participantprofile: {
          college: "Some College",
          degree: "B.Tech",
          semester: 4,
          participant_participantprofile_skills: [
            { participant_skill: { name: "TypeScript" } },
          ],
        },
      },
    ]);

    const result = await searchUsersToRegister("John");
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({
      userId: 2,
      name: "John Doe",
      email: "john@test.com",
      college: "Some College",
      degree: "B.Tech",
      semester: 4,
      skills: ["TypeScript"],
    });
  });

  it("returns empty array for empty query", async () => {
    const result = await searchUsersToRegister("   ");
    expect(result).toEqual([]);
  });
});

// ─── Submit Team Registration ───────────────────────────────────────

describe("submitTeamRegistration", () => {
  it("registers team successfully when requirements are met", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: false,
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue(mockHackathon);
    mockPrisma.participant_teammember.findMany.mockResolvedValue([
      { id: 200, name: "Leader", email: "leader@test.com", college: "Col", degree: "Deg", semester: 4 },
      { id: 201, name: "Member", email: "member@test.com", college: "Col", degree: "Deg", semester: 4 },
    ]);

    const result = await submitTeamRegistration(100);
    expect(result.success).toBe(true);
    expect(mockPrisma._tx.participant_team.update).toHaveBeenCalledWith({
      where: { id: 100 },
      data: {
        is_registered: true,
        qr_token: "mock-uuid-1234",
        is_qr_active: true,
      },
    });
  });

  it("blocks if team is already registered", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: true,
    });

    await expect(submitTeamRegistration(100)).rejects.toThrow("Team is already registered");
  });

  it("blocks if hackathon is paid", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: false,
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue({
      ...mockHackathon,
      is_paid: true,
    });

    await expect(submitTeamRegistration(100)).rejects.toThrow(
      "This hackathon requires payment. Please use the payment checkout to complete registration."
    );
  });

  it("blocks if team size is less than minimum", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: false,
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue(mockHackathon);
    mockPrisma.participant_teammember.findMany.mockResolvedValue([
      { id: 200, name: "Leader", email: "leader@test.com", college: "Col", degree: "Deg", semester: 4 },
    ]);

    await expect(submitTeamRegistration(100)).rejects.toThrow(
      "Team does not meet the minimum size of 2 members"
    );
  });

  it("blocks if team size exceeds maximum", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: false,
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue(mockHackathon);
    mockPrisma.participant_teammember.findMany.mockResolvedValue([
      { id: 200, name: "Leader", email: "l@test.com", college: "Col", degree: "Deg", semester: 4 },
      { id: 201, name: "M1", email: "m1@test.com", college: "Col", degree: "Deg", semester: 4 },
      { id: 202, name: "M2", email: "m2@test.com", college: "Col", degree: "Deg", semester: 4 },
      { id: 203, name: "M3", email: "m3@test.com", college: "Col", degree: "Deg", semester: 4 },
      { id: 204, name: "M4", email: "m4@test.com", college: "Col", degree: "Deg", semester: 4 },
    ]);

    await expect(submitTeamRegistration(100)).rejects.toThrow(
      "Team exceeds the maximum size of 4 members"
    );
  });

  it("blocks if any member has incomplete details", async () => {
    mockPrisma.participant_team.findUnique.mockResolvedValue({
      id: 100,
      leader_id: 1,
      hackathon_id: 10,
      is_registered: false,
    });
    mockPrisma.organizer_hackathon.findUnique.mockResolvedValue(mockHackathon);
    mockPrisma.participant_teammember.findMany.mockResolvedValue([
      { id: 200, name: "Leader", email: "leader@test.com", college: "Col", degree: "Deg", semester: 4 },
      { id: 201, name: "", email: "member@test.com", college: "Col", degree: "Deg", semester: 4 },
    ]);

    await expect(submitTeamRegistration(100)).rejects.toThrow(
      "Member details are incomplete."
    );
  });
});

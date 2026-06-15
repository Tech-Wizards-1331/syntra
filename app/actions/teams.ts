"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

// ─── Helpers ────────────────────────────────────────────────────────

async function requireParticipant() {
  const session = await auth();
  if (!session?.user || session.user.role !== "participant") {
    throw new Error("Unauthorized: participant role required");
  }
  return { userId: Number(session.user.id), email: session.user.email!, session };
}

async function requireTeamLeader(teamId: number) {
  const { userId, email, session } = await requireParticipant();
  const team = await prisma.participant_team.findUnique({
    where: { id: teamId },
  });
  if (!team || team.leader_id !== userId) {
    throw new Error("Access denied: you are not the team leader");
  }
  return { userId, email, session, team };
}

// ─── Create Team ────────────────────────────────────────────────────

export async function createTeam(hackathonId: number, teamName: string) {
  const { userId, email, session } = await requireParticipant();

  const trimmed = teamName.trim();
  if (!trimmed) throw new Error("Team name is required");

  // Verify hackathon exists and is in registration phase
  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: hackathonId },
  });
  if (!hackathon) throw new Error("Hackathon not found");
  if (!["registration", "registration_open", "published"].includes(hackathon.status)) {
    throw new Error("Registration is not open for this hackathon");
  }
  if (new Date() > hackathon.registration_deadline) {
    throw new Error("Registration deadline has passed");
  }

  // Check if user is already in a team for this hackathon
  const existingTeam = await prisma.participant_team.findFirst({
    where: {
      hackathon_id: hackathonId,
      OR: [
        { leader_id: userId },
        { participant_teammember: { some: { email } } },
      ],
    },
  });
  if (existingTeam) {
    throw new Error("You are already registered in a team for this hackathon");
  }

  const profile = await prisma.participant_participantprofile.findUnique({
    where: { user_id: userId },
    include: {
      participant_participantprofile_skills: {
        include: { participant_skill: true },
      },
      accounts_user: true,
    },
  });
  if (!profile) throw new Error("Profile not found. Please complete your profile first.");

  const now = new Date();

  // Create team
  const newTeam = await prisma.participant_team.create({
    data: {
      name: trimmed,
      hackathon_id: hackathonId,
      leader_id: userId,
      qr_token: null,
      invite_token: randomUUID(),
      is_registered: false,
      is_qr_active: false,
      food_tokens_total: 0,
      food_tokens_used: 0,
      created_at: now,
      updated_at: now,
    },
  });

  // Add leader as first member
  const member = await prisma.participant_teammember.create({
    data: {
      name: profile.accounts_user.full_name,
      email: profile.accounts_user.email,
      college: profile.college,
      semester: profile.semester,
      degree: profile.degree,
      team_id: newTeam.id,
      created_at: now,
    },
  });

  // Clone skills from profile to member
  const profileSkills = profile.participant_participantprofile_skills;
  if (profileSkills.length > 0) {
    await prisma.participant_teammember_skills.createMany({
      data: profileSkills.map((ps) => ({
        teammember_id: member.id,
        skill_id: ps.skill_id,
      })),
    });
  }

  // Clear any pending team requests for this user in this hackathon
  await prisma.participant_teamrequest.updateMany({
    where: {
      receiver_id: userId,
      status: "pending",
      participant_team: { hackathon_id: hackathonId },
    },
    data: { status: "expired" },
  });

  revalidatePath("/participant/dashboard");
  return { success: true, teamId: newTeam.id };
}

// ─── Add Team Member ────────────────────────────────────────────────

export async function addTeamMember(
  teamId: number,
  data: {
    name: string;
    email: string;
    college: string;
    degree: string;
    semester: number;
    role: string;
    skills: string[];
  }
) {
  const { team } = await requireTeamLeader(teamId);

  if (team.is_registered) {
    throw new Error("Cannot add members to a fully registered team");
  }

  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: team.hackathon_id },
  });
  if (!hackathon) throw new Error("Hackathon not found");

  // Check capacity dynamically accounting for leader presence
  const leaderUser = await prisma.accounts_user.findUnique({
    where: { id: team.leader_id },
    select: { email: true },
  });
  if (!leaderUser) throw new Error("Leader user not found");

  const members = await prisma.participant_teammember.findMany({
    where: { team_id: teamId },
    select: { email: true },
  });

  const leaderInMembers = members.some(
    (m) => m.email.toLowerCase() === leaderUser.email.toLowerCase()
  );

  const currentSlots = leaderInMembers ? members.length : 1 + members.length;
  if (currentSlots >= hackathon.max_team_size) {
    throw new Error("Team is at maximum capacity");
  }

  // Check email uniqueness within this hackathon
  const emailExists = await prisma.participant_teammember.findFirst({
    where: {
      email: data.email.toLowerCase().trim(),
      participant_team: { hackathon_id: team.hackathon_id },
    },
  });
  if (emailExists) {
    throw new Error("This email is already registered in a team for this hackathon");
  }

  // Check if this email is the leader of any team in this hackathon
  const leaderExists = await prisma.participant_team.findFirst({
    where: {
      hackathon_id: team.hackathon_id,
      accounts_user: {
        email: data.email.toLowerCase().trim(),
      },
    },
  });
  if (leaderExists) {
    throw new Error("This email is already registered in a team for this hackathon");
  }

  // Format role into degree as "Degree (Role)"
  const formattedDegree = data.role.trim()
    ? `${data.degree.trim()} (${data.role.trim()})`
    : data.degree.trim();

  const now = new Date();

  const member = await prisma.participant_teammember.create({
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      college: data.college.trim(),
      degree: formattedDegree,
      semester: data.semester,
      team_id: teamId,
      created_at: now,
    },
  });

  if (data.skills.length > 0) {
    const uniqueSkills = Array.from(new Set(data.skills.map((s) => s.trim()).filter(Boolean)));
    for (const trimmedSkill of uniqueSkills) {
      let skill = await prisma.participant_skill.findUnique({
        where: { name: trimmedSkill },
      });
      if (!skill) {
        skill = await prisma.participant_skill.create({
          data: { name: trimmedSkill },
        });
      }
      await prisma.participant_teammember_skills.create({
        data: {
          teammember_id: member.id,
          skill_id: skill.id,
        },
      });
    }
  }

  revalidatePath("/participant/dashboard");
  return { success: true };
}

// ─── Update Team Member ─────────────────────────────────────────────

export async function updateTeamMember(
  teamId: number,
  memberId: number,
  data: {
    name: string;
    email: string;
    college: string;
    degree: string;
    semester: number;
    role: string;
    skills: string[];
  }
) {
  const { team } = await requireTeamLeader(teamId);

  if (team.is_registered) {
    throw new Error("Cannot edit members of a fully registered team");
  }

  // Verify member belongs to team
  const member = await prisma.participant_teammember.findFirst({
    where: { id: memberId, team_id: teamId },
  });
  if (!member) throw new Error("Member not found in team");

  if (data.email.toLowerCase().trim() !== (member.email || "").toLowerCase().trim()) {
    const emailExists = await prisma.participant_teammember.findFirst({
      where: {
        email: data.email.toLowerCase().trim(),
        participant_team: { hackathon_id: team.hackathon_id },
        id: { not: memberId },
      },
    });
    if (emailExists) {
      throw new Error("This email is already registered in a team for this hackathon");
    }

    // Check if this email is the leader of any team in this hackathon
    const leaderExists = await prisma.participant_team.findFirst({
      where: {
        hackathon_id: team.hackathon_id,
        accounts_user: {
          email: data.email.toLowerCase().trim(),
        },
      },
    });
    if (leaderExists) {
      throw new Error("This email is already registered in a team for this hackathon");
    }
  }

  // Format role into degree as "Degree (Role)"
  const formattedDegree = data.role.trim()
    ? `${data.degree.trim()} (${data.role.trim()})`
    : data.degree.trim();

  // Update member basic details
  await prisma.participant_teammember.update({
    where: { id: memberId },
    data: {
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      college: data.college.trim(),
      degree: formattedDegree,
      semester: data.semester,
    },
  });

  // Update skills (delete old, insert new)
  await prisma.participant_teammember_skills.deleteMany({
    where: { teammember_id: memberId },
  });

  if (data.skills.length > 0) {
    const uniqueSkills = Array.from(new Set(data.skills.map((s) => s.trim()).filter(Boolean)));
    for (const trimmedSkill of uniqueSkills) {
      let skill = await prisma.participant_skill.findUnique({
        where: { name: trimmedSkill },
      });
      if (!skill) {
        skill = await prisma.participant_skill.create({
          data: { name: trimmedSkill },
        });
      }
      await prisma.participant_teammember_skills.create({
        data: {
          teammember_id: memberId,
          skill_id: skill.id,
        },
      });
    }
  }

  revalidatePath("/participant/dashboard");
  return { success: true };
}

// ─── Remove Team Member ─────────────────────────────────────────────

export async function removeTeamMember(memberId: number) {
  const { userId, email } = await requireParticipant();

  const member = await prisma.participant_teammember.findUnique({
    where: { id: memberId },
    include: {
      participant_team: true,
    },
  });
  if (!member) throw new Error("Team member not found");

  const team = member.participant_team;
  if (team.is_registered) {
    throw new Error("Cannot remove members from a fully registered team");
  }

  const isLeader = team.leader_id === userId;
  const isSelf = member.email === email;

  if (!isLeader && !isSelf) {
    throw new Error("Only the team leader or the member themselves can remove this member");
  }

  // Prevent leader from removing themselves
  if (isSelf && isLeader) {
    throw new Error("Team leader cannot leave the team. Delete the team instead.");
  }

  // Delete skills first
  await prisma.participant_teammember_skills.deleteMany({
    where: { teammember_id: memberId },
  });
  // Delete scan records for this member
  await prisma.organizer_scanrecord.deleteMany({
    where: { team_member_id: memberId },
  });
  // Delete the member
  await prisma.participant_teammember.delete({
    where: { id: memberId },
  });

  revalidatePath("/participant/dashboard");
  return { success: true };
}

// ─── Search Users to Register ───────────────────────────────────────

export async function searchUsersToRegister(query: string) {
  const { userId } = await requireParticipant();
  const q = query.toLowerCase().trim();
  if (!q) return [];

  // Find users who are participants, exclude the leader
  const users = await prisma.accounts_user.findMany({
    where: {
      role: "participant",
      id: { not: userId },
      OR: [
        { email: { contains: q } },
        { full_name: { contains: q } },
      ],
    },
    include: {
      participant_participantprofile: {
        include: {
          participant_participantprofile_skills: {
            include: { participant_skill: true },
          },
        },
      },
    },
    take: 10,
  });

  return users.map((u) => {
    const profile = u.participant_participantprofile;
    return {
      userId: u.id,
      name: u.full_name,
      email: u.email,
      college: profile?.college || "",
      degree: profile?.degree || "",
      semester: profile?.semester || null,
      skills: profile?.participant_participantprofile_skills.map((s) => s.participant_skill.name) || [],
    };
  });
}

// ─── Submit Team Registration ───────────────────────────────────────

export async function submitTeamRegistration(teamId: number) {
  const { team } = await requireTeamLeader(teamId);

  if (team.is_registered) {
    throw new Error("Team is already registered");
  }

  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: team.hackathon_id },
  });
  if (!hackathon) throw new Error("Hackathon not found");

  if (hackathon.is_paid) {
    throw new Error("This hackathon requires payment. Please use the payment checkout to complete registration.");
  }

  // Check Hackathon Total Registered Teams Capacity Limit
  let maxTeamsLimit: number | null = null;
  if (hackathon.room_configuration) {
    try {
      const parsed = JSON.parse(hackathon.room_configuration);
      if (Array.isArray(parsed)) {
        const meta = parsed.find((el: any) => el.room_no === "METADATA" && el.type === "metadata");
        if (meta && typeof meta.max_teams === "number") {
          maxTeamsLimit = meta.max_teams;
        }
      }
    } catch (e) {
      console.error("Failed to parse room_configuration for max_teams", e);
    }
  }

  if (maxTeamsLimit !== null) {
    const registeredCount = await prisma.participant_team.count({
      where: {
        hackathon_id: hackathon.id,
        is_registered: true,
      },
    });
    if (registeredCount >= maxTeamsLimit) {
      throw new Error("This hackathon has reached its maximum allowed team registrations.");
    }
  }

  const leaderUser = await prisma.accounts_user.findUnique({
    where: { id: team.leader_id },
    select: { email: true, full_name: true },
  });
  if (!leaderUser) throw new Error("Leader user not found");

  const leaderProfile = await prisma.participant_participantprofile.findUnique({
    where: { user_id: team.leader_id },
    select: {
      college: true,
      semester: true,
      degree: true,
      participant_participantprofile_skills: {
        select: { skill_id: true },
      },
    },
  });

  const members = await prisma.participant_teammember.findMany({
    where: { team_id: teamId },
  });

  const leaderInMembers = members.some(
    (m) => m.email.toLowerCase() === leaderUser.email.toLowerCase()
  );

  const currentSlots = leaderInMembers ? members.length : 1 + members.length;
  if (currentSlots < hackathon.min_team_size) {
    throw new Error(`Team does not meet the minimum size of ${hackathon.min_team_size} members`);
  }
  if (currentSlots > hackathon.max_team_size) {
    throw new Error(`Team exceeds the maximum size of ${hackathon.max_team_size} members`);
  }

  // Validate that all members have complete details
  for (const member of members) {
    if (!member.name.trim() || !member.email.trim() || !member.college.trim() || !member.degree.trim() || member.semester === null) {
      throw new Error(`Member details are incomplete.`);
    }
  }

  const qrToken = randomUUID();

  // If the leader is not in members, create a teammember record for them (Django parity)
  if (!leaderInMembers && leaderProfile) {
    const leaderMember = await prisma.participant_teammember.create({
      data: {
        team_id: teamId,
        name: leaderUser.full_name || leaderUser.email,
        email: leaderUser.email,
        college: leaderProfile.college,
        semester: leaderProfile.semester,
        degree: leaderProfile.degree,
        created_at: new Date(),
      },
    });

    if (leaderProfile.participant_participantprofile_skills?.length > 0) {
      await prisma.participant_teammember_skills.createMany({
        data: leaderProfile.participant_participantprofile_skills.map((ps) => ({
          teammember_id: leaderMember.id,
          skill_id: ps.skill_id,
        })),
      });
    }
  }

  await prisma.participant_team.update({
    where: { id: teamId },
    data: {
      is_registered: true,
      qr_token: qrToken,
      is_qr_active: true,
    },
  });

  // Auto-reject all pending outgoing invites for this team — registration is
  // now finalised and no new members can be added.
  await prisma.participant_teamrequest.updateMany({
    where: { team_id: teamId, status: "pending" },
    data: { status: "rejected" },
  });

  revalidatePath("/participant/dashboard");
  return { success: true };
}

export async function deleteTeam(teamId: number) {
  const { team } = await requireTeamLeader(teamId);

  if (team.is_registered) {
    throw new Error("Cannot delete a fully registered team");
  }

  const members = await prisma.participant_teammember.findMany({
    where: { team_id: teamId },
  });
  const memberIds = members.map((m) => m.id);

  // Delete skills
  await prisma.participant_teammember_skills.deleteMany({
    where: { teammember_id: { in: memberIds } },
  });

  // Delete scan records
  await prisma.organizer_scanrecord.deleteMany({
    where: { team_member_id: { in: memberIds } },
  });

  // Delete members
  await prisma.participant_teammember.deleteMany({
    where: { team_id: teamId },
  });

  // Delete team requests
  await prisma.participant_teamrequest.deleteMany({
    where: { team_id: teamId },
  });

  // Delete payments
  await prisma.participant_payment.deleteMany({
    where: { team_id: teamId },
  });

  // Finally, delete the team
  await prisma.participant_team.delete({
    where: { id: teamId },
  });

  revalidatePath("/participant/dashboard");
  return { success: true };
}

// ─── Join Team by Invite Token ──────────────────────────────────────

export async function joinTeamByToken(inviteToken: string) {
  const { userId, email } = await requireParticipant();

  const trimmed = inviteToken.trim();
  if (!trimmed) throw new Error("Invite token is required");

  // Look up team by invite token
  const team = await prisma.participant_team.findFirst({
    where: { invite_token: trimmed },
    include: { organizer_hackathon: true },
  });
  if (!team) throw new Error("Invalid invite token.");

  // Check if hackathon registration is still open
  if (new Date() > team.organizer_hackathon.registration_deadline) {
    throw new Error(
      "Invite has expired because hackathon registration is closed."
    );
  }

  // Check if user is already in this team
  const isLeader = team.leader_id === userId;
  const isMember = await prisma.participant_teammember.findFirst({
    where: { team_id: team.id, email },
  });
  if (isLeader || isMember) {
    throw new Error("You are already a member of this team.");
  }

  // Check if user is already in ANY team for this hackathon
  const existingTeam = await prisma.participant_team.findFirst({
    where: {
      hackathon_id: team.hackathon_id,
      OR: [
        { leader_id: userId },
        { participant_teammember: { some: { email } } },
      ],
    },
  });
  if (existingTeam) {
    throw new Error("You are already in a team for this hackathon.");
  }

  // Check team capacity
  const memberCount = await prisma.participant_teammember.count({
    where: { team_id: team.id },
  });
  if (memberCount >= team.organizer_hackathon.max_team_size) {
    throw new Error("This team is already full.");
  }

  // Get user profile for member details and skill syncing
  const user = await prisma.accounts_user.findUnique({
    where: { id: userId },
    include: {
      participant_participantprofile: {
        include: {
          participant_participantprofile_skills: true,
        },
      },
    },
  });

  const profile = user?.participant_participantprofile;
  const now = new Date();

  // Add user as team member
  const member = await prisma.participant_teammember.create({
    data: {
      team_id: team.id,
      name: user?.full_name || email,
      email: email,
      college: profile?.college || "Not Specified",
      semester: profile?.semester || 1,
      degree: profile?.degree || "Not Specified",
      created_at: now,
    },
  });

  // Copy skills from profile
  if (profile?.participant_participantprofile_skills.length) {
    await prisma.participant_teammember_skills.createMany({
      data: profile.participant_participantprofile_skills.map((ps) => ({
        teammember_id: member.id,
        skill_id: ps.skill_id,
      })),
    });
  }

  // Auto-delete all pending invites for this user for the same hackathon
  await prisma.participant_teamrequest.deleteMany({
    where: {
      receiver_id: userId,
      status: "pending",
      participant_team: { hackathon_id: team.hackathon_id },
    },
  });

  // If team reached max capacity, delete all remaining pending invites
  const newMemberCount = await prisma.participant_teammember.count({
    where: { team_id: team.id },
  });
  if (newMemberCount >= team.organizer_hackathon.max_team_size) {
    await prisma.participant_teamrequest.deleteMany({
      where: { team_id: team.id, status: "pending" },
    });
  }

  revalidatePath("/participant/dashboard");
  return { success: true, detail: "Successfully joined team." };
}

// ─── Rename Team ────────────────────────────────────────────────────

export async function renameTeam(teamId: number, newName: string) {
  const { team } = await requireTeamLeader(teamId);

  if (team.is_registered) {
    throw new Error("Cannot rename a fully registered team.");
  }

  const trimmed = newName.trim();
  if (!trimmed) throw new Error("Team name is required");

  await prisma.participant_team.update({
    where: { id: teamId },
    data: { name: trimmed, updated_at: new Date() },
  });

  revalidatePath("/participant/dashboard");
  return { success: true };
}

// ─── Get Team Seating ───────────────────────────────────────────────

export async function getTeamSeating(hackathonId: number) {
  const { userId, email } = await requireParticipant();

  // Find user's team for this hackathon
  const team = await prisma.participant_team.findFirst({
    where: {
      hackathon_id: hackathonId,
      OR: [
        { leader_id: userId },
        { participant_teammember: { some: { email } } },
      ],
      is_registered: true,
    },
  });
  if (!team) return null;

  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: hackathonId },
    select: { seating_allocation: true },
  });

  if (!hackathon?.seating_allocation) return null;

  try {
    const allocation =
      typeof hackathon.seating_allocation === "string"
        ? JSON.parse(hackathon.seating_allocation)
        : hackathon.seating_allocation;

    if (!allocation || typeof allocation !== "object") return null;

    // Find this team's entry in the allocation
    const teams = allocation.teams || [];
    for (const entry of teams) {
      if (
        entry.name &&
        entry.name.trim().toLowerCase() === team.name.trim().toLowerCase()
      ) {
        return entry;
      }
    }
  } catch {
    return null;
  }

  return null;
}

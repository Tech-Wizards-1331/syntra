"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { sendTeamInviteEmail } from "@/lib/services/email";

// ─── Helpers ────────────────────────────────────────────────────────

async function requireParticipant() {
  const session = await auth();
  if (!session?.user || session.user.role !== "participant") {
    throw new Error("Unauthorized: participant role required");
  }
  return { userId: Number(session.user.id), email: session.user.email!, session };
}

// ─── Search Participants for Invite ─────────────────────────────────
// Matches Django's ParticipantDiscoveryAPIView — searches visible participants
// by skill, excluding leaders/members/pending invites for the given hackathon.

export async function searchParticipantsForInvite(
  hackathonId: number,
  skillQuery: string
) {
  const { userId } = await requireParticipant();

  // Verify user is a team leader for this hackathon
  const team = await prisma.participant_team.findFirst({
    where: { hackathon_id: hackathonId, leader_id: userId },
  });
  if (!team) {
    throw new Error("Only team leaders can search participants for this hackathon.");
  }

  // Get IDs to exclude: leaders, members, pending invites
  const leaderIds = await prisma.participant_team.findMany({
    where: { hackathon_id: hackathonId },
    select: { leader_id: true },
  });
  const memberEmails = await prisma.participant_teammember.findMany({
    where: { participant_team: { hackathon_id: hackathonId } },
    select: { email: true },
  });
  const pendingInviteUserIds = await prisma.participant_teamrequest.findMany({
    where: { team_id: team.id, status: "pending" },
    select: { receiver_id: true },
  });

  const excludeUserIds = new Set([
    userId,
    ...leaderIds.map((l) => l.leader_id),
    ...pendingInviteUserIds.map((p) => p.receiver_id),
  ]);
  const excludeEmails = new Set(memberEmails.map((m) => m.email));

  // Find visible participant profiles, optionally filtered by skill
  const whereClause: any = {
    visibility: true,
    user_id: { notIn: Array.from(excludeUserIds) },
    accounts_user: {
      email: { notIn: Array.from(excludeEmails) },
      role: "participant",
    },
  };

  // If skill query provided, filter by skill name
  if (skillQuery.trim()) {
    whereClause.participant_participantprofile_skills = {
      some: {
        participant_skill: {
          name: { contains: skillQuery.trim() },
        },
      },
    };
  }

  const profiles = await prisma.participant_participantprofile.findMany({
    where: whereClause,
    include: {
      accounts_user: { select: { id: true, email: true, full_name: true } },
      participant_participantprofile_skills: {
        include: { participant_skill: true },
      },
    },
    take: 15,
  });

  return profiles.map((p) => ({
    userId: p.accounts_user.id,
    name: p.accounts_user.full_name || p.accounts_user.email,
    email: p.accounts_user.email,
    college: p.college,
    degree: p.degree,
    semester: p.semester,
    skills: p.participant_participantprofile_skills.map(
      (s) => s.participant_skill.name
    ),
  }));
}

// ─── Send Team Invite ───────────────────────────────────────────────
// Matches Django's TeamRequestViewSet.perform_create

export async function sendTeamInvite(teamId: number, receiverUserId: number) {
  const { userId } = await requireParticipant();

  const team = await prisma.participant_team.findUnique({
    where: { id: teamId },
    include: { organizer_hackathon: true },
  });
  if (!team) throw new Error("Team not found.");
  if (team.leader_id !== userId) {
    throw new Error("Only the team leader can send invites.");
  }

  // Check team capacity (pending invites do NOT reserve seats — Django parity)
  const leaderUser = await prisma.accounts_user.findUnique({
    where: { id: team.leader_id },
    select: { email: true, full_name: true },
  });
  if (!leaderUser) throw new Error("Leader user not found.");

  const members = await prisma.participant_teammember.findMany({
    where: { team_id: teamId },
    select: { email: true },
  });

  const leaderInMembers = members.some(
    (m) => m.email.toLowerCase() === leaderUser.email.toLowerCase()
  );

  const currentSlots = leaderInMembers ? members.length : 1 + members.length;
  if (currentSlots >= team.organizer_hackathon.max_team_size) {
    throw new Error("Your team is already full.");
  }

  // Check receiver exists and is a visible participant
  const receiver = await prisma.accounts_user.findUnique({
    where: { id: receiverUserId },
    include: { participant_participantprofile: true },
  });
  if (!receiver || receiver.role !== "participant") {
    throw new Error("User not found.");
  }
  if (!receiver.participant_participantprofile?.visibility) {
    throw new Error("This user is not currently accepting team requests.");
  }

  // Check receiver is not already in a team for this hackathon
  const isInTeam =
    (await prisma.participant_team.count({
      where: { leader_id: receiverUserId, hackathon_id: team.hackathon_id },
    })) > 0 ||
    (await prisma.participant_teammember.count({
      where: {
        email: receiver.email,
        participant_team: { hackathon_id: team.hackathon_id },
      },
    })) > 0;
  if (isInTeam) {
    throw new Error("This user is already in a team for this hackathon.");
  }

  // Check for duplicate invite
  const existing = await prisma.participant_teamrequest.findFirst({
    where: { team_id: teamId, receiver_id: receiverUserId, status: "pending" },
  });
  if (existing) {
    throw new Error("An invite is already pending for this user.");
  }

  await prisma.participant_teamrequest.create({
    data: {
      team_id: teamId,
      receiver_id: receiverUserId,
      status: "pending",
      created_at: new Date(),
    },
  });

  // Send SMTP email notification
  await sendTeamInviteEmail({
    receiverEmail: receiver.email,
    receiverName: receiver.full_name || receiver.email,
    teamName: team.name,
    leaderName: leaderUser.full_name || leaderUser.email,
    hackathonName: team.organizer_hackathon.name,
  });

  revalidatePath("/participant/dashboard");
  return { success: true };
}

// ─── Cancel Team Invite ─────────────────────────────────────────────
// Matches Django's TeamRequestViewSet.destroy

export async function cancelTeamInvite(requestId: number) {
  const { userId } = await requireParticipant();

  const request = await prisma.participant_teamrequest.findUnique({
    where: { id: requestId },
    include: { participant_team: true },
  });
  if (!request) throw new Error("Invite not found.");
  if (request.participant_team.leader_id !== userId) {
    throw new Error("Only the team leader can cancel invites.");
  }
  if (request.status !== "pending") {
    throw new Error("Only pending invites can be canceled.");
  }

  await prisma.participant_teamrequest.delete({ where: { id: requestId } });

  revalidatePath("/participant/dashboard");
  return { success: true };
}

// ─── Get Pending Sent Invites ───────────────────────────────────────
// Matches Django's pending_sent_invites context variable

export async function getPendingSentInvites(teamId: number) {
  const { userId } = await requireParticipant();

  const team = await prisma.participant_team.findUnique({
    where: { id: teamId },
  });
  if (!team || team.leader_id !== userId) {
    throw new Error("Access denied.");
  }

  const invites = await prisma.participant_teamrequest.findMany({
    where: { team_id: teamId, status: "pending" },
    include: {
      accounts_user: { select: { id: true, email: true, full_name: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return invites.map((inv) => ({
    id: inv.id,
    receiverName: inv.accounts_user.full_name || inv.accounts_user.email,
    receiverEmail: inv.accounts_user.email,
    createdAt: inv.created_at.toISOString(),
  }));
}

// ─── Get Incoming Invites ───────────────────────────────────────────
// Matches Django's fetchRequests() JS function on the dashboard

export async function getIncomingInvites() {
  const { userId } = await requireParticipant();

  // Get hackathons the user is already in (as leader or member)
  const userEmail = (
    await prisma.accounts_user.findUnique({
      where: { id: userId },
      select: { email: true },
    })
  )?.email;

  const joinedHackathonIds = new Set<number>();

  const leaderTeams = await prisma.participant_team.findMany({
    where: { leader_id: userId },
    select: { hackathon_id: true },
  });
  leaderTeams.forEach((t) => joinedHackathonIds.add(t.hackathon_id));

  if (userEmail) {
    const memberTeams = await prisma.participant_teammember.findMany({
      where: { email: userEmail },
      include: { participant_team: { select: { hackathon_id: true } } },
    });
    memberTeams.forEach((m) =>
      joinedHackathonIds.add(m.participant_team.hackathon_id)
    );
  }

  // Get pending invites for this user, excluding hackathons they've already joined
  const invites = await prisma.participant_teamrequest.findMany({
    where: {
      receiver_id: userId,
      status: "pending",
      participant_team: {
        hackathon_id: { notIn: Array.from(joinedHackathonIds) },
      },
    },
    include: {
      participant_team: {
        include: {
          organizer_hackathon: { select: { name: true } },
        },
      },
    },
    orderBy: { created_at: "desc" },
  });

  return invites.map((inv) => ({
    id: inv.id,
    teamName: inv.participant_team.name,
    hackathonName: inv.participant_team.organizer_hackathon?.name || "Hackathon",
    createdAt: inv.created_at.toISOString(),
  }));
}

// ─── Accept Team Invite ─────────────────────────────────────────────
// Matches Django's TeamRequestViewSet.accept — atomically adds user to team

export async function acceptTeamInvite(requestId: number) {
  const { userId, email } = await requireParticipant();

  const request = await prisma.participant_teamrequest.findUnique({
    where: { id: requestId },
    include: {
      participant_team: {
        include: { organizer_hackathon: true },
      },
    },
  });
  if (!request) throw new Error("Invite not found.");
  if (request.receiver_id !== userId) {
    throw new Error("You can only accept invites sent to you.");
  }
  if (request.status !== "pending") {
    throw new Error("This invite has already been processed.");
  }

  const team = request.participant_team;
  const hackathonId = team.hackathon_id;

  // Check user is not already in a different team for this hackathon
  const existingTeam = await prisma.participant_team.findFirst({
    where: {
      hackathon_id: hackathonId,
      OR: [
        { leader_id: userId },
        { participant_teammember: { some: { email } } },
      ],
      id: { not: team.id },
    },
  });
  if (existingTeam) {
    throw new Error("You are already in a different team for this hackathon.");
  }

  // Check team capacity
  const leaderUser = await prisma.accounts_user.findUnique({
    where: { id: team.leader_id },
    select: { email: true },
  });
  if (!leaderUser) throw new Error("Leader user not found.");

  const members = await prisma.participant_teammember.findMany({
    where: { team_id: team.id },
    select: { email: true },
  });

  const leaderInMembers = members.some(
    (m) => m.email.toLowerCase() === leaderUser.email.toLowerCase()
  );

  const currentSlots = leaderInMembers ? members.length : 1 + members.length;
  if (currentSlots >= team.organizer_hackathon.max_team_size) {
    throw new Error("This team is already full.");
  }

  // Get user's profile for member details
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

  // Accept this invite
  await prisma.participant_teamrequest.update({
    where: { id: requestId },
    data: { status: "accepted" },
  });

  // Add user as team member (matches Django's add_member_to_team)
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

  // Auto-delete all other pending invites for this user for the same hackathon
  await prisma.participant_teamrequest.deleteMany({
    where: {
      receiver_id: userId,
      status: "pending",
      participant_team: { hackathon_id: hackathonId },
      id: { not: requestId },
    },
  });

  // If team is now at max capacity, delete all remaining pending invites
  const currentMembersCount = await prisma.participant_teammember.count({
    where: { team_id: team.id },
  });
  const leaderExistsInDb = await prisma.participant_teammember.count({
    where: { team_id: team.id, email: leaderUser.email },
  }) > 0;
  const finalSlots = leaderExistsInDb ? currentMembersCount : 1 + currentMembersCount;
  if (finalSlots >= team.organizer_hackathon.max_team_size) {
    await prisma.participant_teamrequest.deleteMany({
      where: { team_id: team.id, status: "pending" },
    });
  }

  // Auto-disable recruiting visibility (Django parity: members with a team aren't recruitable)
  // Conditional write — only update if currently visible to avoid redundant DB writes
  if (profile?.visibility) {
    await prisma.participant_participantprofile.update({
      where: { user_id: userId },
      data: { visibility: false, updated_at: new Date() },
    });
  }

  revalidatePath("/participant/dashboard");
  return { success: true };
}

// ─── Decline Team Invite ────────────────────────────────────────────
// Matches Django's TeamRequestViewSet.decline

export async function declineTeamInvite(requestId: number) {
  const { userId } = await requireParticipant();

  const request = await prisma.participant_teamrequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error("Invite not found.");
  if (request.receiver_id !== userId) {
    throw new Error("You can only decline invites sent to you.");
  }
  if (request.status !== "pending") {
    throw new Error("This invite has already been processed.");
  }

  await prisma.participant_teamrequest.update({
    where: { id: requestId },
    data: { status: "declined" },
  });

  revalidatePath("/participant/dashboard");
  return { success: true };
}

// ─── Toggle Recruiting Visibility ───────────────────────────────────
// Matches Django's ParticipantProfileUpdateAPIView for visibility toggle

export async function toggleRecruitingVisibility(visible: boolean) {
  const { userId } = await requireParticipant();

  // Team leaders cannot make themselves visible (Django parity)
  if (visible) {
    const isLeader = await prisma.participant_team.findFirst({
      where: { leader_id: userId },
    });
    if (isLeader) {
      throw new Error("Team leaders cannot enable recruiting visibility.");
    }
  }

  await prisma.participant_participantprofile.update({
    where: { user_id: userId },
    data: {
      visibility: visible,
      updated_at: new Date(),
    },
  });

  // If turned off, remove pending invites (Django parity)
  if (!visible) {
    await prisma.participant_teamrequest.deleteMany({
      where: { receiver_id: userId, status: "pending" },
    });
  }

  revalidatePath("/participant/dashboard");
  return { success: true };
}

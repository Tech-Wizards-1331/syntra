"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/django-password";
import { sendBulkRegistrationWelcomeEmail } from "@/lib/services/email";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

// ─── Interfaces ──────────────────────────────────────────────────────

export interface BulkMemberInput {
  name: string;
  email: string;
  college?: string;
  semester?: number | null;
  degree?: string;
}

export interface BulkTeamInput {
  teamName: string;
  leaderName: string;
  leaderEmail: string;
  college?: string;
  semester?: number | null;
  degree?: string;
  members: BulkMemberInput[];
}

export interface BulkImportResult {
  success: boolean;
  totalTeams: number;
  importedCount: number;
  skippedCount: number;
  errors: string[];
  importedTeams: {
    teamName: string;
    leaderEmail: string;
    membersCount: number;
  }[];
}

// ─── Helper: Validate Organizer Access ───────────────────────────────

async function validateHackathonOwner(hackathonId: number) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "organizer") {
    throw new Error("Unauthorized: Organizer role required");
  }

  const userId = Number(session.user.id);
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

  return { hackathon, userId };
}

// ─── Bulk Import Action ──────────────────────────────────────────────

export async function bulkImportTeams(
  hackathonId: number,
  teams: BulkTeamInput[],
  defaultPassword: string = "Syntra@2026"
): Promise<BulkImportResult> {
  const { hackathon } = await validateHackathonOwner(hackathonId);

  if (!teams || teams.length === 0) {
    return {
      success: false,
      totalTeams: 0,
      importedCount: 0,
      skippedCount: 0,
      errors: ["No team data provided for import."],
      importedTeams: [],
    };
  }

  const cleanDefaultPassword = defaultPassword.trim() || "Syntra@2026";
  const errors: string[] = [];
  const importedTeams: { teamName: string; leaderEmail: string; membersCount: number }[] = [];
  const now = new Date();

  // Fetch existing teams for this hackathon to prevent duplicates
  const existingTeams = await prisma.participant_team.findMany({
    where: { hackathon_id: hackathonId },
    select: { name: true, leader_id: true },
  });
  const existingTeamNames = new Set(existingTeams.map((t) => t.name.trim().toLowerCase()));

  // Fetch existing members in this hackathon
  const existingMembers = await prisma.participant_teammember.findMany({
    where: {
      participant_team: { hackathon_id: hackathonId },
    },
    select: { email: true },
  });
  const registeredEmailsInHackathon = new Set(existingMembers.map((m) => m.email.trim().toLowerCase()));

  for (let index = 0; index < teams.length; index++) {
    const rawTeam = teams[index];
    const teamNum = index + 1;
    const teamName = (rawTeam.teamName || "").trim();
    const leaderName = (rawTeam.leaderName || "").trim();
    const leaderEmail = (rawTeam.leaderEmail || "").trim().toLowerCase();
    const college = (rawTeam.college || "Unknown College").trim();
    const semester = typeof rawTeam.semester === "number" ? rawTeam.semester : 1;
    const degree = (rawTeam.degree || "B.Tech").trim();

    // 1. Basic Validation
    if (!teamName) {
      errors.push(`Row ${teamNum}: Missing team name.`);
      continue;
    }
    if (!leaderName) {
      errors.push(`Row ${teamNum} (${teamName}): Missing team leader name.`);
      continue;
    }
    if (!leaderEmail || !leaderEmail.includes("@")) {
      errors.push(`Row ${teamNum} (${teamName}): Invalid leader email address (${leaderEmail}).`);
      continue;
    }

    // 2. Duplicate team names are allowed per organizer preference

    // 3. Check if leader email is already registered in this hackathon
    if (registeredEmailsInHackathon.has(leaderEmail)) {
      errors.push(`Row ${teamNum} (${teamName}): Leader email "${leaderEmail}" is already participating in this hackathon.`);
      continue;
    }

    // 4. Validate additional members
    const validMembers: BulkMemberInput[] = [];
    let memberError = false;

    for (let mIdx = 0; mIdx < (rawTeam.members || []).length; mIdx++) {
      const m = rawTeam.members[mIdx];
      const mName = (m.name || "").trim();
      const rawMEmail = (m.email || "").trim().toLowerCase();
      if (!mName && !rawMEmail) continue; // skip empty member slot

      if (!mName) {
        errors.push(`Row ${teamNum} (${teamName}): Member slot ${mIdx + 2} has missing name.`);
        memberError = true;
        break;
      }

      let memberEmail = "";
      if (rawMEmail && rawMEmail.includes("@")) {
        if (rawMEmail === leaderEmail) {
          errors.push(`Row ${teamNum} (${teamName}): Member email "${rawMEmail}" is the same as leader email.`);
          memberError = true;
          break;
        }

        if (registeredEmailsInHackathon.has(rawMEmail)) {
          errors.push(`Row ${teamNum} (${teamName}): Member email "${rawMEmail}" is already participating in this hackathon.`);
          memberError = true;
          break;
        }
        memberEmail = rawMEmail;
      } else {
        // No email provided: satisfy DB NOT NULL & UNIQUE([team_id, email]) using enrollment or fallback identifier
        memberEmail = rawMEmail || `mem_${mIdx + 2}_${Date.now() % 100000}_${Math.floor(Math.random() * 1000)}`;
      }

      validMembers.push({
        name: mName,
        email: memberEmail,
        college: (m.college || college).trim(),
        semester: typeof m.semester === "number" ? m.semester : semester,
        degree: (m.degree || degree).trim(),
      });
    }

    if (memberError) continue;

    const totalTeamSize = 1 + validMembers.length;
    if (hackathon.min_team_size && totalTeamSize < hackathon.min_team_size) {
      errors.push(`Row ${teamNum} (${teamName}): Team size (${totalTeamSize}) is less than minimum allowed (${hackathon.min_team_size}).`);
      continue;
    }
    if (hackathon.max_team_size && totalTeamSize > hackathon.max_team_size) {
      errors.push(`Row ${teamNum} (${teamName}): Team size (${totalTeamSize}) exceeds maximum allowed (${hackathon.max_team_size}).`);
      continue;
    }

    try {
      // 5. Check or Create User for Leader
      let leaderUser = await prisma.accounts_user.findUnique({
        where: { email: leaderEmail },
      });

      let isNewUser = false;
      if (!leaderUser) {
        isNewUser = true;
        const hashedPassword = hashPassword(cleanDefaultPassword);
        const nameParts = leaderName.split(/\s+/);
        const firstName = nameParts[0] || leaderName;
        const lastName = nameParts.slice(1).join(" ") || "";

        leaderUser = await prisma.accounts_user.create({
          data: {
            email: leaderEmail,
            password: hashedPassword,
            first_name: firstName,
            last_name: lastName,
            full_name: leaderName,
            is_superuser: false,
            is_staff: false,
            is_active: true,
            date_joined: now,
            created_at: now,
            updated_at: now,
            is_profile_complete: true,
            role: "participant",
          },
        });

        // Create participant profile
        await prisma.participant_participantprofile.create({
          data: {
            user_id: leaderUser.id,
            college,
            semester: semester || 1,
            degree,
            visibility: true,
            created_at: now,
            updated_at: now,
          },
        });
      } else {
        // Ensure user has participant profile
        const existingProfile = await prisma.participant_participantprofile.findUnique({
          where: { user_id: leaderUser.id },
        });
        if (!existingProfile) {
          await prisma.participant_participantprofile.create({
            data: {
              user_id: leaderUser.id,
              college,
              semester: semester || 1,
              degree,
              visibility: true,
              created_at: now,
              updated_at: now,
            },
          });
        }
      }

      // 6. Create participant_team
      const team = await prisma.participant_team.create({
        data: {
          name: teamName,
          hackathon_id: hackathonId,
          leader_id: leaderUser.id,
          is_registered: true,
          is_qr_active: true,
          qr_token: randomUUID(),
          invite_token: randomUUID(),
          food_tokens_total: 0,
          food_tokens_used: 0,
          created_at: now,
          updated_at: now,
        },
      });

      // 7. Add Leader to participant_teammember
      await prisma.participant_teammember.create({
        data: {
          name: leaderName,
          email: leaderEmail,
          college,
          semester: semester || 1,
          degree,
          team_id: team.id,
          created_at: now,
        },
      });

      // 8. Add other members to participant_teammember
      for (const member of validMembers) {
        await prisma.participant_teammember.create({
          data: {
            name: member.name,
            email: member.email,
            college: member.college || college,
            semester: member.semester || 1,
            degree: member.degree || degree,
            team_id: team.id,
            created_at: now,
          },
        });
        registeredEmailsInHackathon.add(member.email);
      }

      // Track registered records
      existingTeamNames.add(teamName.toLowerCase());
      registeredEmailsInHackathon.add(leaderEmail);

      importedTeams.push({
        teamName,
        leaderEmail,
        membersCount: totalTeamSize,
      });

      // 9. Send welcome & credentials email (non-blocking)
      sendBulkRegistrationWelcomeEmail({
        receiverEmail: leaderEmail,
        receiverName: leaderName,
        teamName,
        hackathonName: hackathon.name,
        temporaryPassword: cleanDefaultPassword,
        isNewAccount: isNewUser,
      }).catch((emailErr) => {
        console.error(`Failed to send welcome email to ${leaderEmail}:`, emailErr);
      });
    } catch (teamErr: any) {
      console.error(`Error importing team ${teamName}:`, teamErr);
      errors.push(`Row ${teamNum} (${teamName}): Failed to create team in database (${teamErr.message || "DB error"}).`);
    }
  }

  revalidatePath(`/organizer/dashboard/hackathons/${hackathonId}`);

  return {
    success: importedTeams.length > 0,
    totalTeams: teams.length,
    importedCount: importedTeams.length,
    skippedCount: teams.length - importedTeams.length,
    errors,
    importedTeams,
  };
}

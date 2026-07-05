"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Helpers ────────────────────────────────────────────────────────

async function requireParticipant() {
  const session = await auth();
  if (!session?.user || session.user.role !== "participant") {
    throw new Error("Unauthorized: participant role required");
  }
  return { userId: Number(session.user.id), email: session.user.email!, session };
}

// ─── Get Problem Statements ────────────────────────────────────────
// Mirrors Django's ParticipantProblemStatementViewSet.list
// Returns active problem statements for a hackathon with capacity annotations.

export async function getProblemStatements(hackathonId: number) {
  await requireParticipant();

  if (!hackathonId) {
    throw new Error("hackathon_id is required");
  }

  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: hackathonId },
    select: { release_problems: true },
  });
  if (!hackathon?.release_problems) {
    return [];
  }

  const problemStatements = await prisma.organizer_problemstatement.findMany({
    where: {
      hackathon_id: hackathonId,
      is_active: true,
    },
    include: {
      participant_team: {
        where: { selected_problem_statement_id: { not: null } },
        select: { id: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  // Compute current_teams_count and is_full for each PS
  // This mirrors Django's annotate(current_teams_count=Count('selected_by_teams'))
  const result = await Promise.all(
    problemStatements.map(async (ps) => {
      const currentTeamsCount = await prisma.participant_team.count({
        where: { selected_problem_statement_id: ps.id },
      });

      return {
        id: ps.id,
        title: ps.title,
        description: ps.description,
        pdf_file: ps.pdf_file,
        max_teams_allowed: ps.max_teams_allowed,
        current_teams_count: currentTeamsCount,
        is_full: currentTeamsCount >= ps.max_teams_allowed,
      };
    })
  );

  return result;
}

// ─── Select Problem Statement ──────────────────────────────────────
// Mirrors Django's TeamViewSet.select_problem_statement
// Concurrency-safe problem statement selection.
// Once a team selects, it is locked in permanently (cannot be changed).
// Uses a serializable $transaction for SQLite compatibility (no row-level locks).

export async function selectProblemStatement(
  teamId: number,
  problemStatementId: number
) {
  const { userId } = await requireParticipant();

  const maxRetries = 5;
  let delay = 100; // start with 100ms delay

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Verify team ownership
        const team = await tx.participant_team.findUnique({
          where: { id: teamId },
        });
        if (!team) throw new Error("Team not found");
        if (team.leader_id !== userId) {
          throw new Error("Only the team leader can select a problem statement.");
        }

        // Selection is permanent (Django D-01)
        if (team.selected_problem_statement_id !== null) {
          throw new Error(
            "Problem statement is already locked in and cannot be changed."
          );
        }

        // Check if problem statements are released for the hackathon
        const hackathon = await tx.organizer_hackathon.findUnique({
          where: { id: team.hackathon_id },
          select: { release_problems: true },
        });
        if (!hackathon?.release_problems) {
          throw new Error("Problem statements are not released yet for this hackathon.");
        }

        // Verify the PS exists, belongs to this hackathon, and is active
        const ps = await tx.organizer_problemstatement.findFirst({
          where: {
            id: problemStatementId,
            hackathon_id: team.hackathon_id,
            is_active: true,
          },
        });
        if (!ps) {
          throw new Error("Problem statement not found or inactive.");
        }

        // Check capacity (Django D-02 + D-03)
        const currentCount = await tx.participant_team.count({
          where: { selected_problem_statement_id: problemStatementId },
        });
        if (currentCount >= ps.max_teams_allowed) {
          throw new Error(
            "This problem statement has reached its capacity limit."
          );
        }

        // Lock in the selection
        return await tx.participant_team.update({
          where: { id: teamId },
          data: { selected_problem_statement_id: problemStatementId },
        });
      }, {
        isolationLevel: "Serializable"
      });

      revalidatePath(`/participant/hackathons/${result.hackathon_id}/hub`);
      revalidatePath("/participant/dashboard");
      return { success: true, detail: "Problem statement selected successfully." };

    } catch (error: any) {
      const isSerializationFailure =
        error.code === "P2034" ||
        error.message?.includes("serialization") ||
        error.message?.includes("deadlock");

      if (isSerializationFailure && attempt < maxRetries) {
        // Wait with a small random jitter before retrying
        await new Promise((resolve) => setTimeout(resolve, delay + Math.random() * 100));
        delay *= 1.5; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to select problem statement due to high concurrent traffic. Please try again.");
}


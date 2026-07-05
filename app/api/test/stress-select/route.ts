import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { teamId, problemStatementId, userId, useSafeTransaction } = await request.json();

    if (!teamId || !problemStatementId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (useSafeTransaction) {
      // --- Concurrency Safe Implementation using Serializable Transaction + Retry Loop ---
      const maxRetries = 5;
      let delay = 100;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const result = await prisma.$transaction(async (tx) => {
            const team = await tx.participant_team.findUnique({
              where: { id: Number(teamId) },
            });

            if (!team) throw new Error("Team not found");
            if (team.leader_id !== Number(userId)) {
              throw new Error("Only the team leader can select.");
            }
            if (team.selected_problem_statement_id !== null) {
              throw new Error("Already selected.");
            }

            const hackathon = await tx.organizer_hackathon.findUnique({
              where: { id: team.hackathon_id },
              select: { release_problems: true },
            });
            if (!hackathon?.release_problems) {
              throw new Error("Problems not released.");
            }

            const ps = await tx.organizer_problemstatement.findFirst({
              where: {
                id: Number(problemStatementId),
                hackathon_id: team.hackathon_id,
                is_active: true,
              },
            });
            if (!ps) throw new Error("PS not found.");

            // Count how many teams have currently selected this PS
            const currentCount = await tx.participant_team.count({
              where: { selected_problem_statement_id: Number(problemStatementId) },
            });

            if (currentCount >= ps.max_teams_allowed) {
              throw new Error("Capacity limit reached");
            }

            await tx.participant_team.update({
              where: { id: Number(teamId) },
              data: { selected_problem_statement_id: Number(problemStatementId) },
            });

            return { success: true };
          }, {
            // IsolationLevel is critical to prevent phantom reads / serialization anomalies
            isolationLevel: "Serializable"
          });

          return NextResponse.json(result);
        } catch (error: any) {
          const isSerializationFailure =
            error.code === "P2034" ||
            error.message?.includes("serialization") ||
            error.message?.includes("deadlock");

          if (isSerializationFailure && attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, delay + Math.random() * 100));
            delay *= 1.5; // Exponential backoff
            continue;
          }
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
      }
      return NextResponse.json({ error: "Failed due to high concurrent traffic. Please try again." }, { status: 500 });
    } else {
      // --- Exact original (Unsafe) Implementation ---
      const team = await prisma.participant_team.findUnique({
        where: { id: Number(teamId) },
      });

      if (!team) return NextResponse.json({ error: "Team not found" }, { status: 400 });
      if (team.leader_id !== Number(userId)) {
        return NextResponse.json({ error: "Only the team leader can select." }, { status: 400 });
      }
      if (team.selected_problem_statement_id !== null) {
        return NextResponse.json({ error: "Already selected." }, { status: 400 });
      }

      const hackathon = await prisma.organizer_hackathon.findUnique({
        where: { id: team.hackathon_id },
        select: { release_problems: true },
      });
      if (!hackathon?.release_problems) {
        return NextResponse.json({ error: "Problems not released." }, { status: 400 });
      }

      const ps = await prisma.organizer_problemstatement.findFirst({
        where: {
          id: Number(problemStatementId),
          hackathon_id: team.hackathon_id,
          is_active: true,
        },
      });
      if (!ps) return NextResponse.json({ error: "PS not found." }, { status: 400 });

      // Count check
      const currentCount = await prisma.participant_team.count({
        where: { selected_problem_statement_id: Number(problemStatementId) },
      });

      if (currentCount >= ps.max_teams_allowed) {
        return NextResponse.json({ error: "Capacity limit reached" }, { status: 400 });
      }

      // Update selection
      await prisma.participant_team.update({
        where: { id: Number(teamId) },
        data: { selected_problem_statement_id: Number(problemStatementId) },
      });

      return NextResponse.json({ success: true });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

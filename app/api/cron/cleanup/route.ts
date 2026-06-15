import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const expiredDrafts = await prisma.participant_team.findMany({
      where: {
        is_registered: false,
        organizer_hackathon: {
          OR: [
            { status: { notIn: ["registration", "registration_open", "published"] } },
            { registration_deadline: { lt: new Date() } },
          ],
        },
      },
      select: { id: true },
    });

    if (expiredDrafts.length > 0) {
      const expiredDraftIds = expiredDrafts.map((d) => d.id);

      // Cascadingly delete team member skills
      const members = await prisma.participant_teammember.findMany({
        where: { team_id: { in: expiredDraftIds } },
      });
      const memberIds = members.map((m) => m.id);

      await prisma.$transaction([
        prisma.participant_teammember_skills.deleteMany({
          where: { teammember_id: { in: memberIds } },
        }),
        prisma.organizer_scanrecord.deleteMany({
          where: { team_member_id: { in: memberIds } },
        }),
        prisma.participant_teammember.deleteMany({
          where: { team_id: { in: expiredDraftIds } },
        }),
        prisma.participant_teamrequest.deleteMany({
          where: { team_id: { in: expiredDraftIds } },
        }),
        prisma.participant_payment.deleteMany({
          where: { team_id: { in: expiredDraftIds } },
        }),
        prisma.participant_team.deleteMany({
          where: { id: { in: expiredDraftIds } },
        }),
      ]);

      return NextResponse.json({
        success: true,
        deletedTeamsCount: expiredDraftIds.length,
      });
    }

    return NextResponse.json({
      success: true,
      deletedTeamsCount: 0,
    });
  } catch (error: any) {
    console.error("Cron expired draft cleanup failed:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

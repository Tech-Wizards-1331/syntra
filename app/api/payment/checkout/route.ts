import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createRazorpayOrder } from "@/lib/services/razorpay";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { teamId } = body;

    if (!teamId) {
      return NextResponse.json({ error: "Missing teamId" }, { status: 400 });
    }

    const teamIdNum = Number(teamId);
    if (isNaN(teamIdNum)) {
      return NextResponse.json({ error: "Invalid teamId" }, { status: 400 });
    }

    // Find the team
    const team = await prisma.participant_team.findUnique({
      where: { id: teamIdNum },
      include: {
        organizer_hackathon: true,
      },
    });

    if (!team) {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }

    const userIdNum = Number(session.user.id);
    const isLeader = team.leader_id === userIdNum;

    // Check if the current user is a team member
    const isMember = await prisma.participant_teammember.findFirst({
      where: {
        team_id: teamIdNum,
        email: session.user.email || "",
      },
    });

    if (!isLeader && !isMember) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this team" }, { status: 403 });
    }

    if (team.is_registered) {
      return NextResponse.json({ error: "Team is already registered" }, { status: 400 });
    }

    const hackathon = team.organizer_hackathon;
    if (!hackathon) {
      return NextResponse.json({ error: "Associated hackathon not found" }, { status: 404 });
    }

    if (!hackathon.is_paid) {
      return NextResponse.json({ error: "This hackathon does not require payment" }, { status: 400 });
    }

    // Verify team size and complete member details
    const members = await prisma.participant_teammember.findMany({
      where: { team_id: teamIdNum },
    });

    const leaderUser = await prisma.accounts_user.findUnique({
      where: { id: team.leader_id },
      select: { email: true },
    });
    if (!leaderUser) {
      return NextResponse.json({ error: "Leader user not found" }, { status: 404 });
    }

    const leaderInMembers = members.some(
      (m) => m.email.toLowerCase() === leaderUser.email.toLowerCase()
    );

    const currentSlots = leaderInMembers ? members.length : 1 + members.length;
    if (currentSlots < hackathon.min_team_size) {
      return NextResponse.json(
        { error: `Validation Failed: Team size must be at least ${hackathon.min_team_size} members.` },
        { status: 400 }
      );
    }
    if (currentSlots > hackathon.max_team_size) {
      return NextResponse.json(
        { error: `Validation Failed: Team size cannot exceed ${hackathon.max_team_size} members.` },
        { status: 400 }
      );
    }

    for (const member of members) {
      if (
        !member.name?.trim() ||
        !member.email?.trim() ||
        !member.college?.trim() ||
        !member.degree?.trim() ||
        member.semester === null ||
        member.semester === undefined
      ) {
        return NextResponse.json(
          { error: `Validation Failed: Team member details are incomplete for '${member.name || "Unnamed"}'.` },
          { status: 400 }
        );
      }
    }

    const baseFee = hackathon.fee_amount ? Number(hackathon.fee_amount) : 0;
    if (baseFee <= 0) {
      return NextResponse.json({ error: "Invalid fee amount" }, { status: 400 });
    }

    let finalFeeAmount = baseFee;
    if (hackathon.fee_type === "participant") {
      finalFeeAmount = baseFee * memberCount;
    }

    const receipt = `team_${team.id}_user_${userIdNum}`;
    const order = await createRazorpayOrder(finalFeeAmount, receipt);

    // Create a pending payment log in the database
    const payment = await prisma.participant_payment.create({
      data: {
        razorpay_order_id: order.id,
        amount: finalFeeAmount,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
        team_id: team.id,
        user_id: userIdNum,
      },
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      payment_id: payment.id,
    });
  } catch (error: any) {
    console.error("Payment checkout error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

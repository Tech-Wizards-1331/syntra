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

    const feeAmount = hackathon.fee_amount ? Number(hackathon.fee_amount) : 0;
    if (feeAmount <= 0) {
      return NextResponse.json({ error: "Invalid fee amount" }, { status: 400 });
    }

    const receipt = `team_${team.id}_user_${userIdNum}`;
    const order = await createRazorpayOrder(feeAmount, receipt);

    // Create a pending payment log in the database
    const payment = await prisma.participant_payment.create({
      data: {
        razorpay_order_id: order.id,
        amount: feeAmount,
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

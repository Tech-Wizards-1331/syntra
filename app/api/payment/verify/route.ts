import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/services/razorpay";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { paymentId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    if (!paymentId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify signature
    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const paymentIdNum = Number(paymentId);
    if (isNaN(paymentIdNum)) {
      return NextResponse.json({ error: "Invalid paymentId" }, { status: 400 });
    }

    // Find the payment record
    const payment = await prisma.participant_payment.findUnique({
      where: { id: paymentIdNum },
      include: {
        participant_team: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    if (payment.status === "paid") {
      return NextResponse.json({ success: true, message: "Payment already processed" });
    }

    // Update payment record
    await prisma.participant_payment.update({
      where: { id: paymentIdNum },
      data: {
        razorpay_payment_id,
        razorpay_signature,
        status: "paid",
        updated_at: new Date(),
      },
    });

    // Add leader to team members if not already present (Django parity)
    const leaderUser = await prisma.accounts_user.findUnique({
      where: { id: payment.participant_team.leader_id },
      select: { email: true, full_name: true },
    });
    if (leaderUser) {
      const existingMember = await prisma.participant_teammember.findFirst({
        where: {
          team_id: payment.team_id,
          email: leaderUser.email,
        },
      });
      if (!existingMember) {
        const leaderProfile = await prisma.participant_participantprofile.findUnique({
          where: { user_id: payment.participant_team.leader_id },
          select: {
            college: true,
            semester: true,
            degree: true,
            participant_participantprofile_skills: {
              select: { skill_id: true },
            },
          },
        });
        if (leaderProfile) {
          const member = await prisma.participant_teammember.create({
            data: {
              team_id: payment.team_id,
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
                teammember_id: member.id,
                skill_id: ps.skill_id,
              })),
            });
          }
        }
      }
    }

    // Update team registration with QR token
    await prisma.participant_team.update({
      where: { id: payment.team_id },
      data: {
        is_registered: true,
        qr_token: randomUUID(),
        is_qr_active: true,
        updated_at: new Date(),
      },
    });

    // Auto-reject all pending outgoing invites for this team — registration is
    // now finalised and no new members can be added.
    await prisma.participant_teamrequest.updateMany({
      where: { team_id: payment.team_id, status: "pending" },
      data: { status: "rejected" },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

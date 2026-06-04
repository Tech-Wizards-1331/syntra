import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifySignature } from "@/lib/services/razorpay";

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

    // Perform database transaction atomically
    await prisma.$transaction(async (tx) => {
      // Update payment record
      await tx.participant_payment.update({
        where: { id: paymentIdNum },
        data: {
          razorpay_payment_id,
          razorpay_signature,
          status: "paid",
          updated_at: new Date(),
        },
      });

      // Update team registration
      await tx.participant_team.update({
        where: { id: payment.team_id },
        data: {
          is_registered: true,
          updated_at: new Date(),
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

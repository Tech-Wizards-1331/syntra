import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/services/razorpay";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn("RAZORPAY_WEBHOOK_SECRET is not configured. Webhook signature check will be bypassed or fail.");
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
    }

    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error("Webhook signature verification failed");
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || payload.payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (!orderId) {
        console.error("Order ID not found in webhook payload");
        return NextResponse.json({ error: "Order ID not found" }, { status: 400 });
      }

      // Find the pending payment record
      const payment = await prisma.participant_payment.findFirst({
        where: {
          razorpay_order_id: orderId,
        },
      });

      if (!payment) {
        console.warn(`No matching payment record found for order ${orderId}`);
        return NextResponse.json({ message: "No matching payment record" }, { status: 200 });
      }

      if (payment.status === "paid") {
        return NextResponse.json({ message: "Payment already updated" }, { status: 200 });
      }

      // Perform database transaction atomically
      await prisma.$transaction(async (tx) => {
        // Update payment record
        await tx.participant_payment.update({
          where: { id: payment.id },
          data: {
            razorpay_payment_id: paymentId || payment.razorpay_payment_id,
            status: "paid",
            updated_at: new Date(),
          },
        });

        // Update team registration with QR token
        await tx.participant_team.update({
          where: { id: payment.team_id },
          data: {
            is_registered: true,
            qr_token: randomUUID(),
            is_qr_active: true,
            updated_at: new Date(),
          },
        });
      });

      console.log(`Payment successfully updated via webhook for order ${orderId}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

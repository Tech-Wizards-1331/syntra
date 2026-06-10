import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

/**
 * Payment Checkout Page — matches Django's PaymentCheckoutView.
 * 
 * Renders a dedicated, focused checkout UI centered on the page.
 */
export default async function PaymentCheckoutPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const session = await auth();
  if (!session?.user || session.user.role !== "participant") {
    redirect("/login");
  }

  const { paymentId } = await params;
  const paymentIdNum = Number(paymentId);
  if (isNaN(paymentIdNum)) {
    redirect("/participant/dashboard");
  }

  // Fetch payment with team and hackathon data
  const payment = await prisma.participant_payment.findUnique({
    where: { id: paymentIdNum },
    include: {
      participant_team: {
        include: {
          organizer_hackathon: {
            select: { name: true },
          },
        },
      },
    },
  });

  // Guard: payment must exist
  if (!payment) {
    redirect("/participant/dashboard");
  }

  // Guard: payment must belong to current user
  const userIdNum = Number(session.user.id);
  if (payment.user_id !== userIdNum) {
    redirect("/participant/dashboard");
  }

  // Guard: if already paid, redirect to dashboard
  if (payment.status !== "pending") {
    redirect("/participant/dashboard");
  }

  return (
    <main className="flex-1 flex items-center justify-center p-4 md:p-8 animate-fade-in-up">
      <div className="w-full max-w-md">
        <CheckoutClient
          paymentId={payment.id}
          orderId={payment.razorpay_order_id}
          amount={Number(payment.amount)}
          teamName={payment.participant_team.name}
          hackathonName={payment.participant_team.organizer_hackathon?.name || "Hackathon"}
          razorpayKeyId={process.env.RAZORPAY_KEY_ID || ""}
          userEmail={session.user.email || ""}
          userName={session.user.name || ""}
        />
      </div>
    </main>
  );
}

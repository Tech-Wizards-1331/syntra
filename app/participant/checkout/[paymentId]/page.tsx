import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CheckoutClient from "./CheckoutClient";

/**
 * Payment Checkout Page — matches Django's PaymentCheckoutView.
 * 
 * Django flow: complete_registration → redirect('payment-checkout', pk=payment.id)
 * Next.js flow: handleSubmitRegistration → router.push('/participant/checkout/[paymentId]')
 * 
 * This page renders a dedicated checkout UI with Razorpay payment button.
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

  // Guard: payment must belong to current user (matches Django's get_object_or_404(Payment, pk=pk, user=request.user))
  const userIdNum = Number(session.user.id);
  if (payment.user_id !== userIdNum) {
    redirect("/participant/dashboard");
  }

  // Guard: if already paid, redirect to dashboard (matches Django's status='pending' filter)
  if (payment.status !== "pending") {
    redirect("/participant/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-teal-500 selection:text-slate-900">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] rounded-full bg-emerald-600/5 blur-3xl" />
      </div>

      <main className="flex-1 relative z-10 p-4 md:p-8">
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
      </main>
    </div>
  );
}

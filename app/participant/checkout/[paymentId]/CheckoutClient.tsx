"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ShieldCheck, Loader2, AlertCircle, ArrowLeft, Users } from "lucide-react";

interface CheckoutClientProps {
  paymentId: number;
  orderId: string;
  amount: number;
  teamName: string;
  hackathonName: string;
  razorpayKeyId: string;
  userEmail: string;
  userName: string;
}

export default function CheckoutClient({
  paymentId,
  orderId,
  amount,
  teamName,
  hackathonName,
  razorpayKeyId,
  userEmail,
  userName,
}: CheckoutClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Razorpay checkout script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePay = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      if (!(window as any).Razorpay) {
        throw new Error("Payment gateway not loaded. Please wait a moment and try again.");
      }

      const options = {
        key: razorpayKeyId,
        amount: Math.round(amount * 100), // Convert rupees to paise
        currency: "INR",
        name: "Syntra Hackathon",
        description: `Registration Fee for Team ${teamName}`,
        order_id: orderId,
        handler: async function (response: any) {
          // Verify payment after Razorpay success callback
          setLoading(true);
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentId: paymentId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment verification failed.");
            }
            // Redirect to dashboard on success (matches Django's redirect('dashboard'))
            router.push("/participant/dashboard");
          } catch (err: any) {
            setError(err.message || "Failed to verify payment.");
            setLoading(false);
          }
        },
        prefill: { name: userName, email: userEmail },
        theme: { color: "#0d9488" },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      {/* Back to Dashboard */}
      <div className="w-full max-w-md mb-6">
        <button
          onClick={() => router.push("/participant/dashboard")}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
      </div>

      {/* Checkout Card */}
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Payment Checkout</h1>
            <p className="text-xs text-slate-400">Complete your team registration</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-xs text-slate-400">Hackathon</span>
            <span className="text-sm font-semibold text-white">{hackathonName}</span>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950/50 border border-slate-800">
            <span className="text-xs text-slate-400 flex items-center gap-1"><Users className="w-3 h-3" /> Team</span>
            <span className="text-sm font-semibold text-white">{teamName}</span>
          </div>
          <div className="flex justify-between items-center p-4 rounded-xl bg-teal-500/5 border border-teal-500/20">
            <span className="text-xs text-teal-300 font-bold uppercase tracking-wider">Total Fee</span>
            <span className="text-2xl font-black text-white">
              <span className="text-base text-teal-400 mr-0.5">&#8377;</span>{amount}
            </span>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center gap-2 mb-5 p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Payments are securely processed by <strong className="text-slate-300">Razorpay</strong>. Your card details are never stored on our servers.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold transition duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-55 cursor-pointer text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : (
            "Pay & Register Team"
          )}
        </button>
      </div>
    </div>
  );
}

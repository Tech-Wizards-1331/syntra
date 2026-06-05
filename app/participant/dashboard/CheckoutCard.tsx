"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, CheckCircle2, ShieldCheck, Loader2, AlertCircle, Sparkles } from "lucide-react";

interface CheckoutCardProps {
  teamId: number;
  teamName: string;
  isRegistered: boolean;
  amount: number;
  razorpayKeyId: string;
  userEmail: string;
  userName: string;
}

export default function CheckoutCard({
  teamId,
  teamName,
  isRegistered,
  amount,
  razorpayKeyId,
  userEmail,
  userName,
}: CheckoutCardProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically append Razorpay checkout script to document body
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      if (!(window as any).Razorpay) {
        throw new Error("Razorpay SDK not loaded. Please wait a moment and try again.");
      }

      // Step 1: Request order creation from server API
      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamId }),
      });

      const orderData = await response.json();
      if (!response.ok) {
        throw new Error(orderData.error || "Order creation failed.");
      }

      // Step 2: Open Razorpay Payment Modal
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Syntra Hackathon",
        description: `Registration Fee for Team ${teamName}`,
        order_id: orderData.order_id,
        handler: async function (response: any) {
          // This callback runs when payment succeeds at Razorpay
          setLoading(true);
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                paymentId: orderData.payment_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Verification failed.");
            }
            
            // Reload page to update layout and display success state
            window.location.reload();
          } catch (err: any) {
            setErrorMsg(err.message || "Failed to verify signature.");
            setLoading(false);
          }
        },
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: "#0d9488", // teal-500
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
      setLoading(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="glass-card rounded-2xl p-6 border-teal-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center text-teal-400 animate-glow-pulse">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-white mb-0.5 flex items-center gap-2">
              Registration Confirmed
              <Sparkles className="w-4 h-4 text-teal-400" />
            </h3>
            <p className="text-xs text-teal-300/80">Your team has paid the registration fee and is confirmed for the hackathon.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold bg-teal-500/15 text-teal-300 border border-teal-500/25">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Paid & Verified
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-slate-800/60 border border-slate-700/40 flex items-center justify-center text-teal-400">
            <CreditCard className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-white mb-0.5">Complete Registration</h3>
            <p className="text-xs text-slate-400">Pay the event fee to confirm team participation.</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">Total Fee</span>
          <span className="text-2xl font-black text-white">₹{amount}</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={loading}
        className="btn-cta-shimmer w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:brightness-110 text-slate-950 font-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-55 cursor-pointer text-sm hover:scale-[1.01] active:scale-[0.99] hover:shadow-teal-500/30"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Processing Checkout...
          </>
        ) : (
          "Pay & Register Team"
        )}
      </button>
    </div>
  );
}

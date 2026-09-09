"use client";

import React, { useActionState, useState, useEffect } from "react";
import Link from "next/link";
import { loginWithCredentials, loginWithProvider, resetPasswordWithOtp, sendPasswordResetOtp, verifyPasswordResetOtp } from "@/app/actions/auth";
import { Github, Lock, Mail, Loader2, ArrowRight, ChevronRight, X, CheckCircle2, AlertCircle, KeyRound, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginWithCredentials, null);
  const [resetState, resetAction, isResetPending] = useActionState(resetPasswordWithOtp, null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  // Forgot password 3-stage state:
  // 1: Enter Email & Request OTP
  // 2: Enter & Verify 6-digit OTP only
  // 3: OTP verified -> Enter & Submit New Password
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState<string | null>(null);
  const [timer, setTimer] = useState<number>(300); // 5 minutes in seconds

  // Timer countdown when in Step 2 or Step 3
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isForgotModalOpen && (resetStep === 2 || resetStep === 3) && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isForgotModalOpen, resetStep, timer]);

  // Handle successful password reset
  useEffect(() => {
    if (resetState?.success) {
      setIsForgotModalOpen(false);
      setResetStep(1);
      setResetEmail("");
      setResetOtp("");
      setOtpError(null);
      setOtpSuccessMsg(null);
    }
  }, [resetState]);

  const handleOpenForgotModal = () => {
    setIsForgotModalOpen(true);
    setResetStep(1);
    setResetOtp("");
    setOtpError(null);
    setOtpSuccessMsg(null);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetEmail.includes("@")) {
      setOtpError("Please enter a valid email address.");
      return;
    }

    setOtpError(null);
    setIsSendingOtp(true);
    try {
      const res = await sendPasswordResetOtp(resetEmail);
      if (res.error) {
        setOtpError(res.error);
      } else {
        setOtpSuccessMsg(res.message || "OTP code sent to your email!");
        setResetStep(2);
        setResetOtp("");
        setTimer(300); // Reset timer to 5 minutes
      }
    } catch (err: any) {
      setOtpError("Failed to send OTP. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length !== 6) {
      setOtpError("Please enter a valid 6-digit verification code.");
      return;
    }

    setOtpError(null);
    setIsVerifyingOtp(true);
    try {
      const res = await verifyPasswordResetOtp(resetEmail, resetOtp);
      if (res.error) {
        setOtpError(res.error);
      } else {
        setOtpSuccessMsg(res.message || "Code verified successfully!");
        setResetStep(3); // Transition to New Password form only after OTP verified!
      }
    } catch (err: any) {
      setOtpError("Failed to verify OTP. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (isSendingOtp || !resetEmail) return;
    setOtpError(null);
    setIsSendingOtp(true);
    try {
      const res = await sendPasswordResetOtp(resetEmail);
      if (res.error) {
        setOtpError(res.error);
      } else {
        setOtpSuccessMsg("A new verification code has been sent!");
        setTimer(300);
      }
    } catch (err: any) {
      setOtpError("Failed to resend code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-canvas-parchment text-ink flex flex-col font-sans antialiased selection:bg-primary selection:text-white">
      
      {/* ─── Global Nav (Apple Thin Black Bar) ─── */}
      <nav className="h-11 bg-tile-black text-white flex items-center justify-between px-6 z-40 relative text-[12px] font-normal tracking-[-0.12px]">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-bold tracking-tight text-white hover:text-white/80 transition">
              Syntra
            </Link>
          </div>
          <div className="flex items-center gap-4 text-white/60">
            <Link href="/register" className="hover:text-white transition">Create Account</Link>
          </div>
        </div>
      </nav>

      {/* ─── Sub Nav Frosted ─── */}
      <header className="sticky top-0 h-[52px] bg-canvas-parchment/80 backdrop-blur-md border-b border-black/[0.08] flex items-center justify-between px-6 z-30">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight text-ink">Sign In</span>
          <Link 
            href="/register" 
            className="px-3.5 py-1.5 text-xs font-normal bg-primary text-white rounded-pill hover:bg-primary-focus transition apple-press-effect flex items-center gap-1"
          >
            Register <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* ─── Form Container ─── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="p-8 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-ink mb-2">Welcome Back</h2>
              <p className="text-sm text-ink-muted">Sign in to manage your Syntra experience</p>
            </div>

            {/* Success Message from Password Reset */}
            {resetState?.success && !isForgotModalOpen && (
              <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{resetState.success}</span>
              </div>
            )}

            {/* Error Message */}
            {state?.error && (
              <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger text-xs font-medium leading-relaxed">
                {state.error}
              </div>
            )}

            {/* Form */}
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@college.edu"
                  required
                  disabled={isPending}
                  className="py-3 px-4 bg-canvas-pearl border border-black/[0.08] rounded-md focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Password
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgotModal}
                    className="text-[11px] text-primary hover:underline font-medium transition cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="py-3 px-4 bg-canvas-pearl border border-black/[0.08] rounded-md focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 py-3 rounded-pill bg-primary text-white font-normal text-sm hover:bg-primary-focus flex items-center justify-center gap-2 transition apple-press-effect disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-2">
              <div className="absolute inset-x-0 h-px bg-black/[0.08]" />
              <span className="relative px-3 bg-canvas text-[10px] text-ink-muted tracking-widest uppercase font-medium">Or continue with</span>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <form action={() => loginWithProvider("google")} className="w-full">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 rounded-md bg-canvas border border-black/[0.08] hover:bg-canvas-pearl font-medium text-ink text-sm transition flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer apple-press-effect"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Google
                </button>
              </form>
              <form action={() => loginWithProvider("github")} className="w-full">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 rounded-md bg-canvas border border-black/[0.08] hover:bg-canvas-pearl font-medium text-ink text-sm transition flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer apple-press-effect"
                >
                  <Github className="w-4 h-4 text-ink" />
                  GitHub
                </button>
              </form>
            </div>

            <div className="text-center mt-2">
              <p className="text-xs text-ink-muted">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline transition font-medium">
                  Register Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ─── Forgot Password Modal (3-Step: Email -> OTP Verify -> New Password) ─── */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-canvas border border-black/[0.08] w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col gap-5 relative">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-pill bg-primary/10 text-primary text-[11px] font-semibold mb-1">
                  <KeyRound className="w-3 h-3" /> Step {resetStep} of 3
                </div>
                <h3 className="text-lg font-semibold text-ink">
                  {resetStep === 1 && "Reset Password"}
                  {resetStep === 2 && "Enter Verification Code"}
                  {resetStep === 3 && "Set New Password"}
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  {resetStep === 1 && "Enter your email to receive a 6-digit verification code."}
                  {resetStep === 2 && `Enter the 6-digit code sent to ${resetEmail}`}
                  {resetStep === 3 && "Code verified! Choose your new password below."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-full text-ink-muted hover:text-ink hover:bg-black/5 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error notifications */}
            {(otpError || resetState?.error) && (
              <div className="p-3.5 rounded-xl bg-danger-light border border-danger/15 text-danger text-xs font-medium leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{otpError || resetState?.error}</span>
              </div>
            )}

            {/* Success info */}
            {otpSuccessMsg && !otpError && !resetState?.error && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium leading-relaxed flex items-start gap-2">
                {resetStep === 3 ? (
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                )}
                <span>{otpSuccessMsg}</span>
              </div>
            )}

            {/* ─── STEP 1: Enter Email & Request OTP ─── */}
            {resetStep === 1 && (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="step1-email" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Email Address
                  </label>
                  <input
                    id="step1-email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@college.edu"
                    required
                    disabled={isSendingOtp}
                    className="py-2.5 px-3.5 bg-canvas-pearl border border-black/[0.08] rounded-xl focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    disabled={isSendingOtp}
                    className="px-4 py-2 rounded-pill bg-canvas-pearl border border-black/[0.08] text-ink font-medium text-xs hover:bg-black/5 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingOtp || !resetEmail}
                    className="px-5 py-2 rounded-pill bg-primary text-white font-medium text-xs hover:bg-primary-focus flex items-center gap-2 transition apple-press-effect disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Sending Code...
                      </>
                    ) : (
                      <>
                        Send Verification Code
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ─── STEP 2: Enter & Verify OTP Only ─── */}
            {resetStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-ink-muted bg-canvas-pearl border border-black/[0.06] px-3.5 py-2 rounded-xl">
                  <span>To: <strong className="text-ink">{resetEmail}</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setOtpError(null);
                      setOtpSuccessMsg(null);
                    }}
                    className="text-primary hover:underline text-[11px] font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" /> Change
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="reset-otp" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5" /> 6-Digit Verification Code
                    </label>
                    <div className="text-[11px] font-mono font-medium">
                      {timer > 0 ? (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-pill border border-amber-200/60">
                          Expires in {formatTimer(timer)}
                        </span>
                      ) : (
                        <span className="text-danger bg-danger/10 px-2 py-0.5 rounded-pill">
                          Code Expired
                        </span>
                      )}
                    </div>
                  </div>
                  <input
                    id="reset-otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value)}
                    placeholder="123456"
                    required
                    disabled={isVerifyingOtp}
                    autoFocus
                    className="py-3 px-3.5 bg-canvas-pearl border border-black/[0.08] rounded-xl focus:outline-none focus:border-primary text-ink text-center tracking-[8px] font-mono text-xl font-bold placeholder-ink-muted/30 transition disabled:opacity-50"
                  />
                  <div className="flex items-center justify-end mt-0.5">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={isSendingOtp || timer > 240}
                      className="text-[11px] text-primary hover:underline font-medium transition disabled:opacity-40 disabled:hover:no-underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSendingOtp ? "animate-spin" : ""}`} />
                      {timer > 240 ? `Resend code in ${timer - 240}s` : "Resend Code"}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setOtpError(null);
                      setOtpSuccessMsg(null);
                    }}
                    disabled={isVerifyingOtp}
                    className="px-4 py-2 rounded-pill bg-canvas-pearl border border-black/[0.08] text-ink font-medium text-xs hover:bg-black/5 transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || resetOtp.length !== 6 || timer === 0}
                    className="px-5 py-2 rounded-pill bg-primary text-white font-medium text-xs hover:bg-primary-focus flex items-center gap-2 transition apple-press-effect disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Verifying Code...
                      </>
                    ) : (
                      <>
                        Verify OTP
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ─── STEP 3: OTP Verified -> Enter New Password & Submit ─── */}
            {resetStep === 3 && (
              <form action={resetAction} className="flex flex-col gap-4">
                {/* Hidden values for email and verified OTP */}
                <input type="hidden" name="email" value={resetEmail} />
                <input type="hidden" name="otp" value={resetOtp} />

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Email & OTP Verified for <strong>{resetEmail}</strong></span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reset-newPassword" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> New Password
                  </label>
                  <input
                    id="reset-newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="•••••••• (min 6 characters)"
                    required
                    autoFocus
                    disabled={isResetPending}
                    className="py-2.5 px-3.5 bg-canvas-pearl border border-black/[0.08] rounded-xl focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm disabled:opacity-50"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="reset-confirmPassword" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Confirm New Password
                  </label>
                  <input
                    id="reset-confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    required
                    disabled={isResetPending}
                    className="py-2.5 px-3.5 bg-canvas-pearl border border-black/[0.08] rounded-xl focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm disabled:opacity-50"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(2);
                      setOtpError(null);
                    }}
                    disabled={isResetPending}
                    className="px-4 py-2 rounded-pill bg-canvas-pearl border border-black/[0.08] text-ink font-medium text-xs hover:bg-black/5 transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isResetPending}
                    className="px-5 py-2 rounded-pill bg-primary text-white font-medium text-xs hover:bg-primary-focus flex items-center gap-2 transition apple-press-effect disabled:opacity-50 cursor-pointer"
                  >
                    {isResetPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      "Set New Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-canvas-parchment text-ink-muted border-t border-black/[0.08] py-8 px-6 text-[12px] font-normal">
        <div className="max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Syntra. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-ink transition cursor-pointer">Security</span>
            <span className="hover:text-ink transition cursor-pointer">Privacy Policy</span>
            <span className="hover:text-ink transition cursor-pointer">API Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}


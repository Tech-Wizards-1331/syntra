"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { registerWithCredentials, loginWithProvider } from "@/app/actions/auth";
import { Github, Lock, Mail, User, Loader2, ArrowRight, ChevronRight } from "lucide-react";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState(registerWithCredentials, null);

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
            <Link href="/login" className="hover:text-white transition">Sign In</Link>
          </div>
        </div>
      </nav>

      {/* ─── Sub Nav Frosted ─── */}
      <header className="sticky top-0 h-[52px] bg-canvas-parchment/80 backdrop-blur-md border-b border-black/[0.08] flex items-center justify-between px-6 z-30">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <span className="font-semibold text-lg tracking-tight text-ink">Create Account</span>
          <Link 
            href="/login" 
            className="px-3.5 py-1.5 text-xs font-normal bg-primary text-white rounded-pill hover:bg-primary-focus transition apple-press-effect flex items-center gap-1"
          >
            Sign In <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </header>

      {/* ─── Form Container ─── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="p-8 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-ink mb-2">Create Account</h2>
              <p className="text-sm text-ink-muted">Join Syntra to participate in the hackathon</p>
            </div>

            {/* Error Message */}
            {state?.error && (
              <div className="p-4 rounded-md bg-danger-light border border-danger/15 text-danger text-xs font-medium leading-relaxed">
                {state.error}
              </div>
            )}

            {/* Form */}
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="fullName" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  required
                  disabled={isPending}
                  className="py-3 px-4 bg-canvas-pearl border border-black/[0.08] rounded-md focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@college.edu"
                  required
                  disabled={isPending}
                  className="py-3 px-4 bg-canvas-pearl border border-black/[0.08] rounded-md focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Password
                </label>
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

              <div className="flex flex-col gap-2">
                <label htmlFor="confirmPassword" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
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
                    Creating Account...
                  </>
                ) : (
                  <>
                    Register Account
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
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline transition font-medium">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

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

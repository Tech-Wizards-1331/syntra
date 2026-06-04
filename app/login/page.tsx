"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { loginWithCredentials, loginWithProvider } from "@/app/actions/auth";
import { Github, Lock, Mail, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginWithCredentials, null);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-slate-900 relative">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-8 flex items-center justify-between border-b border-slate-900 z-10">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition duration-300">
            <span className="text-slate-950 font-black text-xl tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-teal-400 transition duration-300">Syntra</h1>
            <p className="text-[10px] text-teal-400 font-medium tracking-widest uppercase">NextJS Core</p>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Migration Mode
          </span>
        </div>
      </header>

      {/* Form Container */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 z-10">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-teal-500/20 hover:bg-slate-900/60 transition duration-300 shadow-glass flex flex-col gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
              <p className="text-sm text-slate-400">Sign in to manage your Syntra experience</p>
            </div>

            {/* Error Message */}
            {state?.error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium leading-relaxed">
                {state.error}
              </div>
            )}

            {/* Form */}
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-[10px] text-slate-400 font-medium tracking-widest uppercase flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@college.edu"
                  required
                  disabled={isPending}
                  className="py-3 px-4 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200 placeholder-slate-600 transition duration-300 text-sm disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="password" className="text-[10px] text-slate-400 font-medium tracking-widest uppercase flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="py-3 px-4 bg-slate-950/80 border border-slate-800 rounded-xl focus:outline-none focus:border-teal-500 text-slate-200 placeholder-slate-600 transition duration-300 text-sm disabled:opacity-50"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="mt-2 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 font-bold hover:opacity-90 shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2 transition duration-300 disabled:opacity-50 cursor-pointer"
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
              <div className="absolute inset-x-0 h-px bg-slate-800/80" />
              <span className="relative px-3 bg-slate-900 text-[10px] text-slate-500 tracking-widest uppercase font-medium">Or continue with</span>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <form action={() => loginWithProvider("google")} className="w-full">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-900 hover:border-slate-700 font-semibold text-slate-300 transition duration-300 flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  Google
                </button>
              </form>
              <form action={() => loginWithProvider("github")} className="w-full">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 rounded-xl bg-slate-950 border border-slate-800 hover:bg-slate-900 hover:border-slate-700 font-semibold text-slate-300 transition duration-300 flex items-center justify-center gap-2.5 text-sm disabled:opacity-50 cursor-pointer"
                >
                  <Github className="w-4 h-4 text-slate-300" />
                  GitHub
                </button>
              </form>
            </div>

            <div className="text-center mt-2">
              <p className="text-xs text-slate-400">
                Don't have an account?{" "}
                <Link href="/register" className="text-teal-400 hover:text-teal-300 transition duration-300 font-medium">
                  Register Account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative w-full max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between border-t border-slate-900 text-xs text-slate-500 gap-4 z-10">
        <p>&copy; {new Date().getFullYear()} Syntra next-gen framework migration.</p>
        <div className="flex gap-6">
          <span className="hover:text-slate-400 cursor-pointer">Security</span>
          <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
          <span className="hover:text-slate-400 cursor-pointer">API Status</span>
        </div>
      </footer>
    </div>
  );
}

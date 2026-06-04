import React from "react";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  LayoutDashboard, 
  Users, 
  QrCode, 
  Calendar 
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import CheckoutCard from "./CheckoutCard";

export default async function ParticipantDashboard() {
  const session = await auth();

  const userIdNum = Number(session?.user?.id);
  const team = await prisma.participant_team.findFirst({
    where: {
      OR: [
        { leader_id: userIdNum },
        {
          participant_teammember: {
            some: { email: session?.user?.email || "" }
          }
        }
      ]
    },
    include: {
      organizer_hackathon: true,
    }
  });

  const hackathon = team?.organizer_hackathon;
  const isPaidHackathon = hackathon?.is_paid || false;
  const feeAmount = hackathon?.fee_amount ? Number(hackathon.fee_amount) : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative selection:bg-teal-500 selection:text-slate-900">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="text-slate-950 font-black text-xl tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">Syntra</h1>
            <p className="text-[10px] text-teal-400 font-medium tracking-widest uppercase">Participant Console</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 border border-teal-500/20 text-teal-400">
            Participant
          </span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:border-slate-700 hover:text-red-400 transition duration-300 flex items-center gap-2 text-sm font-medium cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative flex-1 max-w-7xl mx-auto w-full px-6 py-10 z-10 flex flex-col gap-8">
        {/* Welcome Section */}
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-900 shadow-glass flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                Welcome back, {session?.user?.name || "Participant"}!
              </h2>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-sm text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-500" />
                  {session?.user?.email}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-700 hidden sm:inline" />
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-500" />
                  Profile ID: {session?.user?.profileId || "None"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment / Registration Card */}
        {team && isPaidHackathon && (
          <CheckoutCard
            teamId={team.id}
            teamName={team.name}
            isRegistered={team.is_registered}
            amount={feeAmount}
            razorpayKeyId={process.env.RAZORPAY_KEY_ID || ""}
            userEmail={session?.user?.email || ""}
            userName={session?.user?.name || ""}
          />
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-teal-500/30 hover:bg-slate-900 transition duration-300 flex flex-col gap-4 shadow-glass group">
            <div className="w-12 h-12 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-center text-teal-400 group-hover:scale-110 group-hover:bg-slate-800 transition duration-300">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1 group-hover:text-teal-400 transition duration-300">
                Team Management
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Create or join a team, manage teammates, and coordinate details for the event.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-teal-500/30 hover:bg-slate-900 transition duration-300 flex flex-col gap-4 shadow-glass group">
            <div className="w-12 h-12 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-center text-teal-400 group-hover:scale-110 group-hover:bg-slate-800 transition duration-300">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1 group-hover:text-teal-400 transition duration-300">
                QR Attendance
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Access your personal QR check-in codes for event verification and meals.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-teal-500/30 hover:bg-slate-900 transition duration-300 flex flex-col gap-4 shadow-glass group">
            <div className="w-12 h-12 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-center text-teal-400 group-hover:scale-110 group-hover:bg-slate-800 transition duration-300">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white mb-1 group-hover:text-teal-400 transition duration-300">
                Hackathon Status
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Check active schedules, submission criteria, and announcements.
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

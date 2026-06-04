import React from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileFormWrapper from "./ProfileForm";
import { LogOut } from "lucide-react";

export default async function OrganizerProfilePage() {
  const session = await auth();

  // Redirect if not logged in
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Role validation
  if (session.user.role !== "organizer") {
    if (session.user.role === "participant") {
      redirect("/participant/profile");
    } else {
      redirect("/admin/dashboard");
    }
  }

  const userIdNum = parseInt(session.user.id, 10);

  // Fetch existing profile if available
  const profile = await prisma.organizer_organizerprofile.findUnique({
    where: { user_id: userIdNum },
  });

  const existingProfile = profile
    ? {
        organizationName: profile.organization_name,
        website: profile.website,
        logo: profile.logo,
      }
    : null;

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
            <p className="text-[10px] text-teal-400 font-medium tracking-widest uppercase">Organizer Console</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Organizer
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

      {/* Main Form Content */}
      <main className="relative flex-1 flex items-center justify-center px-6 py-12 z-10">
        <ProfileFormWrapper
          existingProfile={existingProfile}
          userEmail={session.user.email || ""}
          userName={session.user.name || ""}
        />
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

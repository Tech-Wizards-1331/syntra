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
    <div className="min-h-screen bg-canvas-parchment text-ink flex flex-col font-sans relative selection:bg-primary selection:text-white">
      {/* Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-black/[0.06] z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-tile-black flex items-center justify-center">
            <span className="text-white font-semibold text-xl tracking-tighter">S</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink">Syntra</h1>
            <p className="text-[10px] text-primary font-medium tracking-widest uppercase">Organizer Console</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="px-3 py-1 rounded-pill text-xs font-semibold bg-success-light border border-success/15 text-success">
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
              className="p-2.5 rounded-md bg-canvas border border-black/[0.08] hover:bg-canvas-pearl hover:text-danger transition duration-300 flex items-center gap-2 text-sm font-normal cursor-pointer"
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
      <footer className="relative w-full max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between border-t border-black/[0.06] text-xs text-ink-muted gap-4 z-10">
        <p>&copy; {new Date().getFullYear()} Syntra. All rights reserved.</p>
        <div className="flex gap-6">
          <span className="hover:text-ink cursor-pointer transition">Security</span>
          <span className="hover:text-ink cursor-pointer transition">Privacy Policy</span>
          <span className="hover:text-ink cursor-pointer transition">API Status</span>
        </div>
      </footer>
    </div>
  );
}

import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPreseededSkills } from "@/app/actions/profile";
import ProfileFormWrapper from "./ProfileForm";
import { Settings } from "lucide-react";

export const metadata = {
  title: "Profile Settings | Syntra",
  description: "Update your participant profile, college details, and technical skills.",
};

export default async function ParticipantProfilePage() {
  const session = await auth();

  // Redirect if not logged in
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Role validation
  if (session.user.role !== "participant") {
    if (session.user.role === "organizer") {
      redirect("/organizer/profile");
    } else {
      redirect("/admin/dashboard");
    }
  }

  const userIdNum = parseInt(session.user.id, 10);

  // Fetch existing profile if available
  const existingProfileRaw = await prisma.participant_participantprofile.findUnique({
    where: { user_id: userIdNum },
    include: {
      participant_participantprofile_skills: {
        include: {
          participant_skill: true,
        },
      },
    },
  });

  const existingProfile = existingProfileRaw
    ? {
        college: existingProfileRaw.college,
        semester: existingProfileRaw.semester,
        degree: existingProfileRaw.degree,
        visibility: existingProfileRaw.visibility,
        skills: existingProfileRaw.participant_participantprofile_skills.map(
          (s) => s.participant_skill.name
        ),
      }
    : null;

  // Fetch all preseeded + db skill tags
  const preseededSkills = await getPreseededSkills();

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6 animate-fade-in-up">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-semibold text-ink tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-primary" />
          Profile Settings
        </h2>
        <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">
          Keep your academic details and skill sets updated so team leaders and event organizers can discover and recruit you.
        </p>
      </div>

      {/* Main Profile Form Wrapper */}
      <div className="p-6 md:p-8 rounded-lg bg-canvas border border-black/[0.06] apple-shadow-overlay">
        <ProfileFormWrapper
          existingProfile={existingProfile}
          preseededSkills={preseededSkills}
          userEmail={session.user.email || ""}
          userName={session.user.name || ""}
        />
      </div>
    </main>
  );
}

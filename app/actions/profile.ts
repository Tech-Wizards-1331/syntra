"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadToCloudinary } from "@/lib/services/cloudinary";

const DEFAULT_SKILLS = [
  "React", "Angular", "Vue", "Next.js", "Nuxt.js", "Svelte",
  "Node.js", "Express", "NestJS", "Django", "Flask", "FastAPI",
  "Ruby on Rails", "Spring Boot", "Laravel", "ASP.NET",
  "Python", "JavaScript", "TypeScript", "Go", "Rust", "C++",
  "Java", "Kotlin", "Swift", "Dart", "PHP", "Ruby",
  "HTML5", "CSS3", "TailwindCSS", "Sass", "Bootstrap",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Prisma",
  "Docker", "Kubernetes", "AWS", "Google Cloud", "Azure", "Git",
  "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch",
  "UI/UX Design", "Figma", "Product Management"
];

/**
 * Fetch a combined list of preseeded skills and existing DB skills.
 */
export async function getPreseededSkills(): Promise<string[]> {
  try {
    const dbSkills = await prisma.participant_skill.findMany({
      select: { name: true },
      orderBy: { name: "asc" },
    });

    const uniqueSkills = new Set([
      ...DEFAULT_SKILLS,
      ...dbSkills.map((s) => s.name),
    ]);

    return Array.from(uniqueSkills).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Error fetching preseeded skills:", error);
    return DEFAULT_SKILLS.sort((a, b) => a.localeCompare(b));
  }
}

interface OrganizerProfileInput {
  organizationName: string;
  website?: string;
  logoBase64?: string; // Optional new logo uploaded in base64
}

/**
 * Save/Update Organizer Profile.
 */
export async function saveOrganizerProfile(data: OrganizerProfileInput) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "organizer") {
    throw new Error("Unauthorized or invalid role");
  }

  const userId = parseInt(session.user.id, 10);
  if (isNaN(userId)) {
    throw new Error("Invalid user ID in session");
  }

  if (!data.organizationName || data.organizationName.trim() === "") {
    throw new Error("Organization name is required");
  }

  const now = new Date();
  let logoUrl: string | null = null;

  if (data.logoBase64) {
    try {
      logoUrl = await uploadToCloudinary(data.logoBase64);
    } catch (uploadError: any) {
      throw new Error(`Logo upload failed: ${uploadError.message}`);
    }
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Get existing profile to check if logo is already set and not being overwritten
    const existingProfile = await tx.organizer_organizerprofile.findUnique({
      where: { user_id: userId },
    });

    const finalLogoUrl = logoUrl || (existingProfile ? existingProfile.logo : null);

    // 2. Upsert Organizer Profile
    const profile = await tx.organizer_organizerprofile.upsert({
      where: { user_id: userId },
      update: {
        organization_name: data.organizationName.trim(),
        website: data.website?.trim() || null,
        logo: finalLogoUrl,
        updated_at: now,
      },
      create: {
        user_id: userId,
        organization_name: data.organizationName.trim(),
        website: data.website?.trim() || null,
        logo: finalLogoUrl,
        created_at: now,
        updated_at: now,
      },
    });

    // 3. Mark accounts_user profile as complete
    await tx.accounts_user.update({
      where: { id: userId },
      data: {
        is_profile_complete: true,
        updated_at: now,
      },
    });

    return {
      success: true,
      profileId: profile.id,
      logoUrl: finalLogoUrl,
    };
  });
}

interface ParticipantProfileInput {
  college: string;
  semester: number;
  degree: string;
  visibility: boolean;
  skills: string[];
}

/**
 * Save/Update Participant Profile.
 */
export async function saveParticipantProfile(data: ParticipantProfileInput) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "participant") {
    throw new Error("Unauthorized or invalid role");
  }

  const userId = parseInt(session.user.id, 10);
  if (isNaN(userId)) {
    throw new Error("Invalid user ID in session");
  }

  if (!data.college || data.college.trim() === "") {
    throw new Error("College name is required");
  }
  if (!data.degree || data.degree.trim() === "") {
    throw new Error("Degree is required");
  }
  if (data.semester < 1 || data.semester > 10) {
    throw new Error("Semester must be between 1 and 10");
  }

  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    // 1. Resolve skills (find or create)
    const skillRecords = await Promise.all(
      data.skills.map(async (skillName) => {
        const trimmed = skillName.trim();
        let record = await tx.participant_skill.findUnique({
          where: { name: trimmed },
        });
        if (!record) {
          record = await tx.participant_skill.create({
            data: { name: trimmed },
          });
        }
        return record;
      })
    );

    // 2. Upsert Participant Profile
    const profile = await tx.participant_participantprofile.upsert({
      where: { user_id: userId },
      update: {
        college: data.college.trim(),
        semester: data.semester,
        degree: data.degree.trim(),
        visibility: data.visibility,
        updated_at: now,
      },
      create: {
        user_id: userId,
        college: data.college.trim(),
        semester: data.semester,
        degree: data.degree.trim(),
        visibility: data.visibility,
        created_at: now,
        updated_at: now,
      },
    });

    // 3. Sync skills mappings (delete existing and insert new ones)
    await tx.participant_participantprofile_skills.deleteMany({
      where: { participantprofile_id: profile.id },
    });

    if (skillRecords.length > 0) {
      await tx.participant_participantprofile_skills.createMany({
        data: skillRecords.map((skill) => ({
          participantprofile_id: profile.id,
          skill_id: skill.id,
        })),
      });
    }

    // 4. Mark accounts_user profile as complete
    await tx.accounts_user.update({
      where: { id: userId },
      data: {
        is_profile_complete: true,
        updated_at: now,
      },
    });

    return {
      success: true,
      profileId: profile.id,
    };
  });
}

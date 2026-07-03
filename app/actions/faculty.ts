"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/django-password";
import { revalidatePath } from "next/cache";

// ─── Helper: Validate organizer ownership ───────────────────────────
async function validateHackathonOwner(hackathonId: number, userId: number) {
  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: hackathonId },
    include: { organizer_organizerprofile: true },
  });

  if (!hackathon) {
    throw new Error("Hackathon not found");
  }

  if (hackathon.organizer_organizerprofile.user_id !== userId) {
    throw new Error("Access denied: You do not own this hackathon");
  }

  return hackathon;
}

// ─── Evaluation Criteria (Organizer) ────────────────────────────────

export async function getEvaluationCriteria(hackathonId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return await prisma.evaluation_criterion.findMany({
    where: { hackathon_id: hackathonId },
    orderBy: { display_order: "asc" },
  });
}

export async function createEvaluationCriterion(
  hackathonId: number,
  data: { name: string; description?: string; max_score: number }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "organizer") {
    throw new Error("Unauthorized");
  }

  await validateHackathonOwner(hackathonId, Number(session.user.id));

  if (!data.name.trim()) throw new Error("Criterion name is required");
  if (data.max_score < 1) throw new Error("Max score must be at least 1");

  // Get the next display_order
  const maxOrder = await prisma.evaluation_criterion.aggregate({
    where: { hackathon_id: hackathonId },
    _max: { display_order: true },
  });

  const criterion = await prisma.evaluation_criterion.create({
    data: {
      hackathon_id: hackathonId,
      name: data.name.trim(),
      description: data.description?.trim() || "",
      max_score: data.max_score,
      display_order: (maxOrder._max.display_order ?? -1) + 1,
    },
  });

  revalidatePath(`/organizer/dashboard/hackathons/${hackathonId}`);
  return { success: true, criterionId: criterion.id };
}

export async function updateEvaluationCriterion(
  criterionId: number,
  data: { name: string; description?: string; max_score: number }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "organizer") {
    throw new Error("Unauthorized");
  }

  const criterion = await prisma.evaluation_criterion.findUnique({
    where: { id: criterionId },
    include: {
      organizer_hackathon: { include: { organizer_organizerprofile: true } },
    },
  });

  if (!criterion) throw new Error("Criterion not found");
  if (criterion.organizer_hackathon.organizer_organizerprofile.user_id !== Number(session.user.id)) {
    throw new Error("Access denied");
  }

  if (!data.name.trim()) throw new Error("Criterion name is required");
  if (data.max_score < 1) throw new Error("Max score must be at least 1");

  await prisma.evaluation_criterion.update({
    where: { id: criterionId },
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || "",
      max_score: data.max_score,
    },
  });

  revalidatePath(`/organizer/dashboard/hackathons/${criterion.hackathon_id}`);
  return { success: true };
}

export async function deleteEvaluationCriterion(criterionId: number) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "organizer") {
    throw new Error("Unauthorized");
  }

  const criterion = await prisma.evaluation_criterion.findUnique({
    where: { id: criterionId },
    include: {
      organizer_hackathon: { include: { organizer_organizerprofile: true } },
    },
  });

  if (!criterion) throw new Error("Criterion not found");
  if (criterion.organizer_hackathon.organizer_organizerprofile.user_id !== Number(session.user.id)) {
    throw new Error("Access denied");
  }

  await prisma.evaluation_criterion.delete({ where: { id: criterionId } });

  revalidatePath(`/organizer/dashboard/hackathons/${criterion.hackathon_id}`);
  return { success: true };
}

// ─── Faculty Assignment (Organizer) ─────────────────────────────────

export async function assignFaculty(
  hackathonId: number,
  data: { email: string; name: string; defaultPassword: string }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "organizer") {
    throw new Error("Unauthorized");
  }

  await validateHackathonOwner(hackathonId, Number(session.user.id));

  const email = data.email.toLowerCase().trim();
  if (!email) throw new Error("Faculty email is required");
  if (!data.name.trim()) throw new Error("Faculty name is required");
  if (!data.defaultPassword || data.defaultPassword.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  // Check if user already exists
  let user = await prisma.accounts_user.findUnique({ where: { email } });
  const now = new Date();

  if (!user) {
    // Auto-create account with hashed password (Django-compatible PBKDF2)
    const hashedPassword = hashPassword(data.defaultPassword);
    const nameParts = data.name.trim().split(" ");

    user = await prisma.accounts_user.create({
      data: {
        email,
        password: hashedPassword,
        first_name: nameParts[0] || "",
        last_name: nameParts.slice(1).join(" ") || "",
        full_name: data.name.trim(),
        is_superuser: false,
        is_staff: false,
        is_active: true,
        date_joined: now,
        created_at: now,
        updated_at: now,
        is_profile_complete: true,
        role: "faculty",
      },
    });

    // Create faculty profile
    await prisma.faculty_profile.create({
      data: {
        user_id: user.id,
        department: "",
        designation: "",
      },
    });
  } else {
    // If user exists but is not faculty, update role to faculty
    if (user.role !== "faculty") {
      await prisma.accounts_user.update({
        where: { id: user.id },
        data: { role: "faculty", updated_at: now },
      });
    }

    // Ensure faculty profile exists
    const existingProfile = await prisma.faculty_profile.findUnique({
      where: { user_id: user.id },
    });
    if (!existingProfile) {
      await prisma.faculty_profile.create({
        data: {
          user_id: user.id,
          department: "",
          designation: "",
        },
      });
    }
  }

  // Check if already assigned
  const existing = await prisma.hackathon_faculty.findUnique({
    where: {
      hackathon_id_faculty_user_id: {
        hackathon_id: hackathonId,
        faculty_user_id: user.id,
      },
    },
  });

  if (existing) {
    if (existing.is_active) {
      throw new Error("This faculty is already assigned to this hackathon");
    }
    // Re-activate
    await prisma.hackathon_faculty.update({
      where: { id: existing.id },
      data: { is_active: true },
    });
  } else {
    await prisma.hackathon_faculty.create({
      data: {
        hackathon_id: hackathonId,
        faculty_user_id: user.id,
      },
    });
  }

  revalidatePath(`/organizer/dashboard/hackathons/${hackathonId}`);
  return { success: true, facultyUserId: user.id };
}

export async function removeFaculty(hackathonFacultyId: number) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "organizer") {
    throw new Error("Unauthorized");
  }

  const assignment = await prisma.hackathon_faculty.findUnique({
    where: { id: hackathonFacultyId },
    include: {
      organizer_hackathon: { include: { organizer_organizerprofile: true } },
    },
  });

  if (!assignment) throw new Error("Assignment not found");
  if (assignment.organizer_hackathon.organizer_organizerprofile.user_id !== Number(session.user.id)) {
    throw new Error("Access denied");
  }

  await prisma.hackathon_faculty.update({
    where: { id: hackathonFacultyId },
    data: { is_active: false },
  });

  revalidatePath(`/organizer/dashboard/hackathons/${assignment.hackathon_id}`);
  return { success: true };
}

export async function getAssignedFaculty(hackathonId: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return await prisma.hackathon_faculty.findMany({
    where: { hackathon_id: hackathonId, is_active: true },
    include: {
      accounts_user: {
        select: { id: true, email: true, full_name: true },
      },
    },
    orderBy: { assigned_at: "desc" },
  });
}

// ─── Faculty Evaluation (Faculty) ───────────────────────────────────

export async function getFacultyHackathons() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "faculty") {
    throw new Error("Unauthorized");
  }

  const assignments = await prisma.hackathon_faculty.findMany({
    where: {
      faculty_user_id: Number(session.user.id),
      is_active: true,
    },
    include: {
      organizer_hackathon: {
        select: {
          id: true,
          name: true,
          status: true,
          start_date: true,
          end_date: true,
          _count: {
            select: { participant_team: true },
          },
        },
      },
    },
    orderBy: { assigned_at: "desc" },
  });

  return assignments.map((a) => ({
    hackathonFacultyId: a.id,
    hackathon: a.organizer_hackathon,
  }));
}

export async function getFacultyHackathonDetail(hackathonId: number) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "faculty") {
    throw new Error("Unauthorized");
  }

  // Verify assignment
  const assignment = await prisma.hackathon_faculty.findFirst({
    where: {
      hackathon_id: hackathonId,
      faculty_user_id: Number(session.user.id),
      is_active: true,
    },
  });

  if (!assignment) {
    throw new Error("You are not assigned to this hackathon");
  }

  const hackathon = await prisma.organizer_hackathon.findUnique({
    where: { id: hackathonId },
    include: {
      evaluation_criterion: { orderBy: { display_order: "asc" } },
      participant_team: {
        where: { is_registered: true },
        include: {
          accounts_user: { select: { full_name: true, email: true } },
          participant_teammember: {
            select: { name: true, email: true },
          },
          organizer_problemstatement: {
            select: { id: true, title: true },
          },
          evaluation_score: {
            where: { hackathon_faculty_id: assignment.id },
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!hackathon) throw new Error("Hackathon not found");

  return {
    hackathon,
    hackathonFacultyId: assignment.id,
  };
}

export async function submitEvaluations(
  hackathonFacultyId: number,
  teamId: number,
  scores: { criterionId: number; score: number; comment: string }[]
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "faculty") {
    throw new Error("Unauthorized");
  }

  // Verify the assignment belongs to this faculty
  const assignment = await prisma.hackathon_faculty.findUnique({
    where: { id: hackathonFacultyId },
  });

  if (!assignment || assignment.faculty_user_id !== Number(session.user.id)) {
    throw new Error("Access denied");
  }

  // Validate scores against criteria max_score
  const criteria = await prisma.evaluation_criterion.findMany({
    where: { hackathon_id: assignment.hackathon_id },
  });

  const criteriaMap = new Map(criteria.map((c) => [c.id, c]));

  for (const s of scores) {
    const criterion = criteriaMap.get(s.criterionId);
    if (!criterion) throw new Error(`Invalid criterion: ${s.criterionId}`);
    if (s.score < 0 || s.score > criterion.max_score) {
      throw new Error(`Score for "${criterion.name}" must be between 0 and ${criterion.max_score}`);
    }
  }

  // Upsert scores
  for (const s of scores) {
    await prisma.evaluation_score.upsert({
      where: {
        criterion_id_team_id_hackathon_faculty_id: {
          criterion_id: s.criterionId,
          team_id: teamId,
          hackathon_faculty_id: hackathonFacultyId,
        },
      },
      update: {
        score: s.score,
        comment: s.comment || "",
      },
      create: {
        criterion_id: s.criterionId,
        team_id: teamId,
        hackathon_faculty_id: hackathonFacultyId,
        score: s.score,
        comment: s.comment || "",
      },
    });
  }

  revalidatePath(`/faculty/hackathons/${assignment.hackathon_id}`);
  return { success: true };
}

// ─── Evaluation Report (Organizer) ──────────────────────────────────

export async function getEvaluationReport(hackathonId: number) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "organizer") {
    throw new Error("Unauthorized");
  }

  await validateHackathonOwner(hackathonId, Number(session.user.id));

  const criteria = await prisma.evaluation_criterion.findMany({
    where: { hackathon_id: hackathonId },
    orderBy: { display_order: "asc" },
  });

  const teams = await prisma.participant_team.findMany({
    where: { hackathon_id: hackathonId, is_registered: true },
    include: {
      accounts_user: { select: { full_name: true } },
      evaluation_score: {
        include: {
          evaluation_criterion: { select: { name: true, max_score: true } },
          hackathon_faculty: {
            include: { accounts_user: { select: { full_name: true } } },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return { criteria, teams };
}

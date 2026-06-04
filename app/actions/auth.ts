"use server";

import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/django-password";
import { AuthError } from "next-auth";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export async function loginWithCredentials(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = loginSchema.safeParse({ email, password });
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  try {
    await signIn("credentials", {
      email: email.toLowerCase(),
      password,
      redirectTo: "/participant/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password. Please try again or log in via social providers." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    throw error;
  }
}

export async function registerWithCredentials(prevState: any, formData: FormData) {
  const fullName = formData.get("fullName") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  const result = registerSchema.safeParse({ fullName, email, password, confirmPassword });
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const cleanEmail = email.toLowerCase();

  try {
    const existingUser = await prisma.accounts_user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return { error: "An account with this email already exists." };
    }

    const hashedPassword = hashPassword(password);
    const now = new Date();

    const nameParts = fullName.trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    await prisma.$transaction(async (tx) => {
      const newUser = await tx.accounts_user.create({
        data: {
          email: cleanEmail,
          password: hashedPassword,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          is_superuser: false,
          is_staff: false,
          is_active: true,
          date_joined: now,
          created_at: now,
          updated_at: now,
          is_profile_complete: false,
          role: "participant",
        },
      });

      await tx.participant_participantprofile.create({
        data: {
          user_id: newUser.id,
          college: "",
          semester: 1,
          degree: "",
          visibility: true,
          created_at: now,
          updated_at: now,
        },
      });
    });
  } catch (err: any) {
    console.error("Registration error:", err);
    return { error: "Failed to register account. Please try again." };
  }

  // Log in user immediately after registration
  try {
    await signIn("credentials", {
      email: cleanEmail,
      password,
      redirectTo: "/participant/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Registration succeeded, but auto-login failed. Please sign in manually." };
    }
    throw error;
  }
}

export async function loginWithProvider(provider: "google" | "github") {
  await signIn(provider, { redirectTo: "/participant/dashboard" });
}

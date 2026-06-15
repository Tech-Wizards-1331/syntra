import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/django-password";

export const { auth, signIn, signOut, handlers, unstable_update } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase();
        const dbUser = await prisma.accounts_user.findUnique({
          where: { email },
        });

        if (!dbUser || !dbUser.password) {
          return null;
        }

        const isValid = verifyPassword(credentials.password as string, dbUser.password);
        if (!isValid) {
          return null;
        }

        // Get user role and profile ID
        let profileId: number | null = null;
        if (dbUser.role === "participant") {
          const profile = await prisma.participant_participantprofile.findUnique({
            where: { user_id: dbUser.id },
          });
          profileId = profile?.id ?? null;
        } else if (dbUser.role === "organizer") {
          const profile = await prisma.organizer_organizerprofile.findUnique({
            where: { user_id: dbUser.id },
          });
          profileId = profile?.id ?? null;
        }

        return {
          id: dbUser.id.toString(),
          email: dbUser.email,
          name: dbUser.full_name,
          role: dbUser.role,
          profileId,
          isProfileComplete: dbUser.is_profile_complete,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.profileId = user.profileId;
        token.isProfileComplete = user.isProfileComplete;

        // If user fields are missing (e.g. initial social login sign-in), query database once and populate the token
        if (user.role === undefined || user.isProfileComplete === undefined) {
          const dbUser = await prisma.accounts_user.findUnique({
            where: { email: user.email! },
            select: {
              id: true,
              role: true,
              is_profile_complete: true,
              participant_participantprofile: { select: { id: true } },
              organizer_organizerprofile: { select: { id: true } },
            },
          });
          if (dbUser) {
            token.id = dbUser.id.toString();
            token.role = dbUser.role;
            token.isProfileComplete = dbUser.is_profile_complete;
            token.profileId =
              dbUser.role === "participant"
                ? dbUser.participant_participantprofile?.id
                : dbUser.role === "organizer"
                ? dbUser.organizer_organizerprofile?.id
                : null;
          }
        }
      }

      if (trigger === "update" && session) {
        const isProfileComplete = session.user?.isProfileComplete !== undefined ? session.user.isProfileComplete : session.isProfileComplete;
        const profileId = session.user?.profileId !== undefined ? session.user.profileId : session.profileId;

        if (isProfileComplete !== undefined) {
          token.isProfileComplete = isProfileComplete;
        }
        if (profileId !== undefined) {
          token.profileId = profileId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string | null) ?? null;
        session.user.profileId = (token.profileId as number | null) ?? null;
        session.user.isProfileComplete = (token.isProfileComplete as boolean | null) ?? null;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        if (!user.email) return false;

        const email = user.email.toLowerCase();
        const existingUser = await prisma.accounts_user.findUnique({
          where: { email },
          include: {
            participant_participantprofile: true,
          },
        });

        const now = new Date();

        if (!existingUser) {
          // Create user and profile sequentially
          const newUser = await prisma.accounts_user.create({
            data: {
              email,
              password: "", // No password for social logins
              first_name: user.name?.split(" ")[0] || "",
              last_name: user.name?.split(" ").slice(1).join(" ") || "",
              full_name: user.name || "",
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

          await prisma.participant_participantprofile.create({
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
        } else if (!existingUser.role) {
          // If user exists but role is empty, set role and ensure profile exists
          await prisma.accounts_user.update({
            where: { id: existingUser.id },
            data: { role: "participant" },
          });

          if (!existingUser.participant_participantprofile) {
            await prisma.participant_participantprofile.create({
              data: {
                user_id: existingUser.id,
                college: "",
                semester: 1,
                degree: "",
                visibility: true,
                created_at: now,
                updated_at: now,
              },
            });
          }
        }
      }
      return true;
    },
  },
});

export const { GET, POST } = handlers;


import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export const authConfig = {
  secret: process.env.AUTH_SECRET || "8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b",
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized() {
      // Let middleware.ts handle all redirection logic explicitly
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.profileId = user.profileId;
        token.isProfileComplete = user.isProfileComplete;
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
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID || process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.AUTH_GITHUB_SECRET || process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
} satisfies NextAuthConfig;

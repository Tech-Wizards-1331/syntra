import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string | null;
      profileId: number | null;
      isProfileComplete: boolean | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string | null;
    profileId?: number | null;
    isProfileComplete?: boolean | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string | null;
    profileId?: number | null;
    isProfileComplete?: boolean | null;
  }
}

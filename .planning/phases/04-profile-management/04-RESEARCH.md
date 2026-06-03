# Technical Research: Phase 4 (Profile Management)

## 1. Cloudinary Server-Side Upload Integration

We will use the official `cloudinary` package on the server-side to upload logos. Since `.env` includes a `CLOUDINARY_URL`, we can configure Cloudinary automatically:

```typescript
import { v2 as cloudinary } from "cloudinary";

// Cloudinary extracts settings automatically if CLOUDINARY_URL is present in process.env.
// Alternatively, we can parse or configure explicitly:
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL
});

export async function uploadToCloudinary(base64Data: string): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: "syntra_logos",
    resource_type: "auto"
  });
  return result.secure_url;
}
```

---

## 2. Participant Skills Database Operations

To update a participant's skills in a single transaction:
1. Lookup or create missing skills in `participant_skill`.
2. Clear old mappings in `participant_participantprofile_skills`.
3. Create new mappings in `participant_participantprofile_skills`.

```typescript
import { prisma } from "@/lib/prisma";

export async function updateParticipantSkills(profileId: number, skillNames: string[]) {
  return await prisma.$transaction(async (tx) => {
    // 1. Resolve all skill IDs (create if missing)
    const skillIds: number[] = [];
    for (const name of skillNames) {
      const cleanName = name.trim();
      if (!cleanName) continue;
      
      const skill = await tx.participant_skill.upsert({
        where: { name: cleanName },
        update: {},
        create: { name: cleanName }
      });
      skillIds.push(skill.id);
    }

    // 2. Remove existing skill associations for this profile
    await tx.participant_participantprofile_skills.deleteMany({
      where: { participantprofile_id: profileId }
    });

    // 3. Create new associations
    if (skillIds.length > 0) {
      await tx.participant_participantprofile_skills.createMany({
        data: skillIds.map(skillId => ({
          participantprofile_id: profileId,
          skill_id: skillId
        }))
      });
    }
  });
}
```

---

## 3. Middleware Redirects and Token Updates

To check profile completion status in middleware without hitting the database, we embed `isProfileComplete` in the NextAuth session cookie:

### Auth Configuration updates (`auth.ts`)
```typescript
// callbacks
async jwt({ token, user, trigger, session }) {
  if (user) {
    token.role = user.role;
    token.profileId = user.profileId;
    token.isProfileComplete = user.isProfileComplete;
  }
  if (trigger === "update" && session) {
    token.isProfileComplete = session.isProfileComplete;
    token.profileId = session.profileId;
  }
  return token;
}
```

### Middleware Check (`middleware.ts`)
```typescript
const isProfileComplete = req.auth?.user?.isProfileComplete;
const isProfilePage = nextUrl.pathname === "/organizer/profile" || nextUrl.pathname === "/participant/profile";

if (isLoggedIn && !isProfileComplete && !isProfilePage) {
  if (userRole === "organizer") {
    return Response.redirect(new URL("/organizer/profile", nextUrl));
  }
  if (userRole === "participant") {
    return Response.redirect(new URL("/participant/profile", nextUrl));
  }
}
```

---

## 4. Validation Architecture

We will implement unit tests targeting the profile action helpers, ensuring skill tag mapping, user profile creation, and validation logic run successfully. Tests will be executed offline using Vitest.

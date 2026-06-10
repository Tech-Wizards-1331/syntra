# Technical Research: Phase 5 (Hackathons, Problem Statements & Categories)

## 1. Cloudinary Direct Signed Upload Architecture
To prevent exceeding Next.js Server Action body size limits (default 1MB, or Vercel's 4.5MB payload limit) when uploading PDFs up to 10MB, we will implement **Client-side Direct Signed Uploads**:
1. The server provides a secure signed upload signature.
2. The client browser uploads the file directly to Cloudinary's API.
3. The client passes only the resulting secure URL to the Problem Statement server action.

### Signature Generator Action in [app/actions/hackathons.ts](file:///app/actions/hackathons.ts):
```typescript
import { v2 as cloudinary } from "cloudinary";

export async function getCloudinarySignature() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "organizer") {
    throw new Error("Unauthorized");
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    folder: "syntra_problem_statements",
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "syntra",
  };
}
```

### Cloudinary Asset Cleanup helper in [lib/services/cloudinary.ts](file:///lib/services/cloudinary.ts):
```typescript
/**
 * Deletes an asset from Cloudinary using its URL.
 * Extracts the public ID from the URL and calls the destroy API.
 */
export async function deleteFromCloudinary(url: string): Promise<boolean> {
  try {
    // Extract public ID (e.g. https://res.cloudinary.com/cloud/image/upload/v1234/folder/name.pdf)
    const matches = url.match(/\/v\d+\/([^\s]+)\.[a-z0-9]+$/i);
    if (!matches) return false;
    const publicId = matches[1];

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: url.includes(".pdf") ? "raw" : "image"
    });
    return result.result === "ok";
  } catch (error) {
    console.error("Failed to delete Cloudinary asset:", error);
    return false;
  }
}
```

---

## 2. Hackathon Phase Management (HACK-02 Parity)
As analyzed from the legacy Django codebase, there is no separate "Phase" table. The hackathon's phase is represented by the `status` field.
To fulfill HACK-02 ("define phases") with strict validations:
- **Allowed States**: `draft`, `registration`, `active`, and `completed`.
- **Validation Rules**:
  - `draft` / `registration`: registration deadline and dates can be edited.
  - `active` / `completed`: lock registration deadline edits to preserve consistency.
- **Allowed Transitions**:
  - `draft` -> `registration` -> `active` -> `completed`
  - Allows reverting `registration` -> `draft`.
  - Blocks skipping states (e.g., `draft` -> `active` or `active` -> `draft`).

---

## 3. Concurrency-Safe Scan Categories Auto-Ordering
To avoid race conditions and duplicate display order indices during simultaneous creation:
We execute category counting and creation inside a serializable Prisma `$transaction`.

```typescript
export async function createScanCategory(hackathonId: number, name: string) {
  // Authorization checks...
  
  return await prisma.$transaction(async (tx) => {
    // Check duplicate name
    const existing = await tx.organizer_scancategory.findFirst({
      where: { hackathon_id: hackathonId, name }
    });
    if (existing) throw new Error("Scan category name already exists.");

    // Concurrency safe count query
    const count = await tx.organizer_scancategory.count({
      where: { hackathon_id: hackathonId }
    });

    return await tx.organizer_scancategory.create({
      data: {
        hackathon_id: hackathonId,
        name,
        display_order: count + 1,
        is_active: true,
        created_at: new Date()
      }
    });
  });
}
```

---

## 4. Deletion Safety & Integrity Checks
To prevent orphan database records or breaking dependent relation graphs (e.g., scan logs):
- **Hackathons Deletion**:
  - Prevent deleting hackathons with active team registrations (`participant_team.count() > 0`).
  - Otherwise, perform cascade cleanup of related problem statements and scan categories.
- **Problem Statements Deletion**:
  - Prevent deletion if any registered team has selected the statement (`participant_team.count() > 0`).
  - Delete the associated PDF from Cloudinary upon successful deletion.

---

## 5. Next.js Mutation Revalidation
Every mutation (create, edit, toggle, delete) in server actions will call `revalidatePath` to clear Next.js Router Cache and ensure immediate UI updates:
- `revalidatePath("/organizer/dashboard")`
- `revalidatePath(\`/organizer/dashboard/hackathons/\${hackathonId}\`)`

"use client";

import React, { useState, useTransition, useRef } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { saveOrganizerProfile } from "@/app/actions/profile";
import { 
  Building2, 
  Globe, 
  UploadCloud, 
  Check, 
  Loader2, 
  AlertCircle, 
  X,
  Image as ImageIcon
} from "lucide-react";

interface ProfileFormProps {
  existingProfile: {
    organizationName: string;
    website: string | null;
    logo: string | null;
  } | null;
  userEmail: string;
  userName: string;
}

function OrganizerProfileForm({
  existingProfile,
  userEmail,
  userName,
}: ProfileFormProps) {
  const { update } = useSession();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [organizationName, setOrganizationName] = useState(existingProfile?.organizationName || "");
  const [website, setWebsite] = useState(existingProfile?.website || "");
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);
  const [logoPreview, setLogoPreview] = useState<string | null>(existingProfile?.logo || null);

  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File processing function
  const processFile = (file: File) => {
    setError(null);

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit. Please upload a smaller image.");
      return;
    }

    // Validate type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Invalid file type. Only JPG, JPEG, and PNG are allowed.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoBase64(base64);
      setLogoPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemoveLogo = () => {
    setLogoBase64(undefined);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!organizationName.trim()) {
      setError("Organization name is required.");
      return;
    }

    startTransition(async () => {
      try {
        const result = await saveOrganizerProfile({
          organizationName,
          website: website || undefined,
          logoBase64,
        });

        if (result.success) {
          setSuccess(true);

          // Update the session token with the new values
          await update({
            isProfileComplete: true,
            profileId: result.profileId,
          });

          // Hard redirect ensures the browser sends the updated JWT cookie
          setTimeout(() => {
            window.location.href = "/organizer/dashboard";
          }, 1000);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong while saving your profile.");
      }
    });
  };

  return (
    <div className="w-full max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-ink">Complete Your Organizer Profile</h2>
          <p className="text-xs text-ink-muted">Set up your organization workspace settings below.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* User static info banner */}
        <div className="p-4 rounded-md bg-canvas-parchment border border-black/[0.06] flex flex-col sm:flex-row justify-between gap-3 text-sm text-ink-muted">
          <div>
            <span className="text-ink-muted text-[10px] font-semibold uppercase tracking-wider block">Account Admin</span>
            <span className="text-ink font-semibold text-sm">{userName}</span>
          </div>
          <div>
            <span className="text-ink-muted text-[10px] font-semibold uppercase tracking-wider block">Admin Email</span>
            <span className="text-ink font-semibold text-sm">{userEmail}</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-md bg-danger-light border border-danger/15 flex items-center gap-3 text-danger text-xs font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-md bg-success-light border border-success/15 flex items-center gap-3 text-success text-xs font-medium">
            <Check className="w-4 h-4 shrink-0" />
            <span>Profile saved successfully! Redirecting to workspace dashboard...</span>
          </div>
        )}

        {/* Organization Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="orgName" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Organization Name
          </label>
          <input
            id="orgName"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="e.g. Syntra Labs"
            className="py-3 px-4 bg-canvas-pearl border border-black/[0.08] rounded-md focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm disabled:opacity-50"
            disabled={isPending}
          />
        </div>

        {/* Website */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="website" className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> Organization Website
          </label>
          <input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="e.g. https://syntralabs.org"
            className="py-3 px-4 bg-canvas-pearl border border-black/[0.08] rounded-md focus:outline-none focus:border-primary text-ink placeholder-ink-muted/50 transition text-sm disabled:opacity-50"
            disabled={isPending}
          />
        </div>

        {/* Drag & Drop Logo Upload */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-ink-muted font-semibold tracking-wider uppercase flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5" /> Organization Logo
          </label>

          <input
            ref={fileInputRef}
            id="logo-upload"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileChange}
            className="hidden"
            disabled={isPending}
          />

          {!logoPreview ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => !isPending && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-md p-8 flex flex-col items-center justify-center gap-3 transition cursor-pointer select-none ${
                dragActive 
                  ? "border-primary bg-primary/5 text-primary" 
                  : "border-black/[0.12] hover:border-black/[0.2] bg-canvas-pearl text-ink-muted hover:text-ink"
              }`}
            >
              <div className="w-12 h-12 rounded-lg bg-canvas-parchment border border-black/[0.06] flex items-center justify-center">
                <UploadCloud className="w-6 h-6 text-ink-muted" />
              </div>
              <div className="text-center">
                <span className="font-semibold text-sm text-ink">Click to upload</span> or drag and drop
                <p className="text-[10px] text-ink-muted mt-1">PNG, JPG, or JPEG up to 5MB</p>
              </div>
            </div>
          ) : (
            <div className="relative border border-black/[0.08] rounded-md p-6 bg-canvas-parchment/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Preview Image */}
                <div className="relative w-16 h-16 rounded-lg border border-black/[0.08] overflow-hidden bg-canvas flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreview}
                    alt="Organization logo preview"
                    className="object-contain w-full h-full"
                  />
                </div>
                <div>
                  <span className="font-semibold text-sm text-ink block">Organization Logo Selected</span>
                  <span className="text-xs text-ink-muted">
                    {logoBase64 ? "New upload ready" : "Currently saved logo"}
                  </span>
                </div>
              </div>
              
              {!isPending && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3 py-1.5 rounded-md bg-danger-light border border-danger/15 text-danger hover:bg-danger/10 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer apple-press-effect"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove Image</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending || success}
          className="w-full py-3 rounded-pill bg-primary hover:bg-primary-focus text-white font-normal text-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer apple-press-effect"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Configuration...</span>
            </>
          ) : (
            <span>Save Profile & Complete Setup</span>
          )}
        </button>
      </form>
    </div>
  );
}

export default function ProfileFormWrapper(props: ProfileFormProps) {
  return (
    <SessionProvider>
      <OrganizerProfileForm {...props} />
    </SessionProvider>
  );
}

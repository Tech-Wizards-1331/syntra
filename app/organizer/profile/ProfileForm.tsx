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
  Sparkles,
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

          // Redirect to organizer dashboard after delay
          setTimeout(() => {
            router.push("/organizer/dashboard");
            router.refresh();
          }, 1000);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong while saving your profile.");
      }
    });
  };

  return (
    <div className="w-full max-w-xl bg-slate-900/40 border border-slate-800 rounded-3xl p-8 shadow-glass relative backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Complete Your Organizer Profile</h2>
          <p className="text-sm text-slate-400">Set up your organization workspace settings below.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User static info banner */}
        <div className="p-4 rounded-2xl bg-slate-950/50 border border-slate-900 flex flex-col sm:flex-row justify-between gap-3 text-sm text-slate-400">
          <div>
            <span className="text-slate-500 font-medium block">Account Admin</span>
            <span className="text-slate-200 font-semibold">{userName}</span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Admin Email</span>
            <span className="text-slate-200 font-semibold">{userEmail}</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-emerald-400 text-sm">
            <Check className="w-5 h-5 shrink-0" />
            <span>Profile saved successfully! Redirecting to workspace dashboard...</span>
          </div>
        )}

        {/* Organization Name */}
        <div className="flex flex-col gap-2">
          <label htmlFor="orgName" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" /> Organization Name
          </label>
          <input
            id="orgName"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder="e.g. Syntra Labs"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-slate-100 transition placeholder-slate-600 outline-none"
            disabled={isPending}
          />
        </div>

        {/* Website */}
        <div className="flex flex-col gap-2">
          <label htmlFor="website" className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Globe className="w-4 h-4 text-slate-500" /> Organization Website
          </label>
          <input
            id="website"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="e.g. https://syntralabs.org"
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 text-slate-100 transition placeholder-slate-600 outline-none"
            disabled={isPending}
          />
        </div>

        {/* Drag & Drop Logo Upload */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-slate-500" /> Organization Logo
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
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 transition cursor-pointer select-none ${
                dragActive 
                  ? "border-emerald-500 bg-emerald-500/5 text-emerald-400" 
                  : "border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400 hover:text-slate-300"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-850 flex items-center justify-center">
                <UploadCloud className="w-6 h-6 text-slate-400" />
              </div>
              <div className="text-center">
                <span className="font-semibold text-sm text-slate-200">Click to upload</span> or drag and drop
                <p className="text-[10px] text-slate-500 mt-1">PNG, JPG, or JPEG up to 5MB</p>
              </div>
            </div>
          ) : (
            <div className="relative border border-slate-800 rounded-2xl p-6 bg-slate-950/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Preview Image */}
                <div className="relative w-16 h-16 rounded-xl border border-slate-850 overflow-hidden bg-slate-900 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreview}
                    alt="Organization logo preview"
                    className="object-contain w-full h-full"
                  />
                </div>
                <div>
                  <span className="font-semibold text-sm text-slate-200 block">Organization Logo Selected</span>
                  <span className="text-xs text-slate-500">
                    {logoBase64 ? "New upload ready" : "Currently saved logo"}
                  </span>
                </div>
              </div>
              
              {!isPending && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
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
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-450 hover:to-teal-450 text-slate-950 font-bold tracking-wide transition shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving Configuration...</span>
            </>
          ) : (
            <span>Save Profile &amp; Complete Setup</span>
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
